import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const department = searchParams.get("department")

    const skip = (page - 1) * limit

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (department && department !== "All Departments") {
      where.user = {
        department: department
      }
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: { date: "desc" }
      }),
      prisma.attendanceRecord.count({ where })
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, date, timeIn, timeOut, isLate, isAbsent } = body

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

    // Check if attendance record already exists for this date
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        userId,
        date: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (existingRecord) {
      return NextResponse.json(
        { error: "Attendance record already exists for this date" },
        { status: 409 }
      )
    }

    // Calculate hours worked if both timeIn and timeOut are provided
    let hoursWorked = null
    if (timeIn && timeOut) {
      const timeInDate = new Date(`${date}T${timeIn}`)
      const timeOutDate = new Date(`${date}T${timeOut}`)
      hoursWorked = (timeOutDate.getTime() - timeInDate.getTime()) / (1000 * 60 * 60)
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        userId,
        date: new Date(date),
        timeIn: timeIn ? new Date(`${date}T${timeIn}`) : null,
        timeOut: timeOut ? new Date(`${date}T${timeOut}`) : null,
        hoursWorked: hoursWorked,
        isLate: isLate || false,
        isAbsent: isAbsent || false
      },
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

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error("Error creating attendance record:", error)
    return NextResponse.json(
      { error: "Failed to create attendance record" },
      { status: 500 }
    )
  }
} 