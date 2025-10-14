import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { AttendancePunchType } from "@prisma/client"
import { fetchAllPunchAttendance } from "@/lib/attendance-punches"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Support punch-derived id format: "punch:{userId}:{yyyy-mm-dd}"
    if (params.id.startsWith('punch:')) {
      const [, userId, day] = params.id.split(':')
      const start = new Date(`${day}T00:00:00`)
      const end = new Date(`${day}T23:59:59.999`)
      const { records } = await fetchAllPunchAttendance({ userId, startDate: start, endDate: end })
      const record = records[0]
      if (!record) {
        return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
      }
      return NextResponse.json({ record })
    }

    // Fallback: legacy attendance record by id
    const legacy = await prisma.attendanceRecord.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true
          }
        }
      }
    })

    if (!legacy) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }
    return NextResponse.json({ record: legacy })
  } catch (error) {
    console.error("Error fetching attendance record:", error)
    return NextResponse.json(
      { error: "Failed to fetch attendance record" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { date, timeIn, timeOut } = body

    // If punch id format, update punches for that user/day
    if (params.id.startsWith('punch:')) {
      const [, userId, day] = params.id.split(':')
      const targetDate = date || day
      const startOfDay = new Date(`${targetDate}T00:00:00`)
      const endOfDay = new Date(`${targetDate}T23:59:59.999`)

      // Remove existing punches for the day
      await prisma.attendancePunch.deleteMany({
        where: {
          userId,
          timestamp: { gte: startOfDay, lte: endOfDay }
        }
      })

      const punches: Array<{ userId: string; timestamp: Date; type: AttendancePunchType }> = []
      if (timeIn) punches.push({ userId, timestamp: new Date(`${targetDate}T${timeIn}`), type: AttendancePunchType.IN })
      if (timeOut) punches.push({ userId, timestamp: new Date(`${targetDate}T${timeOut}`), type: AttendancePunchType.OUT })
      if (punches.length) {
        await prisma.attendancePunch.createMany({ data: punches, skipDuplicates: true })
      }

      const { records } = await fetchAllPunchAttendance({ userId, startDate: startOfDay, endDate: endOfDay })
      return NextResponse.json({ record: records[0] ?? null })
    }

    // Fallback: legacy update on attendanceRecord
    const existingRecord = await prisma.attendanceRecord.findUnique({ where: { id: params.id } })
    if (!existingRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }
    const recordDate = (date || existingRecord.date.toISOString().split('T')[0]) as string
    const updated = await prisma.attendanceRecord.update({
      where: { id: params.id },
      data: {
        date: new Date(recordDate),
        timeIn: timeIn ? new Date(`${recordDate}T${timeIn}`) : existingRecord.timeIn,
        timeOut: timeOut ? new Date(`${recordDate}T${timeOut}`) : existingRecord.timeOut
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: true, position: true } }
      }
    })
    return NextResponse.json({ record: updated })
  } catch (error) {
    console.error("Error updating attendance record:", error)
    return NextResponse.json(
      { error: "Failed to update attendance record" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (params.id.startsWith('punch:')) {
      const [, userId, day] = params.id.split(':')
      const startOfDay = new Date(`${day}T00:00:00`)
      const endOfDay = new Date(`${day}T23:59:59.999`)
      await prisma.attendancePunch.deleteMany({
        where: { userId, timestamp: { gte: startOfDay, lte: endOfDay } }
      })
      return NextResponse.json({ message: "Attendance punches deleted successfully" })
    }

    // Fallback legacy delete
    const existingRecord = await prisma.attendanceRecord.findUnique({ where: { id: params.id } })
    if (!existingRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }
    await prisma.attendanceRecord.delete({ where: { id: params.id } })
    const startOfDay = new Date(existingRecord.date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(existingRecord.date)
    endOfDay.setHours(23, 59, 59, 999)
    await prisma.attendancePunch.deleteMany({ where: { userId: existingRecord.userId, timestamp: { gte: startOfDay, lte: endOfDay } } })
    return NextResponse.json({ message: "Attendance record deleted successfully" })
  } catch (error) {
    console.error("Error deleting attendance record:", error)
    return NextResponse.json(
      { error: "Failed to delete attendance record" },
      { status: 500 }
    )
  }
} 