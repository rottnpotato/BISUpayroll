import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { generatePayslipDocx } from '@/lib/payslip-docx'
import { fetchAllPunchAttendance } from '@/lib/attendance-punches'
import libre from 'libreoffice-convert'
import { promisify } from 'util'

const libreConvertAsync = promisify(libre.convert)

// Helper to format numeric safely
const num = (v: any) => Number(v || 0)

type EmploymentStatus = 'PERMANENT' | 'TEMPORARY' | 'CONTRACTUAL' | 'INACTIVE'

// Payslip generation allowed days based on employment status
const ALLOWED_DAYS: Record<EmploymentStatus, number[]> = {
  PERMANENT: [15, 30],
  TEMPORARY: [5, 20],
  CONTRACTUAL: [5, 10, 20],
  INACTIVE: [15, 30],
}

function canGeneratePayslip(status: EmploymentStatus): boolean {
  const today = new Date()
  const dayOfMonth = today.getDate()
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const allowedDays = ALLOWED_DAYS[status] || ALLOWED_DAYS.CONTRACTUAL
  
  return allowedDays.some(day => {
    if (day === 30 && lastDayOfMonth < 30) {
      return dayOfMonth === lastDayOfMonth
    }
    return dayOfMonth === day
  })
}

function formatAllowedDays(status: EmploymentStatus): string {
  const days = ALLOWED_DAYS[status] || ALLOWED_DAYS.CONTRACTUAL
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }
  return days.map(d => `${d}${getOrdinalSuffix(d)}`).join(' and ')
}

/**
 * Check if the requested pay period has already ended (is a past cutoff period).
 * Employees can generate payslips for past periods at any time.
 */
function isPastCutoffPeriod(periodEnd: Date): boolean {
  const now = new Date()
  return periodEnd < now
}

/**
 * Get the cutoff periods for a given month based on employment status
 * PERMANENT: 1st-15th (1st half), 16th-end (2nd half)
 * CONTRACTUAL/TEMPORARY: 21st-5th (1st half), 6th-20th (2nd half)
 */
function getHalfPeriodDates(payPeriodStart: Date, payPeriodEnd: Date, status: EmploymentStatus): {
  firstHalf: { start: Date; end: Date };
  secondHalf: { start: Date; end: Date };
} {
  const year = payPeriodEnd.getFullYear()
  const month = payPeriodEnd.getMonth()
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()

  if (status === 'PERMANENT' || status === 'INACTIVE') {
    // PERMANENT: 1st-15th and 16th-end of month
    return {
      firstHalf: {
        start: new Date(year, month, 1),
        end: new Date(year, month, 15, 23, 59, 59, 999)
      },
      secondHalf: {
        start: new Date(year, month, 16),
        end: new Date(year, month, lastDayOfMonth, 23, 59, 59, 999)
      }
    }
  } else {
    // CONTRACTUAL/TEMPORARY: 21st-5th and 6th-20th
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    
    return {
      firstHalf: {
        start: new Date(prevYear, prevMonth, 21),
        end: new Date(year, month, 5, 23, 59, 59, 999)
      },
      secondHalf: {
        start: new Date(year, month, 6),
        end: new Date(year, month, 20, 23, 59, 59, 999)
      }
    }
  }
}

/**
 * Calculate half-period deductions based on employment status
 * For PERMANENT employees:
 *   - 1st Half: Late, Undertime, Pag-IBIG only
 *   - 2nd Half: Late, Undertime, GSIS, PhilHealth, Tax, Loans, Other
 * For CONTRACTUAL/TEMPORARY: Deductions are optional/manually added
 */
interface HalfPeriodDeductions {
  firstHalf: {
    lateDeductions: number
    undertimeDeductions: number
    pagibigContribution: number
    totalDeductions: number
  }
  secondHalf: {
    lateDeductions: number
    undertimeDeductions: number
    gsisContribution: number
    philHealthContribution: number
    withholdingTax: number
    loanDeductions: number
    otherDeductions: number
    totalDeductions: number
  }
}

function calculateHalfPeriodDeductions(
  status: EmploymentStatus,
  lateDeductions: number,
  undertimeDeductions: number,
  gsisContribution: number,
  philHealthContribution: number,
  pagibigContribution: number,
  withholdingTax: number,
  loanDeductions: number,
  otherDeductions: number
): HalfPeriodDeductions {
  // Split time-based deductions proportionally (assume 50/50 for simplicity)
  const halfLate = lateDeductions / 2
  const halfUndertime = undertimeDeductions / 2
  
  if (status === 'PERMANENT' || status === 'INACTIVE') {
    // PERMANENT: Pag-IBIG in 1st half, rest in 2nd half
    return {
      firstHalf: {
        lateDeductions: halfLate,
        undertimeDeductions: halfUndertime,
        pagibigContribution: pagibigContribution,
        totalDeductions: halfLate + halfUndertime + pagibigContribution
      },
      secondHalf: {
        lateDeductions: halfLate,
        undertimeDeductions: halfUndertime,
        gsisContribution: gsisContribution,
        philHealthContribution: philHealthContribution,
        withholdingTax: withholdingTax,
        loanDeductions: loanDeductions,
        otherDeductions: otherDeductions,
        totalDeductions: halfLate + halfUndertime + gsisContribution + philHealthContribution + withholdingTax + loanDeductions + otherDeductions
      }
    }
  } else {
    // CONTRACTUAL/TEMPORARY: No automatic government deductions
    // Split other deductions evenly between halves
    const halfLoans = loanDeductions / 2
    const halfOther = otherDeductions / 2
    
    return {
      firstHalf: {
        lateDeductions: halfLate,
        undertimeDeductions: halfUndertime,
        pagibigContribution: 0,
        totalDeductions: halfLate + halfUndertime + halfLoans + halfOther
      },
      secondHalf: {
        lateDeductions: halfLate,
        undertimeDeductions: halfUndertime,
        gsisContribution: 0,
        philHealthContribution: 0,
        withholdingTax: 0,
        loanDeductions: halfLoans,
        otherDeductions: halfOther,
        totalDeductions: halfLate + halfUndertime + halfLoans + halfOther
      }
    }
  }
}

/**
 * POST /api/employee/payslip/generate
 * Generates a payslip on-demand based on real-time attendance data
 * Does NOT require a PayrollRecord to exist
 * 
 * Body parameters:
 * - payPeriodStart: ISO date string
 * - payPeriodEnd: ISO date string
 * - format: 'pdf' | 'docx' (optional, default: 'pdf')
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const body = await request.json()
    const { payPeriodStart: periodStartStr, payPeriodEnd: periodEndStr, format = 'pdf' } = body

    if (!periodStartStr || !periodEndStr) {
      return NextResponse.json({ 
        success: false, 
        message: 'payPeriodStart and payPeriodEnd are required' 
      }, { status: 400 })
    }

    const payPeriodStart = new Date(periodStartStr)
    const payPeriodEnd = new Date(periodEndStr)

    // Get active payroll schedule to determine schedule type
    const activeSchedule = await prisma.payrollSchedule.findFirst({
      where: { isActive: true },
      select: { name: true }
    })

    // Get employee data
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
        status: true,
      }
    })

    if (!employeeData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Employee data not found' 
      }, { status: 404 })
    }

    // Validate payslip generation date based on employment status
    // Past periods (already ended) can be generated anytime
    // Current/future periods are restricted to payout days only
    const employmentStatus = employeeData.status as EmploymentStatus
    const periodIsInPast = isPastCutoffPeriod(payPeriodEnd)
    
    if (!periodIsInPast && !canGeneratePayslip(employmentStatus)) {
      const allowedDays = formatAllowedDays(employmentStatus)
      return NextResponse.json({ 
        success: false, 
        message: `Payslip generation is only available on the ${allowedDays} of each month for ${employmentStatus.toLowerCase()} employees.`
      }, { status: 403 })
    }

    // Get attendance data for the period from punches
    const { records: attendanceRecords } = await fetchAllPunchAttendance({
      userId: user.id,
      startDate: payPeriodStart,
      endDate: payPeriodEnd
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
            'working_hours_lateGraceMinutes',
            'working_hours_lateDeductionBasis',
            'working_hours_lateDeductionAmount',
            'rates_overtimeRate1',
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
        ${payPeriodStart}::DATE,
        ${payPeriodEnd}::DATE
      )
    `

    const calculation = payrollResult[0]

    if (!calculation) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to calculate payroll for payslip generation' 
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
    const bonuses = Number(calculation.bonuses || 0)
    const allowances = Number(calculation.allowances || 0)
    const holidayPay = Number(calculation.holiday_pay || 0)
    const overloadPay = Number(calculation.overload_pay || 0)

    const gsisContribution = Number(calculation.gsis_contribution || 0)
    const philHealthContribution = Number(calculation.philhealth_contribution || 0)
    const pagibigContribution = Number(calculation.pagibig_contribution || 0)
    const withholdingTax = Number(calculation.withholding_tax || 0)
    
    const governmentDeductions = gsisContribution + philHealthContribution + pagibigContribution
    const loanDeductions = Number(calculation.loan_deductions || 0)
    const otherDeductions = Number(calculation.other_deductions || 0)
    const lateDeductions = Number(calculation.late_deductions || 0)
    const undertimeDeductions = Number(calculation.undertime_deductions || 0)

    const totalDeductions = Number(calculation.total_deductions || 0)
    const grossPay = Number(calculation.gross_pay || 0)
    const netPay = Number(calculation.net_pay || 0)

    const monthlySalary = dailyRate * 22

    // Build applied rules list
    const appliedRules: any[] = payrollRules.map(rule => {
      let calculatedAmount = 0
      
      if (rule.type === 'daily_rate') {
        calculatedAmount = dailyRate
      } else if (rule.type === 'bonus') {
        calculatedAmount = rule.isPercentage ? grossPay * Number(rule.amount) / 100 : Number(rule.amount)
      } else if (rule.type === 'allowance') {
        calculatedAmount = rule.isPercentage ? grossPay * Number(rule.amount) / 100 : Number(rule.amount)
      } else if (rule.type === 'deduction') {
        if (rule.name.toLowerCase().includes('gsis')) {
          calculatedAmount = gsisContribution
        } else if (rule.name.toLowerCase().includes('philhealth')) {
          calculatedAmount = philHealthContribution
        } else if (rule.name.toLowerCase().includes('pagibig')) {
          calculatedAmount = pagibigContribution
        } else if (rule.name.toLowerCase().includes('tax')) {
          calculatedAmount = withholdingTax
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

    // Build deduction breakdown with individual amounts
    const deductionBreakdown: any = {
      gsisContribution: gsisContribution,
      philHealthContribution: philHealthContribution,
      pagibigContribution: pagibigContribution,
      withholdingTax: withholdingTax
    }

    // Calculate half-period deductions based on employment status
    const halfPeriodDeductions = calculateHalfPeriodDeductions(
      employmentStatus,
      lateDeductions,
      undertimeDeductions,
      gsisContribution,
      philHealthContribution,
      pagibigContribution,
      withholdingTax,
      loanDeductions,
      otherDeductions
    )

    // Calculate half-period net pay
    // Gross pay is split evenly, then deductions are applied per half
    const halfGrossPay = grossPay / 2
    const firstHalfCalculations = {
      grossPay: halfGrossPay,
      deductions: halfPeriodDeductions.firstHalf.totalDeductions,
      netPay: halfGrossPay - halfPeriodDeductions.firstHalf.totalDeductions,
      lateDeductions: halfPeriodDeductions.firstHalf.lateDeductions,
      undertimeDeductions: halfPeriodDeductions.firstHalf.undertimeDeductions,
      pagibigContribution: halfPeriodDeductions.firstHalf.pagibigContribution
    }
    const secondHalfCalculations = {
      grossPay: halfGrossPay,
      deductions: halfPeriodDeductions.secondHalf.totalDeductions,
      netPay: halfGrossPay - halfPeriodDeductions.secondHalf.totalDeductions,
      lateDeductions: halfPeriodDeductions.secondHalf.lateDeductions,
      undertimeDeductions: halfPeriodDeductions.secondHalf.undertimeDeductions,
      gsisContribution: halfPeriodDeductions.secondHalf.gsisContribution,
      philHealthContribution: halfPeriodDeductions.secondHalf.philHealthContribution,
      withholdingTax: halfPeriodDeductions.secondHalf.withholdingTax,
      loanDeductions: halfPeriodDeductions.secondHalf.loanDeductions,
      otherDeductions: halfPeriodDeductions.secondHalf.otherDeductions
    }

    // Prepare payslip data
    const payslipData = {
      payrollRecordId: null, // No record ID since we're generating on-demand
      payPeriodStart: payPeriodStart,
      payPeriodEnd: payPeriodEnd,
      generatedAt: new Date(),
      scheduleType: activeSchedule?.name || 'monthly', // Include schedule type
      employmentStatus: employmentStatus, // Include employment status for deduction logic
      employee: {
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        employeeId: employeeData.employeeId,
        department: employeeData.department,
        position: employeeData.position,
        hireDate: employeeData.hireDate
      },
      calculations: {
        monthlySalary: monthlySalary,
        basePay: basePay,
        overtimePay: overtimePay,
        bonuses: bonuses + holidayPay + allowances + overloadPay,
        grossPay: grossPay,
        netPay: netPay,
        lateDeductions: lateDeductions,
        undertimeDeductions: undertimeDeductions,
        governmentDeductions: governmentDeductions,
        loanDeductions: loanDeductions,
        otherDeductions: otherDeductions,
        totalDeductions: totalDeductions
      },
      // Half-period calculations for bi-monthly payslips
      firstHalfCalculations: firstHalfCalculations,
      secondHalfCalculations: secondHalfCalculations,
      deductionBreakdown: deductionBreakdown,
      appliedRules: appliedRules,
      attendanceStats: {
        workingDays,
        totalHoursWorked,
        regularHours,
        overtimeHours,
        lateCount,
        absentCount
      }
    }


    // Generate DOCX
    const { fileName, buffer } = await generatePayslipDocx(payslipData)

    // Convert to PDF if requested
    if (format === 'pdf') {
      try {
        const pdfBuf: Buffer = await libreConvertAsync(buffer, '.pdf', undefined)
        const pdfName = fileName.replace(/\.docx$/i, '.pdf')
        const uint8 = new Uint8Array(pdfBuf)
        return new Response(uint8, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${pdfName}"`,
            'Content-Length': pdfBuf.length.toString()
          }
        }) as NextResponse
      } catch (convErr) {
        console.error('PDF conversion failed, falling back to DOCX', convErr)
        // Fall through to return DOCX below
      }
    }

    // Return DOCX
    const uint8 = new Uint8Array(buffer)
    return new Response(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString()
      }
    }) as NextResponse

  } catch (error) {
    console.error('On-demand payslip generation error', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to generate payslip',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
