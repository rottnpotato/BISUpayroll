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

    // Get system configurations for calculations
    const systemConfigs = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
            'working_hours_dailyHours',
            'rates_overtimeRate1',
            'working_hours_lateDeductionAmount',
            'working_hours_lateDeductionBasis'
          ]
        }
      }
    })

    const configs = systemConfigs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, string>)

    // Get applicable payroll rules for deductions calculation
    const payrollRules = await prisma.payrollRule.findMany({
      where: {
        OR: [
          { applyToAll: true },
          {
            assignedUsers: {
              some: {
                userId: user.id
              }
            }
          }
        ],
        isActive: true,
        type: 'deduction'
      }
    })

    // Calculate prospected salary based on actual payroll logic
    const workDaysInMonth = 22 // Standard working days per month
    const daysWorked = monthlyAttendance.filter(record => 
      !record.isAbsent && (record.timeIn || record.timeOut)
    ).length

    const totalHoursWorked = monthlyAttendance.reduce((sum, record) => {
      return sum + (Number(record.hoursWorked) || 0)
    }, 0)

    const expectedDailyHours = parseFloat(configs['working_hours_dailyHours'] || '8')
    const expectedTotalHours = daysWorked * expectedDailyHours
    const overtimeHours = Math.max(0, totalHoursWorked - expectedTotalHours)
    const regularHours = Math.min(totalHoursWorked, expectedTotalHours)

    const monthlySalary = Number(employeeData.salary)
    const dailyRate = monthlySalary / 22
    const hourlyRate = dailyRate / expectedDailyHours
    
    // Calculate overtime pay
    const overtimeRate = parseFloat(configs['rates_overtimeRate1'] || '1.25')
    const overtimePay = overtimeHours * hourlyRate * overtimeRate
    
    // Calculate base pay
    const basePay = regularHours * hourlyRate

    // Calculate late deductions
    const lateDeductionAmount = parseFloat(configs['working_hours_lateDeductionAmount'] || '0')
    const lateDeductions = latesThisMonth * lateDeductionAmount

    // Calculate rule-based deductions
    let totalRuleDeductions = 0
    payrollRules.forEach(rule => {
      const amount = Number(rule.amount)
      if (rule.isPercentage) {
        totalRuleDeductions += (basePay + overtimePay) * amount / 100
      } else {
        totalRuleDeductions += amount
      }
    })

    const grossPay = basePay + overtimePay
    const totalDeductions = totalRuleDeductions + lateDeductions
    const prospectedSalary = new Decimal(Math.max(0, grossPay - totalDeductions))

    // Format response data
    const dashboardData = {
      currentSalaryRate: `₱${monthlySalary.toFixed(2)}`,
      dailyRate: `₱${dailyRate.toFixed(2)}`,
      hourlyRate: `₱${hourlyRate.toFixed(2)}`,
      prospectedSalary: `₱${prospectedSalary.toFixed(2)}`,
      latesThisMonth,
      absencesThisMonth,
      hoursWorkedToday,
      totalHoursThisMonth: totalHoursWorked,
      expectedHoursThisMonth: expectedTotalHours,
      overtimeHoursThisMonth: overtimeHours,
      grossPayThisMonth: `₱${grossPay.toFixed(2)}`,
      deductionsThisMonth: `₱${totalDeductions.toFixed(2)}`,
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