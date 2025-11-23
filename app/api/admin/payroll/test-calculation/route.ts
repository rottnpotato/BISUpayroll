import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

/**
 * POST /api/admin/payroll/test-calculation
 * 
 * Test endpoint to run the stored procedure calculation
 * Returns detailed breakdown of all calculations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, payPeriodStart, payPeriodEnd } = body

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Default to current month if dates not provided
    const now = new Date()
    const startDate = payPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endDate = payPeriodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get user info with payroll roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        department: true,
        position: true,
        payrollRoles: {
          include: {
            payrollRole: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get attendance records for the period
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: userId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        timeIn: true,
        timeOut: true,
        hoursWorked: true,
        isLate: true,
        isAbsent: true,
        status: true
      }
    })

    // Get active payroll rules for this user
    const userRules = await prisma.payrollRuleAssignment.findMany({
      where: { userId: userId },
      include: {
        payrollRule: true
      }
    })
    
    // Filter for active rules only
    const activeUserRules = userRules.filter(r => r.payrollRule.isActive)

    // Get global rules
    const globalRules = await prisma.payrollRule.findMany({
      where: {
        applyToAll: true,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        amount: true,
        isPercentage: true,
        description: true
      }
    })

    // Get system settings
    const systemSettings = await prisma.systemSettings.findMany({
      where: {
        isActive: true,
        key: {
          in: [
            'working_hours_dailyHours',
            'rates_overtimeRate1',
            'rates_overtimeRate2',
            'rates_regularHolidayRate',
            'rates_specialHolidayRate',
            'working_hours_lateDeductionAmount',
            'working_hours_lateDeductionBasis'
          ]
        }
      },
      select: {
        key: true,
        value: true,
        description: true
      }
    })

    // Run the stored procedure calculation
    console.log(`Running calculation for user ${userId} from ${startDate} to ${endDate}`)
    
    const calculation = await prisma.$queryRaw<any[]>`
      SELECT * FROM calculate_payroll_for_period(
        ${userId}::text,
        ${startDate}::date,
        ${endDate}::date
      )
    `

    if (!calculation || calculation.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No calculation results returned",
        debug: {
          user,
          period: { start: startDate, end: endDate },
          attendanceCount: attendanceRecords.length,
          userRulesCount: userRules.length,
          globalRulesCount: globalRules.length
        }
      })
    }

    const calc = calculation[0]

    // Helper to format currency
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)

    // Helper to format number
    const formatNumber = (num: number) => 
      new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)

    // Extract rates and settings
    const dailyRate = Number(calc.daily_rate)
    const hourlyRate = Number(calc.hourly_rate)
    const dailyHours = Number(systemSettings.find(s => s.key === 'working_hours_dailyHours')?.value || 8)
    const overtimeRate1 = Number(systemSettings.find(s => s.key === 'rates_overtimeRate1')?.value || 1.25)
    const regularHolidayRate = Number(systemSettings.find(s => s.key === 'rates_regularHolidayRate')?.value || 2.0)
    
    // Extract hours
    const hoursWorked = Number(calc.hours_worked)
    const overtimeHours = Number(calc.overtime_hours)
    const holidayHours = Number(calc.holiday_hours)
    const regularHours = Math.max(0, hoursWorked - overtimeHours - holidayHours)

    // Construct detailed breakdown
    const breakdown = {
      rates: {
        dailyRate: {
          value: dailyRate,
          formatted: formatCurrency(dailyRate),
          formula: "Base Salary / Working Days (or fixed daily rate)",
          note: "Derived from Payroll Role or Global Rules"
        },
        hourlyRate: {
          value: hourlyRate,
          formatted: formatCurrency(hourlyRate),
          formula: "Daily Rate / Daily Hours",
          calculation: `${formatCurrency(dailyRate)} / ${dailyHours} = ${formatCurrency(hourlyRate)}`
        }
      },
      earnings: {
        regularPay: {
          amount: Number(calc.regular_pay),
          formatted: formatCurrency(Number(calc.regular_pay)),
          formula: "Regular Hours * Hourly Rate",
          calculation: `${formatNumber(regularHours)} hours * ${formatCurrency(hourlyRate)} = ${formatCurrency(Number(calc.regular_pay))}`
        },
        overtimePay: {
          amount: Number(calc.overtime_pay),
          formatted: formatCurrency(Number(calc.overtime_pay)),
          formula: "Overtime Hours * Hourly Rate * Overtime Rate",
          calculation: `${formatNumber(overtimeHours)} hours * ${formatCurrency(hourlyRate)} * ${overtimeRate1} = ${formatCurrency(Number(calc.overtime_pay))}`
        },
        holidayPay: {
          amount: Number(calc.holiday_pay),
          formatted: formatCurrency(Number(calc.holiday_pay)),
          formula: "Holiday Hours * Hourly Rate * Holiday Rate",
          calculation: `${formatNumber(holidayHours)} hours * ${formatCurrency(hourlyRate)} * ${regularHolidayRate} (approx) = ${formatCurrency(Number(calc.holiday_pay))}`
        },
        allowances: {
          amount: Number(calc.allowances),
          formatted: formatCurrency(Number(calc.allowances)),
          formula: "Sum of active allowance rules",
          note: "See 'rules.userSpecific' and 'rules.global' for details"
        },
        totalEarnings: {
          amount: Number(calc.total_earnings),
          formatted: formatCurrency(Number(calc.total_earnings)),
          formula: "Sum of all earnings components"
        },
        grossPay: {
          amount: Number(calc.gross_pay),
          formatted: formatCurrency(Number(calc.gross_pay)),
          formula: "Total Earnings"
        }
      },
      deductions: {
        lateDeductions: {
          amount: Number(calc.late_deductions),
          formatted: formatCurrency(Number(calc.late_deductions)),
          formula: "Late Hours * Hourly Rate (or fixed deduction)",
          calculation: `${formatNumber(Number(calc.late_hours))} hours * ${formatCurrency(hourlyRate)} = ${formatCurrency(Number(calc.late_deductions))}`
        },
        undertimeDeductions: {
          amount: Number(calc.undertime_deductions),
          formatted: formatCurrency(Number(calc.undertime_deductions)),
          formula: "Undertime Hours * Hourly Rate",
          calculation: `${formatNumber(Number(calc.undertime_hours))} hours * ${formatCurrency(hourlyRate)} = ${formatCurrency(Number(calc.undertime_deductions))}`
        },
        contributions: {
          gsis: {
            amount: Number(calc.gsis_contribution),
            formatted: formatCurrency(Number(calc.gsis_contribution)),
            formula: "Based on GSIS Contribution Table"
          },
          philHealth: {
            amount: Number(calc.philhealth_contribution),
            formatted: formatCurrency(Number(calc.philhealth_contribution)),
            formula: "Based on PhilHealth Contribution Table"
          },
          pagibig: {
            amount: Number(calc.pagibig_contribution),
            formatted: formatCurrency(Number(calc.pagibig_contribution)),
            formula: "Based on Pag-IBIG Contribution Table"
          }
        },
        tax: {
          withholdingTax: {
            amount: Number(calc.withholding_tax),
            formatted: formatCurrency(Number(calc.withholding_tax)),
            formula: "Based on Tax Table (Annualized Taxable Income)",
            taxableIncome: formatCurrency(Number(calc.taxable_income))
          }
        },
        totalDeductions: {
          amount: Number(calc.total_deductions),
          formatted: formatCurrency(Number(calc.total_deductions)),
          formula: "Sum of all deductions"
        }
      },
      netPay: {
        amount: Number(calc.net_pay),
        formatted: formatCurrency(Number(calc.net_pay)),
        formula: "Gross Pay - Total Deductions",
        calculation: `${formatCurrency(Number(calc.gross_pay))} - ${formatCurrency(Number(calc.total_deductions))} = ${formatCurrency(Number(calc.net_pay))}`
      }
    }

    // Format the response with detailed breakdown
    return NextResponse.json({
      success: true,
      test: {
        timestamp: new Date().toISOString(),
        period: {
          start: startDate,
          end: endDate
        }
      },
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        payrollRoles: user.payrollRoles.map(pr => ({
          role: pr.payrollRole.name,
          dailyRate: Number(pr.payrollRole.dailyRate)
        }))
      },
      attendance: {
        recordCount: attendanceRecords.length,
        summary: {
          daysWorked: calc.days_worked,
          totalHours: Number(calc.hours_worked),
          regularHours: regularHours,
          overtimeHours: Number(calc.overtime_hours),
          lateHours: Number(calc.late_hours),
          undertimeHours: Number(calc.undertime_hours),
          holidayHours: Number(calc.holiday_hours)
        },
        records: attendanceRecords.map(r => ({
          date: r.date,
          timeIn: r.timeIn,
          timeOut: r.timeOut,
          hours: Number(r.hoursWorked || 0),
          isLate: r.isLate,
          isAbsent: r.isAbsent,
          status: r.status
        }))
      },
      rules: {
        userSpecific: activeUserRules.map(r => ({
          id: r.payrollRule.id,
          name: r.payrollRule.name,
          type: r.payrollRule.type,
          amount: Number(r.payrollRule.amount),
          isPercentage: r.payrollRule.isPercentage,
          description: r.payrollRule.description
        })),
        global: globalRules.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          amount: Number(r.amount),
          isPercentage: r.isPercentage,
          description: r.description
        }))
      },
      systemSettings: systemSettings.reduce((acc, s) => {
        acc[s.key] = s.value
        return acc
      }, {} as Record<string, string>),
      
      // Detailed breakdown and formulas
      breakdown,
      
      // Raw calculation results from DB
      rawCalculation: {
        rates: {
          dailyRate: Number(calc.daily_rate),
          hourlyRate: Number(calc.hourly_rate)
        },
        attendance: {
          daysWorked: calc.days_worked,
          hoursWorked: Number(calc.hours_worked),
          overtimeHours: Number(calc.overtime_hours),
          undertimeHours: Number(calc.undertime_hours),
          lateHours: Number(calc.late_hours),
          holidayHours: Number(calc.holiday_hours)
        },
        earnings: {
          regularPay: Number(calc.regular_pay),
          overtimePay: Number(calc.overtime_pay),
          holidayPay: Number(calc.holiday_pay),
          allowances: Number(calc.allowances),
          bonuses: Number(calc.bonuses),
          thirteenthMonthPay: Number(calc.thirteenth_month_pay),
          serviceIncentiveLeave: Number(calc.service_incentive_leave),
          otherEarnings: Number(calc.other_earnings),
          totalEarnings: Number(calc.total_earnings),
          grossPay: Number(calc.gross_pay)
        },
        contributions: {
          gsis: Number(calc.gsis_contribution),
          philHealth: Number(calc.philhealth_contribution),
          pagibig: Number(calc.pagibig_contribution)
        },
        tax: {
          taxableIncome: Number(calc.taxable_income),
          withholdingTax: Number(calc.withholding_tax)
        },
        deductions: {
          lateDeductions: Number(calc.late_deductions),
          undertimeDeductions: Number(calc.undertime_deductions),
          loanDeductions: Number(calc.loan_deductions),
          otherDeductions: Number(calc.other_deductions),
          totalDeductions: Number(calc.total_deductions)
        },
        final: {
          netPay: Number(calc.net_pay)
        }
      }
    })

  } catch (error) {
    console.error("Error testing payroll calculation:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to test payroll calculation",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/payroll/test-calculation
 * 
 * Get list of users with attendance data for testing
 */
export async function GET() {
  try {
    // Get users with attendance records in the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const usersWithAttendance = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        attendanceRecords: {
          some: {
            date: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        department: true,
        _count: {
          select: {
            attendanceRecords: {
              where: {
                date: {
                  gte: startOfMonth,
                  lte: endOfMonth
                }
              }
            }
          }
        }
      },
      orderBy: { firstName: 'asc' }
    })

    return NextResponse.json({
      success: true,
      period: {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      },
      users: usersWithAttendance.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        employeeId: u.employeeId,
        department: u.department,
        attendanceRecordCount: u._count.attendanceRecords
      })),
      totalUsers: usersWithAttendance.length
    })

  } catch (error) {
    console.error("Error getting test users:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to get test users",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
