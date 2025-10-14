import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { fetchAllPunchAttendance } from "@/lib/attendance-punches"
import { AttendancePunchType } from "@prisma/client"
import { manilaStartOfDayUTC, manilaEndOfDayUTC, parseManilaLocal } from "@/lib/timezone"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const department = searchParams.get("department")

  const startDateValue = startDate ? manilaStartOfDayUTC(startDate) : undefined
  const endDateValue = endDate ? manilaEndOfDayUTC(endDate) : undefined

    const userIdValue = userId || undefined

    // Fetch normalized attendance from Prisma to include session fields
    const whereClause: any = {
      date: {
        gte: startDateValue,
        lte: endDateValue,
      },
    }
    if (userIdValue) whereClause.userId = userIdValue

    // Department filter via relation
    const [recordsRaw, totalCount] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: department && department !== "All Departments"
          ? { ...whereClause, user: { department } }
          : whereClause,
        select: {
          id: true,
          userId: true,
          date: true,
          timeIn: true,
          timeOut: true,
          hoursWorked: true,
          isLate: true,
          isAbsent: true,
          status: true,
          rejectionReason: true,
          approvedById: true,
          approvedAt: true,
          morningTimeIn: true,
          morningTimeOut: true,
          afternoonTimeIn: true,
          afternoonTimeOut: true,
          isHalfDay: true,
          isEarlyOut: true,
          earlyOutReason: true,
          totalSessions: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              department: true,
              position: true,
            },
          },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ date: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendanceRecord.count({
        where: department && department !== "All Departments"
          ? { ...whereClause, user: { department } }
          : whereClause,
      }),
    ])

    const formatTime = (d?: Date | null) => (d ? d.toISOString() : null)
    const toNumber = (val: any): number | null => {
      if (val == null) return null
      try {
        if (typeof val === 'object' && typeof (val as any).toNumber === 'function') return (val as any).toNumber()
      } catch {}
      const n = Number(val)
      return isNaN(n) ? null : n
    }

    const records = recordsRaw.map((r) => ({
      id: r.id,
      userId: r.userId,
      date: r.date.toISOString(),
      timeIn: r.timeIn ? r.timeIn.toISOString() : null,
      timeOut: r.timeOut ? r.timeOut.toISOString() : null,
      hoursWorked: toNumber((r as any).hoursWorked),
      isLate: r.isLate,
      isAbsent: r.isAbsent,
      status: r.status as any,
      rejectionReason: (r as any).rejectionReason || null,
      approvedById: r.approvedById || null,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      user: r.user,
      approvedBy: r.approvedBy,
      source: "MANUAL",
      // Session fields
      morningTimeIn: formatTime((r as any).morningTimeIn),
      morningTimeOut: formatTime((r as any).morningTimeOut),
      afternoonTimeIn: formatTime((r as any).afternoonTimeIn),
      afternoonTimeOut: formatTime((r as any).afternoonTimeOut),
      isHalfDay: (r as any).isHalfDay,
      isEarlyOut: (r as any).isEarlyOut,
      earlyOutReason: (r as any).earlyOutReason || null,
      totalSessions: (r as any).totalSessions ?? 0,
    }))

    const pages = Math.max(1, Math.ceil(totalCount / (limit || 1)))

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
      },
    })
  } catch (error) {
    console.error("Error fetching attendance punch records:", error)
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, date, timeIn, timeOut } = body

    if (!userId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const punches = [] as Array<{ userId: string; timestamp: Date; type: AttendancePunchType }>

    if (timeIn) {
      punches.push({
        userId,
        timestamp: parseManilaLocal(`${date}T${timeIn}`),
        type: AttendancePunchType.IN
      })
    }

    if (timeOut) {
      punches.push({
        userId,
        timestamp: parseManilaLocal(`${date}T${timeOut}`),
        type: AttendancePunchType.OUT
      })
    }

    if (punches.length > 0) {
      await prisma.attendancePunch.createMany({
        data: punches,
        skipDuplicates: true
      })
    }

    // Return derived record for that day
  const dayStart = manilaStartOfDayUTC(date)
  const dayEnd = manilaEndOfDayUTC(date)

    const { records } = await fetchAllPunchAttendance({
      userId,
      startDate: dayStart,
      endDate: dayEnd
    })

    return NextResponse.json({ record: records[0] ?? null }, { status: 201 })
  } catch (error) {
    console.error("Error creating attendance record:", error)
    return NextResponse.json(
      { error: "Failed to create attendance record" },
      { status: 500 }
    )
  }
} 