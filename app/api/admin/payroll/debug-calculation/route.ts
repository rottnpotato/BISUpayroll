import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { format } from "date-fns"

/**
 * Debug API endpoint for inspecting stored procedure payroll calculations
 * GET /api/admin/payroll/debug-calculation?userId=xxx&start=2025-10-01&end=2025-10-31
 * 
 * Returns detailed breakdown of all calculation steps, system settings,
 * attendance records, payroll rules, and intermediate values, plus payslip preview data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const payPeriodStart = searchParams.get('start')
    const payPeriodEnd = searchParams.get('end')

    if (!userId || !payPeriodStart || !payPeriodEnd) {
      return NextResponse.json(
        { 
          error: "Missing required parameters",
          required: {
            userId: "User ID to debug",
            start: "Pay period start date (YYYY-MM-DD)",
            end: "Pay period end date (YYYY-MM-DD)"
          },
          example: "/api/admin/payroll/debug-calculation?userId=clxxx&start=2025-10-01&end=2025-10-31"
        },
        { status: 400 }
      )
    }

    const startDate = new Date(payPeriodStart)
    const endDate = new Date(payPeriodEnd)

    // 1. Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        position: true,
        status: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // 2. Get system settings that affect payroll
    const systemSettings = await prisma.systemSettings.findMany({
      where: {
        OR: [
          { key: { startsWith: 'rates_' } },
          { key: { startsWith: 'working_hours_' } },
          { key: { startsWith: 'tax_' } },
          { key: { startsWith: 'contribution_' } }
        ]
      },
      select: {
        key: true,
        value: true,
        dataType: true,
        description: true,
        updatedAt: true
      }
    })

    // 3. Get attendance records for the period
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        date: true,
        status: true,
        timeIn: true,
        timeOut: true,
        hoursWorked: true,
        isLate: true,
        isAbsent: true,
        isHalfDay: true,
        sessionType: true
      },
      orderBy: { date: 'asc' }
    })

    // 4. Get active payroll rules and roles
    const userPayrollRoles = await prisma.userPayrollRole.findMany({
      where: {
        userId: userId
      },
      include: {
        payrollRole: true
      }
    })
    
    const payrollRules = await prisma.payrollRule.findMany({
      where: {
        isActive: true,
        applyToAll: true
      }
    })
    
    const userSpecificRules = await prisma.payrollRuleAssignment.findMany({
      where: {
        userId: userId
      },
      include: {
        payrollRule: true
      }
    })

    // 5. Call the stored procedure to get calculation
    const calculation = await prisma.$queryRaw<any[]>`
      SELECT * FROM calculate_payroll_for_period(
        ${userId}::text,
        ${startDate}::date,
        ${endDate}::date
      )
    `

    let calculationResult = null
    if (calculation && calculation.length > 0) {
      calculationResult = calculation[0]
    }

    // 6. Get existing PayrollResult record if any
    const existingPayrollResult = await prisma.payrollResult.findUnique({
      where: {
        userId_payPeriodStart_payPeriodEnd: {
          userId: userId,
          payPeriodStart: startDate,
          payPeriodEnd: endDate
        }
      },
      select: {
        id: true,
        status: true,
        dailyRate: true,
        hourlyRate: true,
        daysWorked: true,
        hoursWorked: true,
        overtimeHours: true,
        undertimeHours: true,
        lateHours: true,
        holidayHours: true,
        regularPay: true,
        overtimePay: true,
        holidayPay: true,
        allowances: true,
        bonuses: true,
        thirteenthMonthPay: true,
        serviceIncentiveLeave: true,
        totalEarnings: true,
        grossPay: true,
        gsisContribution: true,
        philHealthContribution: true,
        pagibigContribution: true,
        withholdingTax: true,
        lateDeductions: true,
        undertimeDeductions: true,
        loanDeductions: true,
        totalDeductions: true,
        netPay: true,
        appliedRules: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // 7. Generate payslip preview data
    let payslipPreview = null
    if (calculationResult) {
      const calc = calculationResult
      
      // Parse applied rules if they exist
      let parsedAppliedRules: Array<{ name: string; type: string; amount: number }> = []
      try {
        if (existingPayrollResult?.appliedRules) {
          parsedAppliedRules = JSON.parse(existingPayrollResult.appliedRules)
        }
      } catch (e) {
        console.warn('Failed to parse applied rules', e)
      }

      payslipPreview = {
        payrollRecordId: existingPayrollResult?.id || `DEBUG_${Date.now()}`,
        payPeriodStart: format(startDate, 'MMM dd, yyyy'),
        payPeriodEnd: format(endDate, 'MMM dd, yyyy'),
        generatedAt: format(new Date(), 'MMM dd, yyyy HH:mm'),
        employee: {
          name: `${user.firstName} ${user.lastName}`,
          employeeId: user.employeeId,
          department: user.department,
          position: user.position,
          hireDate: user.createdAt ? format(user.createdAt, 'MMM dd, yyyy') : null
        },
        calculations: {
          // Use daily rate × days worked as monthly salary approximation
          monthlySalary: Number(calc.daily_rate || 0) * 22, // Assume 22 working days
          basePay: Number(calc.regular_pay || 0),
          overtimePay: Number(calc.overtime_pay || 0),
          bonuses: Number(calc.bonuses || 0) + Number(calc.holiday_pay || 0),
          grossPay: Number(calc.gross_pay || 0),
          netPay: Number(calc.net_pay || 0),
          lateDeductions: Number(calc.late_deductions || 0),
          governmentDeductions: 
            Number(calc.gsis_contribution || 0) +
            Number(calc.philhealth_contribution || 0) +
            Number(calc.pagibig_contribution || 0) +
            Number(calc.withholding_tax || 0),
          loanDeductions: Number(calc.loan_deductions || 0),
          otherDeductions: Number(calc.other_deductions || 0) + Number(calc.undertime_deductions || 0),
          totalDeductions: Number(calc.total_deductions || 0)
        },
        deductionBreakdown: {
          gsis: Number(calc.gsis_contribution || 0),
          philHealth: Number(calc.philhealth_contribution || 0),
          pagibig: Number(calc.pagibig_contribution || 0),
          withholdingTax: Number(calc.withholding_tax || 0),
          late: Number(calc.late_deductions || 0),
          undertime: Number(calc.undertime_deductions || 0),
          loans: Number(calc.loan_deductions || 0),
          other: Number(calc.other_deductions || 0)
        },
        earningsBreakdown: {
          regular: Number(calc.regular_pay || 0),
          overtime: Number(calc.overtime_pay || 0),
          holiday: Number(calc.holiday_pay || 0),
          allowances: Number(calc.allowances || 0),
          bonuses: Number(calc.bonuses || 0),
          thirteenthMonth: Number(calc.thirteenth_month_pay || 0),
          serviceIncentiveLeave: Number(calc.service_incentive_leave || 0),
          other: Number(calc.other_earnings || 0)
        },
        appliedRules: parsedAppliedRules,
        attendanceSummary: {
          daysWorked: Number(calc.days_worked || 0),
          hoursWorked: Number(calc.hours_worked || 0),
          overtimeHours: Number(calc.overtime_hours || 0),
          lateHours: Number(calc.late_hours || 0),
          holidayHours: Number(calc.holiday_hours || 0)
        },
        notes: [
          calculationResult ? '✓ Calculation successful' : '✗ No calculation result',
          attendanceRecords.length > 0 ? `✓ ${attendanceRecords.length} attendance records` : '✗ No attendance records',
          attendanceRecords.some(r => r.status === 'APPROVED') ? '✓ Has approved attendance' : '⚠ No approved attendance'
        ]
      }
    }

    // 8. Build debug response with detailed breakdown
    const debugInfo = {
      timestamp: new Date().toISOString(),
      request: {
        userId,
        payPeriodStart,
        payPeriodEnd,
        periodDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      },
      user: {
        ...user,
        hasUserSpecificRules: userSpecificRules.length,
        hasGlobalRules: payrollRules.length,
        hasPayrollRoles: userPayrollRoles.length
      },
      systemSettings: {
        raw: systemSettings,
        parsed: {
          rates: systemSettings
            .filter((s: any) => s.key.startsWith('rates_'))
            .reduce((acc: any, s: any) => {
              acc[s.key.replace('rates_', '')] = s.value
              return acc
            }, {} as Record<string, string>),
          workingHours: systemSettings
            .filter((s: any) => s.key.startsWith('working_hours_'))
            .reduce((acc: any, s: any) => {
              acc[s.key.replace('working_hours_', '')] = s.value
              return acc
            }, {} as Record<string, string>)
        }
      },
      attendance: {
        recordCount: attendanceRecords.length,
        summary: {
          totalDays: attendanceRecords.length,
          approvedDays: attendanceRecords.filter(r => r.status === 'APPROVED').length,
          pendingDays: attendanceRecords.filter(r => r.status === 'PENDING').length,
          totalHours: attendanceRecords.reduce((sum, r) => sum + (Number(r.hoursWorked) || 0), 0),
          lateDays: attendanceRecords.filter(r => r.isLate).length,
          absentDays: attendanceRecords.filter(r => r.isAbsent).length,
          halfDays: attendanceRecords.filter(r => r.isHalfDay).length
        },
        records: attendanceRecords.map(r => ({
          date: r.date,
          status: r.status,
          sessionType: r.sessionType,
          timeIn: r.timeIn,
          timeOut: r.timeOut,
          hoursWorked: Number(r.hoursWorked),
          isLate: r.isLate,
          isAbsent: r.isAbsent,
          isHalfDay: r.isHalfDay
        }))
      },
      payrollRules: {
        globalRules: payrollRules.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          amount: Number(r.amount),
          isPercentage: r.isPercentage,
          description: r.description,
          applyToAll: r.applyToAll
        })),
        userSpecificRules: userSpecificRules.map(a => ({
          id: a.payrollRule.id,
          name: a.payrollRule.name,
          type: a.payrollRule.type,
          amount: Number(a.payrollRule.amount),
          isPercentage: a.payrollRule.isPercentage,
          description: a.payrollRule.description
        })),
        userPayrollRoles: userPayrollRoles.map(r => ({
          id: r.payrollRole.id,
          name: r.payrollRole.name,
          department: r.payrollRole.department,
          position: r.payrollRole.position,
          dailyRate: r.payrollRole.dailyRate ? Number(r.payrollRole.dailyRate) : null,
          isActive: r.payrollRole.isActive
        })),
        summary: {
          totalGlobalRules: payrollRules.length,
          totalUserRules: userSpecificRules.length,
          totalPayrollRoles: userPayrollRoles.length
        }
      },
      storedProcedureCalculation: calculationResult ? {
        raw: calculationResult,
        formatted: {
          // Base rates
          dailyRate: Number(calculationResult.daily_rate || 0),
          hourlyRate: Number(calculationResult.hourly_rate || 0),
          
          // Attendance metrics
          daysWorked: Number(calculationResult.days_worked || 0),
          hoursWorked: Number(calculationResult.hours_worked || 0),
          overtimeHours: Number(calculationResult.overtime_hours || 0),
          undertimeHours: Number(calculationResult.undertime_hours || 0),
          lateHours: Number(calculationResult.late_hours || 0),
          holidayHours: Number(calculationResult.holiday_hours || 0),
          
          // Earnings
          regularPay: Number(calculationResult.regular_pay || 0),
          overtimePay: Number(calculationResult.overtime_pay || 0),
          holidayPay: Number(calculationResult.holiday_pay || 0),
          allowances: Number(calculationResult.allowances || 0),
          bonuses: Number(calculationResult.bonuses || 0),
          thirteenthMonthPay: Number(calculationResult.thirteenth_month_pay || 0),
          serviceIncentiveLeave: Number(calculationResult.service_incentive_leave || 0),
          otherEarnings: Number(calculationResult.other_earnings || 0),
          totalEarnings: Number(calculationResult.total_earnings || 0),
          grossPay: Number(calculationResult.gross_pay || 0),
          
          // Deductions
          gsisContribution: Number(calculationResult.gsis_contribution || 0),
          philHealthContribution: Number(calculationResult.philhealth_contribution || 0),
          pagibigContribution: Number(calculationResult.pagibig_contribution || 0),
          taxableIncome: Number(calculationResult.taxable_income || 0),
          withholdingTax: Number(calculationResult.withholding_tax || 0),
          lateDeductions: Number(calculationResult.late_deductions || 0),
          undertimeDeductions: Number(calculationResult.undertime_deductions || 0),
          loanDeductions: Number(calculationResult.loan_deductions || 0),
          otherDeductions: Number(calculationResult.other_deductions || 0),
          totalDeductions: Number(calculationResult.total_deductions || 0),
          
          // Final
          netPay: Number(calculationResult.net_pay || 0)
        }
      } : null,
      existingRecord: existingPayrollResult,
      comparison: existingPayrollResult && calculationResult ? {
        dailyRateDiff: Number(existingPayrollResult.dailyRate) - Number(calculationResult.daily_rate || 0),
        netPayDiff: Number(existingPayrollResult.netPay) - Number(calculationResult.net_pay || 0),
        grossPayDiff: Number(existingPayrollResult.grossPay) - Number(calculationResult.gross_pay || 0),
        matches: {
          dailyRate: Number(existingPayrollResult.dailyRate) === Number(calculationResult.daily_rate || 0),
          netPay: Number(existingPayrollResult.netPay) === Number(calculationResult.net_pay || 0),
          grossPay: Number(existingPayrollResult.grossPay) === Number(calculationResult.gross_pay || 0)
        }
      } : null,
      payslipPreview,
      diagnostics: {
        hasStoredProcResult: calculationResult !== null,
        hasExistingRecord: existingPayrollResult !== null,
        hasAttendanceRecords: attendanceRecords.length > 0,
        hasPayrollRules: payrollRules.length > 0 || userSpecificRules.length > 0,
        hasApprovedAttendance: attendanceRecords.some(r => r.status === 'APPROVED'),
        warnings: [] as string[]
      }
    }

    // Add diagnostic warnings
    if (!calculationResult) {
      debugInfo.diagnostics.warnings.push("⚠️ Stored procedure returned no result")
    }
    if (attendanceRecords.length === 0) {
      debugInfo.diagnostics.warnings.push("⚠️ No attendance records found for this period")
    }
    if (!attendanceRecords.some(r => r.status === 'APPROVED')) {
      debugInfo.diagnostics.warnings.push("⚠️ No approved attendance records found")
    }
    if (payrollRules.length === 0 && userSpecificRules.length === 0 && userPayrollRoles.length === 0) {
      debugInfo.diagnostics.warnings.push("⚠️ No active payroll rules or roles found")
    }
    if (calculationResult && Number(calculationResult.net_pay || 0) === 0) {
      debugInfo.diagnostics.warnings.push("⚠️ Net pay is zero - check attendance and rates")
    }

    return NextResponse.json(debugInfo, { status: 200 })

  } catch (error) {
    console.error("Debug calculation error:", error)
    return NextResponse.json(
      { 
        error: "Failed to debug calculation",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
