import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { shouldGeneratePayrollToday } from "@/lib/payroll-schedule-utils"
import { EmploymentStatus } from '@prisma/client'

/**
 * Automatic payroll generation endpoint
 * This endpoint checks if payroll should be generated today based on the active schedule
 * and generates it if needed
 */
export async function POST(request: NextRequest) {
  try {
    // Check if payroll should be generated today
    const checkResult = await shouldGeneratePayrollToday()

    if (!checkResult.shouldGenerate || !checkResult.period) {
      return NextResponse.json({
        generated: false,
        reason: checkResult.reason
      })
    }

    const { startDate, endDate, scheduleId, scheduleName, scheduleType } = checkResult.period

    console.log(`Auto-generating payroll for period ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Get all active employees
    const users = await prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
        status: { not: EmploymentStatus.INACTIVE }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        position: true,
        status: true,
        role: true
      }
    })

    if (users.length === 0) {
      return NextResponse.json({
        generated: false,
        reason: "No active employees found for payroll generation"
      })
    }

    console.log(`Found ${users.length} active employees for auto-generation`)

    const payrollResults = []
    const errors = []

    // Use stored procedure to calculate payroll for each user
    for (const user of users) {
      try {
        // Call stored procedure for payroll calculation
        const calculation = await prisma.$queryRaw<any[]>`
          SELECT * FROM calculate_payroll_for_period(
            ${user.id}::text,
            ${startDate}::date,
            ${endDate}::date
          )
        `

        if (!calculation || calculation.length === 0) {
          throw new Error('No payroll calculation returned from stored procedure')
        }

        const calc = calculation[0]
        
        // Ensure required fields have valid values
        const dailyRate = calc.daily_rate || 0
        const hourlyRate = calc.hourly_rate || (dailyRate / 8) || 0
        const regularPay = calc.regular_pay || 0
        const totalEarnings = calc.total_earnings || 0
        const grossPay = calc.gross_pay || 0
        const totalDeductions = calc.total_deductions || 0
        const netPay = calc.net_pay || 0
        
        // Upsert PayrollResult record
        const payrollResult = await prisma.payrollResult.upsert({
          where: {
            userId_payPeriodStart_payPeriodEnd: {
              userId: calc.user_id,
              payPeriodStart: startDate,
              payPeriodEnd: endDate
            }
          },
          create: {
            user: { connect: { id: calc.user_id } },
            payrollScheduleId: scheduleId,
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            dailyRate: dailyRate,
            hourlyRate: hourlyRate,
            daysWorked: calc.days_worked || 0,
            hoursWorked: calc.hours_worked || 0,
            overtimeHours: calc.overtime_hours || 0,
            undertimeHours: calc.undertime_hours || 0,
            lateHours: calc.late_hours || 0,
            holidayHours: calc.holiday_hours || 0,
            nightShiftHours: 0,
            regularPay: regularPay,
            overtimePay: calc.overtime_pay || 0,
            holidayPay: calc.holiday_pay || 0,
            nightDifferential: 0,
            allowances: calc.allowances || 0,
            bonuses: calc.bonuses || 0,
            thirteenthMonthPay: calc.thirteenth_month_pay || 0,
            serviceIncentiveLeave: calc.service_incentive_leave || 0,
            otherEarnings: calc.other_earnings || 0,
            totalEarnings: totalEarnings,
            grossPay: grossPay,
            gsisContribution: calc.gsis_contribution || 0,
            philHealthContribution: calc.philhealth_contribution || 0,
            pagibigContribution: calc.pagibig_contribution || 0,
            taxableIncome: calc.taxable_income || 0,
            withholdingTax: calc.withholding_tax || 0,
            lateDeductions: calc.late_deductions || 0,
            undertimeDeductions: calc.undertime_deductions || 0,
            loanDeductions: calc.loan_deductions || 0,
            otherDeductions: calc.other_deductions || 0,
            totalDeductions: totalDeductions,
            netPay: netPay,
            status: 'GENERATED',
            appliedRules: '[]'
          },
          update: {
            payrollScheduleId: scheduleId,
            dailyRate: dailyRate,
            hourlyRate: hourlyRate,
            daysWorked: calc.days_worked || 0,
            hoursWorked: calc.hours_worked || 0,
            overtimeHours: calc.overtime_hours || 0,
            undertimeHours: calc.undertime_hours || 0,
            lateHours: calc.late_hours || 0,
            holidayHours: calc.holiday_hours || 0,
            regularPay: regularPay,
            overtimePay: calc.overtime_pay || 0,
            holidayPay: calc.holiday_pay || 0,
            allowances: calc.allowances || 0,
            bonuses: calc.bonuses || 0,
            thirteenthMonthPay: calc.thirteenth_month_pay || 0,
            serviceIncentiveLeave: calc.service_incentive_leave || 0,
            otherEarnings: calc.other_earnings || 0,
            totalEarnings: totalEarnings,
            grossPay: grossPay,
            gsisContribution: calc.gsis_contribution || 0,
            philHealthContribution: calc.philhealth_contribution || 0,
            pagibigContribution: calc.pagibig_contribution || 0,
            taxableIncome: calc.taxable_income || 0,
            withholdingTax: calc.withholding_tax || 0,
            lateDeductions: calc.late_deductions || 0,
            undertimeDeductions: calc.undertime_deductions || 0,
            loanDeductions: calc.loan_deductions || 0,
            otherDeductions: calc.other_deductions || 0,
            totalDeductions: totalDeductions,
            netPay: netPay,
            updatedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: true,
                position: true,
                status: true
              }
            }
          }
        })

        payrollResults.push(payrollResult)

      } catch (error) {
        console.error(`Error generating payroll for user ${user.id}:`, error)
        errors.push({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    if (payrollResults.length === 0) {
      return NextResponse.json({
        generated: false,
        reason: "Failed to generate payroll for any employees",
        errors
      })
    }

    // Notify all admin users about the automatic generation
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    const totalGrossPay = payrollResults.reduce((sum, r) => sum + Number(r.grossPay), 0)
    const totalNetPay = payrollResults.reduce((sum, r) => sum + Number(r.netPay), 0)

    const notificationTitle = `Payroll Automatically Generated - ${scheduleName}`
    const notificationMessage = `Payroll for ${payrollResults.length} employees has been automatically generated for the period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}. Total Net Pay: ₱${totalNetPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

    // Create notifications for all admins
    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'PAYROLL_GENERATED',
          title: notificationTitle,
          message: notificationMessage,
          link: '/admin/payroll',
          metadata: JSON.stringify({
            scheduleId,
            scheduleName,
            scheduleType,
            payPeriodStart: startDate.toISOString(),
            payPeriodEnd: endDate.toISOString(),
            employeeCount: payrollResults.length,
            totalGrossPay,
            totalNetPay,
            generatedAt: new Date().toISOString()
          })
        }
      })
    }

    console.log(`Successfully auto-generated payroll for ${payrollResults.length} employees and notified ${adminUsers.length} admins`)

    return NextResponse.json({
      generated: true,
      schedule: {
        id: scheduleId,
        name: scheduleName,
        type: scheduleType
      },
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      results: {
        employeeCount: payrollResults.length,
        totalGrossPay,
        totalNetPay,
        errors: errors.length > 0 ? errors : undefined
      },
      notifications: {
        adminsNotified: adminUsers.length
      }
    })

  } catch (error) {
    console.error("Error in automatic payroll generation:", error)
    return NextResponse.json(
      { 
        generated: false,
        error: "Failed to generate payroll automatically",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if payroll should be generated today
 * (without actually generating it)
 */
export async function GET(request: NextRequest) {
  try {
    const checkResult = await shouldGeneratePayrollToday()
    
    return NextResponse.json({
      shouldGenerate: checkResult.shouldGenerate,
      reason: checkResult.reason,
      period: checkResult.period ? {
        start: checkResult.period.startDate.toISOString(),
        end: checkResult.period.endDate.toISOString(),
        schedule: {
          id: checkResult.period.scheduleId,
          name: checkResult.period.scheduleName,
          type: checkResult.period.scheduleType
        }
      } : null
    })
  } catch (error) {
    console.error("Error checking payroll generation status:", error)
    return NextResponse.json(
      { 
        error: "Failed to check payroll generation status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
