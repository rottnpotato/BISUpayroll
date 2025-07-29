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

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get current month dates
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    // Get user data with salary
    const employeeData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        position: true,
        salary: true,
        hireDate: true,
      }
    })

    if (!employeeData || !employeeData.salary) {
      return NextResponse.json({ 
        success: false, 
        message: 'Employee data or salary not found' 
      }, { status: 404 })
    }

    // Get payroll records for the employee
    const payrollRecords = await prisma.payrollRecord.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        payPeriodStart: 'desc'
      },
      take: limit
    })

    // Get current month attendance for calculations
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Get applicable payroll rules for the user
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
        isActive: true
      },
      include: {
        assignedUsers: {
          where: {
            userId: user.id
          }
        }
      }
    })

    // Get system configurations for calculations
    const systemConfigs = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
            'working_hours_dailyHours',
            'working_hours_weeklyHours',
            'working_hours_lateGraceMinutes',
            'working_hours_lateDeductionBasis',
            'working_hours_lateDeductionAmount',
            'rates_overtimeRate1',
            'rates_overtimeRate2',
            'rates_nightDifferential',
            'rates_regularHolidayRate',
            'rates_specialHolidayRate',
            'rates_currency'
          ]
        }
      }
    })

    // Convert system configs to object
    const configs = systemConfigs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, string>)

    // Calculate current month statistics
    const workingDays = attendanceRecords.filter(record => !record.isAbsent).length
    const totalHoursWorked = attendanceRecords.reduce((sum, record) => {
      return sum + (Number(record.hoursWorked) || 0)
    }, 0)
    const lateCount = attendanceRecords.filter(record => record.isLate).length
    const absentCount = attendanceRecords.filter(record => record.isAbsent).length

    // Calculate expected working hours and overtime
    const expectedDailyHours = parseFloat(configs['working_hours_dailyHours'] || '8')
    const expectedTotalHours = workingDays * expectedDailyHours
    const overtimeHours = Math.max(0, totalHoursWorked - expectedTotalHours)
    const regularHours = Math.min(totalHoursWorked, expectedTotalHours)

    // Calculate rates
    const monthlySalary = Number(employeeData.salary)
    const dailyRate = monthlySalary / 22 // Assuming 22 working days per month
    const hourlyRate = dailyRate / expectedDailyHours

    // Calculate overtime pay
    const overtimeRate = parseFloat(configs['rates_overtimeRate1'] || '1.25')
    const overtimePay = overtimeHours * hourlyRate * overtimeRate

    // Calculate late deductions
    const lateDeductionAmount = parseFloat(configs['working_hours_lateDeductionAmount'] || '0')
    const lateDeductionBasis = configs['working_hours_lateDeductionBasis'] || 'fixed'
    let lateDeductions = 0

    if (lateDeductionBasis === 'fixed') {
      lateDeductions = lateCount * lateDeductionAmount
    } else if (lateDeductionBasis === 'hourly') {
      lateDeductions = lateCount * hourlyRate * lateDeductionAmount
    }

    // Calculate base pay
    const basePay = regularHours * hourlyRate

    // Calculate rule-based deductions and bonuses
    let governmentDeductions = 0
    let loanDeductions = 0
    let otherDeductions = 0
    let bonuses = 0

    payrollRules.forEach(rule => {
      const amount = Number(rule.amount)
      
      if (rule.type === 'deduction') {
        if (rule.name.toLowerCase().includes('sss') || 
            rule.name.toLowerCase().includes('philhealth') || 
            rule.name.toLowerCase().includes('pagibig') ||
            rule.name.toLowerCase().includes('tax')) {
          governmentDeductions += rule.isPercentage ? (basePay + overtimePay) * amount / 100 : amount
        } else if (rule.name.toLowerCase().includes('loan')) {
          loanDeductions += amount
        } else {
          otherDeductions += amount
        }
      } else if (rule.type === 'bonus' || rule.type === 'allowance') {
        bonuses += rule.isPercentage ? (basePay + overtimePay) * amount / 100 : amount
      }
    })

    // Calculate totals
    const totalDeductions = governmentDeductions + loanDeductions + otherDeductions + lateDeductions
    const grossPay = basePay + overtimePay + bonuses
    const netPay = grossPay - totalDeductions

    // Calculate year-to-date earnings
    const currentYear = new Date().getFullYear()
    const ytdPayrollRecords = await prisma.payrollRecord.findMany({
      where: {
        userId: user.id,
        payPeriodStart: {
          gte: new Date(currentYear, 0, 1)
        }
      }
    })

    const ytdEarnings = ytdPayrollRecords.reduce((sum, record) => {
      return sum + Number(record.netPay)
    }, 0)

    // Get latest payroll record for current period
    const latestPayroll = payrollRecords[0]

    // Format response
    const payrollData = {
      employee: {
        id: employeeData.id,
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        employeeId: employeeData.employeeId,
        department: employeeData.department,
        position: employeeData.position,
        hireDate: employeeData.hireDate,
        salary: monthlySalary
      },
      currentMonth: {
        year,
        month,
        workingDays,
        totalHoursWorked,
        regularHours,
        overtimeHours,
        lateCount,
        absentCount,
        expectedDailyHours,
        expectedTotalHours
      },
      calculations: {
        dailyRate,
        hourlyRate,
        basePay,
        overtimePay,
        bonuses,
        governmentDeductions,
        loanDeductions,
        otherDeductions,
        lateDeductions,
        totalDeductions,
        grossPay,
        netPay
      },
      summary: {
        currentSalaryRate: monthlySalary,
        prospectedSalary: netPay,
        ytdEarnings,
        latesThisMonth: lateCount,
        absencesThisMonth: absentCount,
        hoursWorkedToday: attendanceRecords
          .filter(record => {
            const today = new Date()
            const recordDate = new Date(record.date)
            return recordDate.toDateString() === today.toDateString()
          })[0]?.hoursWorked || 0
      },
      payrollHistory: payrollRecords.map(record => ({
        id: record.id,
        payPeriodStart: record.payPeriodStart,
        payPeriodEnd: record.payPeriodEnd,
        grossPay: Number(record.grossPay),
        deductions: Number(record.deductions),
        netPay: Number(record.netPay),
        isPaid: record.isPaid,
        paidAt: record.paidAt
      })),
      deductionBreakdown: {
        government: {
          total: governmentDeductions,
          details: payrollRules
            .filter(rule => rule.type === 'deduction' && 
              (rule.name.toLowerCase().includes('sss') ||
               rule.name.toLowerCase().includes('philhealth') ||
               rule.name.toLowerCase().includes('pagibig') ||
               rule.name.toLowerCase().includes('tax')))
            .map(rule => ({
              name: rule.name,
              amount: rule.isPercentage ? (basePay + overtimePay) * Number(rule.amount) / 100 : Number(rule.amount),
              isPercentage: rule.isPercentage,
              percentage: rule.isPercentage ? Number(rule.amount) : null
            }))
        },
        loans: {
          total: loanDeductions,
          details: payrollRules
            .filter(rule => rule.type === 'deduction' && rule.name.toLowerCase().includes('loan'))
            .map(rule => ({
              name: rule.name,
              amount: Number(rule.amount),
              description: rule.description
            }))
        },
        other: {
          total: otherDeductions + lateDeductions,
          details: [
            ...payrollRules
              .filter(rule => rule.type === 'deduction' && 
                !rule.name.toLowerCase().includes('sss') &&
                !rule.name.toLowerCase().includes('philhealth') &&
                !rule.name.toLowerCase().includes('pagibig') &&
                !rule.name.toLowerCase().includes('tax') &&
                !rule.name.toLowerCase().includes('loan'))
              .map(rule => ({
                name: rule.name,
                amount: rule.isPercentage ? (basePay + overtimePay) * Number(rule.amount) / 100 : Number(rule.amount),
                description: rule.description
              })),
            ...(lateDeductions > 0 ? [{
              name: 'Late Deductions',
              amount: lateDeductions,
              description: `${lateCount} late(s) × ${lateDeductionAmount}`
            }] : [])
          ]
        }
      },
      appliedRules: payrollRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        type: rule.type,
        amount: Number(rule.amount),
        isPercentage: rule.isPercentage,
        description: rule.description,
        calculatedAmount: rule.isPercentage ? (basePay + overtimePay) * Number(rule.amount) / 100 : Number(rule.amount)
      }))
    }

    return NextResponse.json({
      success: true,
      data: payrollData
    })

  } catch (error) {
    console.error('Error fetching employee payroll data:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching payroll data'
    }, { status: 500 })
  }
}


