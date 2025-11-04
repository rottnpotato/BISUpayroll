import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { fetchAllPunchAttendance } from '@/lib/attendance-punches'

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

    // Get user data
    const employeeData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        position: true,
        hireDate: true,
      }
    })

    if (!employeeData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Employee data not found' 
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

    // Get current month attendance derived from punches
    const { records: attendanceRecords } = await fetchAllPunchAttendance({
      userId: user.id,
      startDate: startOfMonth,
      endDate: endOfMonth
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

    // Use stored procedure for accurate payroll calculation
    const payrollResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM calculate_payroll_for_period(
        ${user.id}::TEXT,
        ${startOfMonth}::DATE,
        ${endOfMonth}::DATE
      )
    `

    const calculation = payrollResult[0]

    if (!calculation) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to calculate payroll' 
      }, { status: 500 })
    }

    // Extract values from stored procedure result
    const dailyRate = Number(calculation.daily_rate || 0)
    const hourlyRate = Number(calculation.hourly_rate || 0)
    const workingDays = Number(calculation.days_worked || 0)
    const totalHoursWorked = Number(calculation.hours_worked || 0)
    const overtimeHours = Number(calculation.overtime_hours || 0)
    const regularHours = totalHoursWorked - overtimeHours
    const lateCount = Number(calculation.late_hours || 0) // Note: late_hours stores count
    const absentCount = attendanceRecords.filter(record => record.isAbsent).length

    const basePay = Number(calculation.regular_pay || 0)
    const overtimePay = Number(calculation.overtime_pay || 0)
    const bonuses = Number(calculation.bonuses || 0) + Number(calculation.allowances || 0)
    const holidayPay = Number(calculation.holiday_pay || 0)
    const overloadPay = Number(calculation.overload_pay || 0)

    const governmentDeductions = Number(calculation.gsis_contribution || 0) + 
                                 Number(calculation.philhealth_contribution || 0) + 
                                 Number(calculation.pagibig_contribution || 0)
    const loanDeductions = Number(calculation.loan_deductions || 0)
    const otherDeductions = Number(calculation.other_deductions || 0)
    const lateDeductions = Number(calculation.late_deductions || 0)
    const undertimeDeductions = Number(calculation.undertime_deductions || 0)

    const totalDeductions = Number(calculation.total_deductions || 0)
    const grossPay = Number(calculation.gross_pay || 0)
    const netPay = Number(calculation.net_pay || 0)

    const monthlySalary = dailyRate * 22
    const expectedDailyHours = parseFloat(configs['working_hours_dailyHours'] || '8')
    const expectedTotalHours = workingDays * expectedDailyHours

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
        hoursWorkedToday: (() => {
          const today = new Date()
          const rec = attendanceRecords.find(r => new Date(r.date).toDateString() === today.toDateString())
          return rec?.hoursWorked || 0
        })()
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
          details: [
            ...(Number(calculation.gsis_contribution || 0) > 0 ? [{
              name: 'GSIS',
              amount: Number(calculation.gsis_contribution),
              isPercentage: false,
              percentage: null
            }] : []),
            ...(Number(calculation.philhealth_contribution || 0) > 0 ? [{
              name: 'PhilHealth',
              amount: Number(calculation.philhealth_contribution),
              isPercentage: false,
              percentage: null
            }] : []),
            ...(Number(calculation.pagibig_contribution || 0) > 0 ? [{
              name: 'Pag-IBIG',
              amount: Number(calculation.pagibig_contribution),
              isPercentage: false,
              percentage: null
            }] : []),
            ...(Number(calculation.withholding_tax || 0) > 0 ? [{
              name: 'Withholding Tax',
              amount: Number(calculation.withholding_tax),
              isPercentage: false,
              percentage: null
            }] : [])
          ]
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
          total: otherDeductions + lateDeductions + undertimeDeductions,
          details: [
            ...payrollRules
              .filter(rule => rule.type === 'deduction' && 
                !rule.name.toLowerCase().includes('gsis') &&
                !rule.name.toLowerCase().includes('sss') &&
                !rule.name.toLowerCase().includes('philhealth') &&
                !rule.name.toLowerCase().includes('pagibig') &&
                !rule.name.toLowerCase().includes('tax') &&
                !rule.name.toLowerCase().includes('loan'))
              .map(rule => ({
                name: rule.name,
                amount: Number(rule.amount),
                description: rule.description
              })),
            ...(lateDeductions > 0 ? [{
              name: 'Late Deductions',
              amount: lateDeductions,
              description: `${lateCount} late(s)`
            }] : []),
            ...(undertimeDeductions > 0 ? [{
              name: 'Undertime Deductions',
              amount: undertimeDeductions,
              description: `Undertime hours`
            }] : [])
          ]
        }
      },
      appliedRules: payrollRules.map(rule => {
        let calculatedAmount = 0
        
        // Map rule types to stored procedure fields
        if (rule.type === 'daily_rate') {
          calculatedAmount = dailyRate
        } else if (rule.type === 'bonus') {
          calculatedAmount = rule.isPercentage ? grossPay * Number(rule.amount) / 100 : Number(rule.amount)
        } else if (rule.type === 'allowance') {
          calculatedAmount = rule.isPercentage ? grossPay * Number(rule.amount) / 100 : Number(rule.amount)
        } else if (rule.type === 'deduction') {
          if (rule.name.toLowerCase().includes('gsis')) {
            calculatedAmount = Number(calculation.gsis_contribution || 0)
          } else if (rule.name.toLowerCase().includes('philhealth')) {
            calculatedAmount = Number(calculation.philhealth_contribution || 0)
          } else if (rule.name.toLowerCase().includes('pagibig')) {
            calculatedAmount = Number(calculation.pagibig_contribution || 0)
          } else if (rule.name.toLowerCase().includes('tax')) {
            calculatedAmount = Number(calculation.withholding_tax || 0)
          } else {
            calculatedAmount = Number(rule.amount)
          }
        } else {
          calculatedAmount = Number(rule.amount)
        }
        
        return {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          amount: Number(rule.amount),
          isPercentage: rule.isPercentage,
          description: rule.description,
          calculatedAmount: calculatedAmount
        }
      })
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


