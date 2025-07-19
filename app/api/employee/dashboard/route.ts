import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
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

    // Get current date information
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get employee data from database
    const employeeData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        salary: true,
      },
    })

    if (!employeeData || !employeeData.salary) {
      return NextResponse.json({ 
        success: false, 
        message: 'Employee data not found' 
      }, { status: 404 })
    }

    // Get today's attendance
    const todayAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate lates and absences for the current month
    const monthlyAttendance = await prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const latesThisMonth = monthlyAttendance.filter(record => record.isLate).length
    const absencesThisMonth = monthlyAttendance.filter(record => record.isAbsent).length

    // Calculate hours worked today
    let hoursWorkedToday = 0
    if (todayAttendance?.timeIn && todayAttendance?.timeOut) {
      const timeIn = todayAttendance.timeIn.getTime()
      const timeOut = todayAttendance.timeOut.getTime()
      hoursWorkedToday = parseFloat(((timeOut - timeIn) / (1000 * 60 * 60)).toFixed(2))
    } else if (todayAttendance?.hoursWorked) {
      hoursWorkedToday = parseFloat(todayAttendance.hoursWorked.toString())
    }

    // Calculate prospected salary based on worked days
    // this should be calculated based on the holidays and other factors for now, lets just use 22 days
    const workDaysInMonth = 22 // Assuming 22 working days per month
    const daysWorked = monthlyAttendance.filter(record => 
      !record.isAbsent && (record.timeIn || record.timeOut)
    ).length
    
    const dailyRate = employeeData.salary
    const prospectedSalary = dailyRate.mul(new Decimal(daysWorked))

    // Format response data
    const dashboardData = {
      currentSalaryRate: `₱${dailyRate.toFixed(2)}`,
      prospectedSalary: `₱${prospectedSalary.toFixed(2)}`,
      latesThisMonth,
      absencesThisMonth,
      hoursWorkedToday,
      isTimedIn: todayAttendance?.timeIn != null && todayAttendance?.timeOut == null,
      lastTimeAction: todayAttendance 
        ? todayAttendance.timeOut 
          ? `Timed Out at ${formatTime(todayAttendance.timeOut)}`
          : todayAttendance.timeIn 
            ? `Timed In at ${formatTime(todayAttendance.timeIn)}`
            : null
        : null,
    }

    return NextResponse.json({ 
      success: true, 
      data: dashboardData
    })

  } catch (error) {
    console.error('Error fetching employee dashboard data:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while fetching dashboard data' 
    }, { status: 500 })
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
} 