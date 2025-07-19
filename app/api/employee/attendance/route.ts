import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Get attendance records for the specified month
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Calculate summary statistics
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter(record => record.timeIn && record.timeOut).length
    const absentDays = attendanceRecords.filter(record => record.isAbsent).length
    const lateDays = attendanceRecords.filter(record => record.isLate).length
    
    let totalHours = 0
    attendanceRecords.forEach(record => {
      if (record.hoursWorked) {
        totalHours += parseFloat(record.hoursWorked.toString())
      }
    })
    
    const averageHoursPerDay = totalDays > 0 ? parseFloat((totalHours / totalDays).toFixed(2)) : 0

    // Format the records for the response
    const formattedRecords = attendanceRecords.map(record => {
      const date = record.date
      const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
      const timeIn = record.timeIn 
        ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(record.timeIn) 
        : null
      const timeOut = record.timeOut 
        ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(record.timeOut) 
        : null
      
      let status = 'Absent'
      if (record.timeIn) {
        status = record.isLate ? 'Late' : 'On Time'
      }

      return {
        id: record.id,
        date: date.toISOString().split('T')[0],
        dayOfWeek,
        timeIn,
        timeOut,
        status,
        hours: record.hoursWorked ? parseFloat(record.hoursWorked.toString()) : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        records: formattedRecords,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          totalHours,
          averageHoursPerDay
        }
      }
    })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching attendance records'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user || user.role !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    // Get action from request body
    const body = await request.json()
    const action = body.action // 'time-in' or 'time-out'

    if (!action || (action !== 'time-in' && action !== 'time-out')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Must be "time-in" or "time-out"' 
      }, { status: 400 })
    }

    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // Find today's attendance record
    let attendanceRecord = await prisma.attendanceRecord.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    // Handle time-in action
    if (action === 'time-in') {
      // If no record exists for today, create one
      if (!attendanceRecord) {
        attendanceRecord = await prisma.attendanceRecord.create({
          data: {
            userId: user.id,
            date: now,
            timeIn: now,
            // Check if the employee is late (assuming work starts at 8:00 AM)
            isLate: now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0)
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Time-in recorded successfully',
          data: {
            time: formatTime(now),
            isLate: attendanceRecord.isLate
          }
        })
      } 
      // If record exists but already timed in
      else if (attendanceRecord.timeIn) {
        return NextResponse.json({
          success: false,
          message: 'Already timed in for today',
          data: {
            time: formatTime(attendanceRecord.timeIn)
          }
        }, { status: 400 })
      } 
      // If record exists but no time-in (unlikely scenario but handled for completeness)
      else {
        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: {
            timeIn: now,
            isLate: now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0)
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Time-in recorded successfully',
          data: {
            time: formatTime(now),
            isLate: attendanceRecord.isLate
          }
        })
      }
    } 
    // Handle time-out action
    else if (action === 'time-out') {
      // If no record exists for today or no time-in
      if (!attendanceRecord || !attendanceRecord.timeIn) {
        return NextResponse.json({
          success: false,
          message: 'Cannot time-out without first timing in'
        }, { status: 400 })
      } 
      // If already timed out
      else if (attendanceRecord.timeOut) {
        return NextResponse.json({
          success: false,
          message: 'Already timed out for today',
          data: {
            time: formatTime(attendanceRecord.timeOut)
          }
        }, { status: 400 })
      } 
      // Record time-out and calculate hours worked
      else {
        const timeIn = attendanceRecord.timeIn.getTime()
        const timeOut = now.getTime()
        const hoursWorked = parseFloat(((timeOut - timeIn) / (1000 * 60 * 60)).toFixed(2))

        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: {
            timeOut: now,
            hoursWorked
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Time-out recorded successfully',
          data: {
            time: formatTime(now),
            hoursWorked
          }
        })
      }
    }

  } catch (error) {
    console.error('Error processing attendance action:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while processing your request'
    }, { status: 500 })
  }
}

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
} 