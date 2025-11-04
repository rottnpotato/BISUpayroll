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
      }
    })

    if (!employeeData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Employee data not found' 
      }, { status: 404 })
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

    // Prepare payslip data
    const payslipData = {
      payrollRecordId: null, // No record ID since we're generating on-demand
      payPeriodStart: payPeriodStart,
      payPeriodEnd: payPeriodEnd,
      generatedAt: new Date(),
      scheduleType: activeSchedule?.name || 'monthly', // Include schedule type
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
        governmentDeductions: governmentDeductions,
        loanDeductions: loanDeductions,
        otherDeductions: otherDeductions + undertimeDeductions,
        totalDeductions: totalDeductions
      },
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
