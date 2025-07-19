import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get all attendance records without any filtering
    const records = await prisma.attendanceRecord.findMany({
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
      orderBy: { date: "desc" },
      take: 50 // Limit to 50 records for testing
    })

    // Also get total count
    const totalCount = await prisma.attendanceRecord.count()

    return NextResponse.json({
      success: true,
      totalCount,
      records: records.map(record => ({
        id: record.id,
        userId: record.userId,
        date: record.date.toISOString(),
        timeIn: record.timeIn?.toISOString() || null,
        timeOut: record.timeOut?.toISOString() || null,
        hoursWorked: record.hoursWorked ? parseFloat(record.hoursWorked.toString()) : null,
        isLate: record.isLate,
        isAbsent: record.isAbsent,
        user: record.user,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error("Error fetching test attendance records:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch test attendance records",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 