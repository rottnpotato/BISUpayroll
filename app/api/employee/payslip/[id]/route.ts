import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { generatePayslipDocx } from '@/lib/payslip-docx'
import libre from 'libreoffice-convert'
import { promisify } from 'util'
import { m } from 'framer-motion'

const libreConvertAsync = promisify(libre.convert)

// Helper to format numeric safely
const num = (v: any) => Number(v || 0)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const payrollRecordId = await params.id

    // Fetch payroll record to get the period info
    const record = await prisma.payrollRecord.findUnique({
      where: { id: payrollRecordId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, employeeId: true, department: true, position: true, hireDate: true }
        }
      }
    })

    if (!record || record.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'Payroll record not found' }, { status: 404 })
    }

    // Get active payroll schedule to determine schedule type
    const activeSchedule = await prisma.payrollSchedule.findFirst({
      where: { isActive: true },
      select: { name: true }
    })

    // Trigger payroll generation to ensure latest calculations using the centralized endpoint
    // This ensures consistency with ledger generation
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const generateResponse = await fetch(`${baseUrl}/api/admin/payroll/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify({
          payPeriodStart: record.payPeriodStart.toISOString(),
          payPeriodEnd: record.payPeriodEnd.toISOString(),
          userIds: [user.id],
          role: 'EMPLOYEE'
        })
      })

      if (!generateResponse.ok) {
        console.warn('Payroll generation for payslip failed, will try to use existing data')
      }
    } catch (error) {
      console.warn('Error triggering payroll generation for payslip:', error)
      // Continue anyway - we'll try to use existing PayrollResult data
    }

    // Try to get the detailed PayrollResult for this period (contains actual calculated breakdown)
    const payrollResult = await prisma.payrollResult.findUnique({
      where: {
        userId_payPeriodStart_payPeriodEnd: {
          userId: user.id,
          payPeriodStart: record.payPeriodStart,
          payPeriodEnd: record.payPeriodEnd
        }
      }
    })

    // Use PayrollResult if available (has detailed breakdown), otherwise fall back to PayrollRecord
    let grossPay: number
    let netPay: number
    let basePay: number
    let overtimePay: number
    let holidayPay: number
    let allowances: number
    let bonuses: number
    let governmentDeductions: number
    let lateDeductions: number
    let loanDeductions: number
    let otherDeductions: number
    let totalDeductions: number
    let undertimeDeductions: number
    let appliedRules: any[] = []

    if (payrollResult) {
      // Use actual calculated values from PayrollResult

      console.log('Using PayrollResult for payslip generation:', payrollResult)
      grossPay = num(payrollResult.grossPay)
      netPay = num(payrollResult.netPay)
      basePay = num(payrollResult.regularPay)
      overtimePay = num(payrollResult.overtimePay)
      holidayPay = num(payrollResult.holidayPay)
      allowances = num(payrollResult.allowances)
      bonuses = num(payrollResult.bonuses)
      undertimeDeductions = num(payrollResult.undertimeDeductions)
      
      // Deductions breakdown from actual calculation
      governmentDeductions = num(payrollResult.gsisContribution) + 
                            num(payrollResult.philHealthContribution) + 
                            num(payrollResult.pagibigContribution) +
                            num(payrollResult.withholdingTax)
      lateDeductions = num(payrollResult.lateDeductions)
      loanDeductions = num(payrollResult.loanDeductions)
      otherDeductions = num(payrollResult.otherDeductions)
      totalDeductions = num(payrollResult.totalDeductions)


      // Parse applied rules if available
      try {
        appliedRules = payrollResult.appliedRules ? JSON.parse(payrollResult.appliedRules) : []
      } catch {
        appliedRules = []
      }
    } else {
      // Fallback to old PayrollRecord (less detailed) - should rarely happen now
      grossPay = num(record.grossPay)
      netPay = num(record.netPay)
      basePay = 0
      overtimePay = num(record.overtime)
      holidayPay = 0
      allowances = 0
      bonuses = num(record.bonuses)
      totalDeductions = num(record.deductions)
      undertimeDeductions = 0
      
      // Can't break down deductions accurately without PayrollResult
      governmentDeductions = 0
      lateDeductions = 0
      loanDeductions = 0
      otherDeductions = totalDeductions
    }

    const payslipData = {
      payrollRecordId: record.id,
      payPeriodStart: record.payPeriodStart,
      payPeriodEnd: record.payPeriodEnd,
      generatedAt: new Date(),
      scheduleType: activeSchedule?.name || 'monthly', // Include schedule type
      employee: {
        name: `${record.user.firstName} ${record.user.lastName}`,
        employeeId: record.user.employeeId,
        department: record.user.department,
        position: record.user.position,
        hireDate: record.user.hireDate
      },
      calculations: {
        monthlySalary: basePay * 22, // Approximation
        basePay: basePay,
        overtimePay: overtimePay,
        bonuses: bonuses + holidayPay + allowances,
        grossPay: grossPay,
        netPay: netPay,
        lateDeductions: lateDeductions,
        governmentDeductions: governmentDeductions,
        loanDeductions: loanDeductions,
        otherDeductions: otherDeductions,
        totalDeductions: totalDeductions,
        undertimeDeductions: undertimeDeductions
      },
      appliedRules
    }
    

    const { fileName, buffer } = await generatePayslipDocx(payslipData)

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'docx'

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
    console.error('Payslip generation error', error)
    return NextResponse.json({ success: false, message: 'Failed to generate payslip' }, { status: 500 })
  }
}
