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

    // Calculate statistics
    const workingDays = attendanceRecords.filter(record => !record.isAbsent).length
    const totalHoursWorked = attendanceRecords.reduce((sum, record) => {
      return sum + (record.hoursWorked || 0)
    }, 0)
    const lateCount = attendanceRecords.filter(record => record.isLate).length
    const absentCount = attendanceRecords.filter(record => record.isAbsent).length

    // Calculate expected working hours and overtime
    const expectedDailyHours = parseFloat(configs['working_hours_dailyHours'] || '8')
    const expectedTotalHours = workingDays * expectedDailyHours
    const overtimeHours = Math.max(0, totalHoursWorked - expectedTotalHours)
    const regularHours = Math.min(totalHoursWorked, expectedTotalHours)

    // Get daily rate from payroll rules
    const dailyRateRule = payrollRules.find((rule: any) => rule.type === 'daily_rate')
    const dailyRate = dailyRateRule ? Number(dailyRateRule.amount) : 0
    const monthlySalary = dailyRate * 22 // Standard monthly rate for reference
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

    // Calculate base pay based on actual days worked
    const basePay = workingDays * dailyRate

    // Calculate rule-based deductions and bonuses
    let governmentDeductions = 0
    let loanDeductions = 0
    let otherDeductions = 0
    let bonuses = 0
    let holidayPay = 0
    let allowances = 0

    const appliedRules: any[] = []

    payrollRules.forEach(rule => {
      const amount = Number(rule.amount)
      let calculatedAmount = 0
      
      if (rule.type === 'deduction') {
        calculatedAmount = rule.isPercentage ? (basePay + overtimePay) * amount / 100 : amount
        
        if (rule.name.toLowerCase().includes('sss') || 
            rule.name.toLowerCase().includes('gsis') || 
            rule.name.toLowerCase().includes('philhealth') || 
            rule.name.toLowerCase().includes('pagibig') ||
            rule.name.toLowerCase().includes('pag-ibig') ||
            rule.name.toLowerCase().includes('tax')) {
          governmentDeductions += calculatedAmount
        } else if (rule.name.toLowerCase().includes('loan')) {
          loanDeductions += calculatedAmount
        } else {
          otherDeductions += calculatedAmount
        }
      } else if (rule.type === 'bonus') {
        calculatedAmount = rule.isPercentage ? (basePay + overtimePay) * amount / 100 : amount
        bonuses += calculatedAmount
      } else if (rule.type === 'allowance') {
        calculatedAmount = rule.isPercentage ? (basePay + overtimePay) * amount / 100 : amount
        allowances += calculatedAmount
      } else if (rule.type === 'holiday_pay') {
        calculatedAmount = rule.isPercentage ? (basePay + overtimePay) * amount / 100 : amount
        holidayPay += calculatedAmount
      }

      appliedRules.push({
        id: rule.id,
        name: rule.name,
        type: rule.type,
        amount: amount,
        isPercentage: rule.isPercentage,
        description: rule.description,
        calculatedAmount: calculatedAmount
      })
    })

    // Calculate totals
    const totalDeductions = governmentDeductions + loanDeductions + otherDeductions + lateDeductions
    const grossPay = basePay + overtimePay + bonuses + allowances + holidayPay
    const netPay = grossPay - totalDeductions

    // Build deduction breakdown with individual amounts
    const deductionBreakdown: any = {}
    
    // Extract specific government deductions
    payrollRules.forEach(rule => {
      if (rule.type === 'deduction') {
        const calculatedAmount = rule.isPercentage ? (basePay + overtimePay) * Number(rule.amount) / 100 : Number(rule.amount)
        
        if (rule.name.toLowerCase().includes('withholding') || rule.name.toLowerCase().includes('tax')) {
          deductionBreakdown.withholdingTax = calculatedAmount
        } else if (rule.name.toLowerCase().includes('gsis')) {
          deductionBreakdown.gsisContribution = calculatedAmount
        } else if (rule.name.toLowerCase().includes('pagibig') || rule.name.toLowerCase().includes('pag-ibig')) {
          deductionBreakdown.pagibigContribution = calculatedAmount
        } else if (rule.name.toLowerCase().includes('philhealth')) {
          deductionBreakdown.philHealthContribution = calculatedAmount
        } else if (rule.name.toLowerCase().includes('sss')) {
          deductionBreakdown.sssContribution = calculatedAmount
        }
      }
    })

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
        bonuses: bonuses + holidayPay + allowances,
        grossPay: grossPay,
        netPay: netPay,
        lateDeductions: lateDeductions,
        governmentDeductions: governmentDeductions,
        loanDeductions: loanDeductions,
        otherDeductions: otherDeductions,
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
