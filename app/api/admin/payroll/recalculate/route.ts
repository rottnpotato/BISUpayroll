import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

/**
 * POST /api/admin/payroll/recalculate
 * 
 * Triggers stored procedure to recalculate payroll for a period
 * Can recalculate for:
 * - All employees in a period
 * - Single user in a period
 * - Current month for all employees
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      payPeriodStart, 
      payPeriodEnd, 
      userId,
      scope = 'all' // 'all', 'user', 'current_month'
    } = body

    if (scope === 'user' && !userId) {
      return NextResponse.json(
        { error: "userId is required when scope is 'user'" },
        { status: 400 }
      )
    }

    if (scope === 'all' && (!payPeriodStart || !payPeriodEnd)) {
      return NextResponse.json(
        { error: "payPeriodStart and payPeriodEnd are required when scope is 'all'" },
        { status: 400 }
      )
    }

    let result: any

    if (scope === 'user') {
      // Recalculate for single user
      const startDate = payPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      const endDate = payPeriodEnd || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

      const calculation = await prisma.$queryRaw<any[]>`
        SELECT * FROM calculate_payroll_for_period(
          ${userId}::text,
          ${startDate}::date,
          ${endDate}::date
        )
      `

      if (calculation && calculation.length > 0) {
        const calc = calculation[0]
        
        // Ensure required fields have valid values
        const dailyRate = calc.daily_rate || 0
        const hourlyRate = calc.hourly_rate || (dailyRate / 8) || 0
        
        // Upsert to payroll_results table
        await prisma.payrollResult.upsert({
          where: {
            userId_payPeriodStart_payPeriodEnd: {
              userId: calc.user_id,
              payPeriodStart: new Date(startDate),
              payPeriodEnd: new Date(endDate)
            }
          },
          create: {
            user: {
              connect: { id: calc.user_id }
            },
            payPeriodStart: new Date(startDate),
            payPeriodEnd: new Date(endDate),
            dailyRate: dailyRate,
            hourlyRate: hourlyRate,
            daysWorked: calc.days_worked,
            hoursWorked: calc.hours_worked,
            overtimeHours: calc.overtime_hours,
            undertimeHours: calc.undertime_hours,
            lateHours: calc.late_hours,
            holidayHours: calc.holiday_hours,
            nightShiftHours: 0,
            regularPay: calc.regular_pay,
            overtimePay: calc.overtime_pay,
            holidayPay: calc.holiday_pay,
            nightDifferential: 0,
            allowances: calc.allowances,
            bonuses: calc.bonuses,
            thirteenthMonthPay: calc.thirteenth_month_pay,
            serviceIncentiveLeave: calc.service_incentive_leave,
            otherEarnings: calc.other_earnings,
            totalEarnings: calc.total_earnings,
            grossPay: calc.gross_pay,
            gsisContribution: calc.gsis_contribution,
            philHealthContribution: calc.philhealth_contribution,
            pagibigContribution: calc.pagibig_contribution,
            taxableIncome: calc.taxable_income,
            withholdingTax: calc.withholding_tax,
            lateDeductions: calc.late_deductions,
            undertimeDeductions: calc.undertime_deductions,
            loanDeductions: calc.loan_deductions,
            otherDeductions: calc.other_deductions,
            totalDeductions: calc.total_deductions,
            netPay: calc.net_pay,
          },
          update: {
            user: {
              connect: { id: calc.user_id }
            },
            dailyRate: dailyRate,
            hourlyRate: hourlyRate,
            daysWorked: calc.days_worked,
            hoursWorked: calc.hours_worked,
            overtimeHours: calc.overtime_hours,
            undertimeHours: calc.undertime_hours,
            lateHours: calc.late_hours,
            holidayHours: calc.holiday_hours,
            regularPay: calc.regular_pay,
            overtimePay: calc.overtime_pay,
            holidayPay: calc.holiday_pay,
            allowances: calc.allowances,
            bonuses: calc.bonuses,
            thirteenthMonthPay: calc.thirteenth_month_pay,
            serviceIncentiveLeave: calc.service_incentive_leave,
            otherEarnings: calc.other_earnings,
            totalEarnings: calc.total_earnings,
            grossPay: calc.gross_pay,
            gsisContribution: calc.gsis_contribution,
            philHealthContribution: calc.philhealth_contribution,
            pagibigContribution: calc.pagibig_contribution,
            taxableIncome: calc.taxable_income,
            withholdingTax: calc.withholding_tax,
            lateDeductions: calc.late_deductions,
            undertimeDeductions: calc.undertime_deductions,
            loanDeductions: calc.loan_deductions,
            otherDeductions: calc.other_deductions,
            totalDeductions: calc.total_deductions,
            netPay: calc.net_pay,
            updatedAt: new Date()
          }
        })

        result = {
          scope: 'user',
          userId: calc.user_id,
          payPeriod: { start: startDate, end: endDate },
          calculation: calc,
          message: 'Payroll recalculated successfully for user'
        }
      } else {
        return NextResponse.json(
          { error: "No payroll data calculated for user" },
          { status: 404 }
        )
      }

    } else if (scope === 'all') {
      // Recalculate for all employees
      const recalcResult = await prisma.$queryRaw<any[]>`
        SELECT * FROM recalculate_all_payroll_for_period(
          ${payPeriodStart}::date,
          ${payPeriodEnd}::date
        )
      `

      result = {
        scope: 'all',
        payPeriod: { start: payPeriodStart, end: payPeriodEnd },
        usersProcessed: recalcResult[0]?.users_processed || 0,
        usersUpdated: recalcResult[0]?.users_updated || 0,
        usersFailed: recalcResult[0]?.users_failed || 0,
        message: 'Payroll recalculated for all employees'
      }

    } else if (scope === 'current_month') {
      // Recalculate for current month
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const recalcResult = await prisma.$queryRaw<any[]>`
        SELECT * FROM recalculate_all_payroll_for_period(
          ${startDate}::date,
          ${endDate}::date
        )
      `

      result = {
        scope: 'current_month',
        payPeriod: { start: startDate, end: endDate },
        usersProcessed: recalcResult[0]?.users_processed || 0,
        usersUpdated: recalcResult[0]?.users_updated || 0,
        usersFailed: recalcResult[0]?.users_failed || 0,
        message: 'Payroll recalculated for current month'
      }
    } else {
      return NextResponse.json(
        { error: "Invalid scope. Must be 'all', 'user', or 'current_month'" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result,
      recalculatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error recalculating payroll:", error)
    return NextResponse.json(
      { 
        error: "Failed to recalculate payroll",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/payroll/recalculate
 * 
 * Get current month payroll summary using stored procedure
 */
export async function GET() {
  try {
    const summary = await prisma.$queryRaw<any[]>`
      SELECT * FROM get_current_month_payroll_summary()
    `

    if (summary && summary.length > 0) {
      return NextResponse.json({
        success: true,
        currentMonth: {
          totalEmployees: summary[0].total_employees,
          totalGrossPay: Number(summary[0].total_gross_pay),
          totalNetPay: Number(summary[0].total_net_pay),
          totalDeductions: Number(summary[0].total_deductions),
          avgNetPay: Number(summary[0].avg_net_pay)
        },
        period: {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
        }
      })
    }

    return NextResponse.json({
      success: true,
      currentMonth: {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDeductions: 0,
        avgNetPay: 0
      }
    })

  } catch (error) {
    console.error("Error getting payroll summary:", error)
    return NextResponse.json(
      { 
        error: "Failed to get payroll summary",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
