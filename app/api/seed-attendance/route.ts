import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // First, check if there are any users
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      take: 5
    })

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No users found. Please create users first.'
      })
    }

    // Check if attendance records already exist
    const existingRecords = await prisma.attendanceRecord.count()
    if (existingRecords > 0) {
      return NextResponse.json({
        success: false,
        message: `${existingRecords} attendance records already exist. Use DELETE first if you want to reseed.`
      })
    }

    // Create attendance records for the last 7 days
    const attendanceRecords = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      for (const user of users) {
        // Skip some days randomly to simulate absences (10% chance)
        if (Math.random() < 0.1) {
          attendanceRecords.push({
            userId: user.id,
            date: date,
            timeIn: null,
            timeOut: null,
            hoursWorked: null,
            isLate: false,
            isAbsent: true
          })
          continue
        }

        const timeInHour = 8 + Math.floor(Math.random() * 2) // 8-9 AM
        const timeInMinute = Math.floor(Math.random() * 60)
        const timeIn = new Date(date)
        timeIn.setHours(timeInHour, timeInMinute, 0, 0)

        const timeOutHour = 17 + Math.floor(Math.random() * 2) // 5-6 PM
        const timeOutMinute = Math.floor(Math.random() * 60)
        const timeOut = new Date(date)
        timeOut.setHours(timeOutHour, timeOutMinute, 0, 0)

        const hoursWorked = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60)
        const isLate = timeInHour > 8 || (timeInHour === 8 && timeInMinute > 0)

        attendanceRecords.push({
          userId: user.id,
          date: date,
          timeIn: timeIn,
          timeOut: timeOut,
          hoursWorked: hoursWorked,
          isLate: isLate,
          isAbsent: false
        })
      }
    }

    // Create the records
    const result = await prisma.attendanceRecord.createMany({
      data: attendanceRecords,
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      message: `Created ${result.count} attendance records successfully!`,
      details: {
        usersFound: users.length,
        recordsCreated: result.count,
        daysSeeded: 7
      }
    })

  } catch (error) {
    console.error('Error seeding attendance data:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to seed attendance data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await prisma.attendanceRecord.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} attendance records`
    })
  } catch (error) {
    console.error('Error deleting attendance data:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete attendance data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 