import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = await prisma.attendanceRecord.findUnique({
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

    if (!record) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ record })
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
    const { date, timeIn, timeOut, isLate, isAbsent } = body

    // Check if record exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      )
    }

    // Calculate hours worked if both timeIn and timeOut are provided
    let hoursWorked = null
    if (timeIn && timeOut) {
      const recordDate = date || existingRecord.date.toISOString().split('T')[0]
      const timeInDate = new Date(`${recordDate}T${timeIn}`)
      const timeOutDate = new Date(`${recordDate}T${timeOut}`)
      hoursWorked = (timeOutDate.getTime() - timeInDate.getTime()) / (1000 * 60 * 60)
    }

    const updateData: any = {}
    
    if (date) updateData.date = new Date(date)
    if (timeIn) updateData.timeIn = new Date(`${date || existingRecord.date.toISOString().split('T')[0]}T${timeIn}`)
    if (timeOut) updateData.timeOut = new Date(`${date || existingRecord.date.toISOString().split('T')[0]}T${timeOut}`)
    if (hoursWorked !== null) updateData.hoursWorked = hoursWorked
    if (typeof isLate === 'boolean') updateData.isLate = isLate
    if (typeof isAbsent === 'boolean') updateData.isAbsent = isAbsent

    const record = await prisma.attendanceRecord.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ record })
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
    // Check if record exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      )
    }

    await prisma.attendanceRecord.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Attendance record deleted successfully" })
  } catch (error) {
    console.error("Error deleting attendance record:", error)
    return NextResponse.json(
      { error: "Failed to delete attendance record" },
      { status: 500 }
    )
  }
} 