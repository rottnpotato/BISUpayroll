import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { verifyToken } from "@/lib/auth"
import { AttendancePunchType, AttendanceStatus, Prisma } from "@prisma/client"
import {
  parseManilaLocal,
  manilaStartOfDayUTC,
  toManilaDateKey,
  getManilaHours,
  getManilaMinutes,
} from "@/lib/timezone"
import {
  getScheduleForEmployeeType,
  timeToMinutes,
  calculateLateAndUndertime,
} from "@/lib/attendance-schedules"
import { AuditLogger } from "@/lib/audit-logger"

interface ManualPunchBody {
  userId?: string
  date?: string
  morningTimeIn?: string | null
  morningTimeOut?: string | null
  afternoonTimeIn?: string | null
  afternoonTimeOut?: string | null
  reason?: string | null
}

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

const toUtcFromManila = (date: string, time: string | null | undefined): Date | null => {
  if (!time) return null
  if (!HHMM_REGEX.test(time)) {
    throw new Error(`Invalid time format "${time}". Expected HH:MM in 24-hour format.`)
  }
  return parseManilaLocal(`${date}T${time}`)
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const actor = await verifyToken(token)
    if (!actor || actor.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    const body = (await request.json()) as ManualPunchBody
    const {
      userId,
      date,
      morningTimeIn,
      morningTimeOut,
      afternoonTimeIn,
      afternoonTimeOut,
      reason,
    } = body

    if (!userId || !date) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      )
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    const providedTimes = [morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut].filter(
      (t) => typeof t === "string" && t.length > 0
    )

    if (providedTimes.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one time entry (morning/afternoon, in or out)." },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeType: true,
        department: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    let morningInUtc: Date | null
    let morningOutUtc: Date | null
    let afternoonInUtc: Date | null
    let afternoonOutUtc: Date | null

    try {
      morningInUtc = toUtcFromManila(date, morningTimeIn)
      morningOutUtc = toUtcFromManila(date, morningTimeOut)
      afternoonInUtc = toUtcFromManila(date, afternoonTimeIn)
      afternoonOutUtc = toUtcFromManila(date, afternoonTimeOut)
    } catch (parseError) {
      return NextResponse.json(
        { error: parseError instanceof Error ? parseError.message : "Invalid time" },
        { status: 400 }
      )
    }

    // Sanity check: OUT cannot precede IN within the same session
    if (morningInUtc && morningOutUtc && morningOutUtc.getTime() <= morningInUtc.getTime()) {
      return NextResponse.json(
        { error: "Morning Time Out must be after Morning Time In." },
        { status: 400 }
      )
    }
    if (afternoonInUtc && afternoonOutUtc && afternoonOutUtc.getTime() <= afternoonInUtc.getTime()) {
      return NextResponse.json(
        { error: "Afternoon Time Out must be after Afternoon Time In." },
        { status: 400 }
      )
    }

    const punchInputs: Prisma.AttendancePunchCreateManyInput[] = []
    const pushPunch = (timestamp: Date | null, type: AttendancePunchType) => {
      if (!timestamp) return
      punchInputs.push({
        userId: targetUser.id,
        timestamp,
        type,
        rawStatus: type === AttendancePunchType.IN ? "Manual/In" : "Manual/Out",
        rawName: `${targetUser.lastName}, ${targetUser.firstName}`,
        department: targetUser.department ?? null,
      })
    }

    pushPunch(morningInUtc, AttendancePunchType.IN)
    pushPunch(morningOutUtc, AttendancePunchType.OUT)
    pushPunch(afternoonInUtc, AttendancePunchType.IN)
    pushPunch(afternoonOutUtc, AttendancePunchType.OUT)

    // Materialize the AttendanceRecord for that day so the admin table reflects
    // the manual entry without relying on derived-from-punches queries.
    const recordDateUtc = manilaStartOfDayUTC(date)
    const schedule = getScheduleForEmployeeType(targetUser.employeeType)
    const morningStartMinutes = timeToMinutes(schedule.morningStart)
    const morningEndMinutes = timeToMinutes(schedule.morningEnd)
    const afternoonEndMinutes = timeToMinutes(schedule.afternoonEnd)

    const sessionHours = (start: Date | null, end: Date | null) => {
      if (!start || !end) return 0
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return diff > 0 ? diff : 0
    }

    const rawHours = sessionHours(morningInUtc, morningOutUtc) + sessionHours(afternoonInUtc, afternoonOutUtc)
    const hoursWorkedValue = rawHours > 0 ? parseFloat(rawHours.toFixed(2)) : null

    const isLate = morningInUtc
      ? getManilaHours(morningInUtc) * 60 + getManilaMinutes(morningInUtc) > morningStartMinutes
      : false

    const earliestIn = morningInUtc || afternoonInUtc
    const latestOut = afternoonOutUtc || morningOutUtc
    const isAbsent = !earliestIn && !latestOut

    let isHalfDay = false
    const totalSessions =
      (morningInUtc && morningOutUtc ? 1 : 0) + (afternoonInUtc && afternoonOutUtc ? 1 : 0)

    if (totalSessions <= 1) {
      if (!latestOut) {
        isHalfDay = !isAbsent
      } else {
        const outMinutes = getManilaHours(latestOut) * 60 + getManilaMinutes(latestOut)
        if (outMinutes < morningEndMinutes) {
          isHalfDay = true
        } else if (outMinutes >= afternoonEndMinutes) {
          isHalfDay = false
        } else {
          isHalfDay = true
        }
      }
    }

    const isEarlyOut = latestOut
      ? getManilaHours(latestOut) * 60 + getManilaMinutes(latestOut) < afternoonEndMinutes
      : false

    const { lateMinutes, undertimeMinutes } = calculateLateAndUndertime(
      morningInUtc,
      morningOutUtc,
      afternoonInUtc,
      afternoonOutUtc,
      targetUser.employeeType
    )

    const sessionType = isAbsent ? null : isHalfDay ? "HALF_DAY" : "FULL_DAY"

    const recordData = {
      timeIn: earliestIn,
      timeOut: latestOut,
      hoursWorked: hoursWorkedValue,
      isLate,
      isAbsent,
      lateMinutes,
      undertimeMinutes,
      morningTimeIn: morningInUtc,
      morningTimeOut: morningOutUtc,
      afternoonTimeIn: afternoonInUtc,
      afternoonTimeOut: afternoonOutUtc,
      isHalfDay,
      isEarlyOut,
      totalSessions,
      sessionType: sessionType as any,
      status: AttendanceStatus.APPROVED,
    }

    const attendanceRecord = await prisma.$transaction(async (tx) => {
      if (punchInputs.length > 0) {
        await tx.attendancePunch.createMany({
          data: punchInputs,
          skipDuplicates: true,
        })
      }

      return tx.attendanceRecord.upsert({
        where: {
          userId_date: {
            userId: targetUser.id,
            date: recordDateUtc,
          },
        },
        create: {
          userId: targetUser.id,
          date: recordDateUtc,
          ...recordData,
        },
        update: recordData,
        select: {
          id: true,
          userId: true,
          date: true,
          timeIn: true,
          timeOut: true,
          morningTimeIn: true,
          morningTimeOut: true,
          afternoonTimeIn: true,
          afternoonTimeOut: true,
          hoursWorked: true,
          isLate: true,
          isAbsent: true,
          lateMinutes: true,
          undertimeMinutes: true,
          status: true,
        },
      })
    })

    const dateKey = toManilaDateKey(recordDateUtc)
    await AuditLogger.log(
      {
        userId: actor.id,
        action: "manual_punch",
        entityType: "Attendance",
        entityId: attendanceRecord.id,
        details:
          `Manual attendance entered for ${targetUser.firstName} ${targetUser.lastName} on ${dateKey}` +
          (reason ? ` — reason: ${reason}` : ""),
      },
      request
    )

    return NextResponse.json(
      {
        success: true,
        message: "Manual attendance recorded successfully.",
        record: attendanceRecord,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating manual punch entry:", error)
    return NextResponse.json(
      {
        error: "Failed to record manual attendance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
