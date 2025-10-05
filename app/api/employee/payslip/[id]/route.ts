import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { generatePayslipDocx } from '@/lib/payslip-docx'

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

    const payrollRecordId = params.id

    // Fetch payroll record and ensure ownership
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

    // Pull related rules to show detailed breakdown (optional)
    const payrollRules = await prisma.payrollRule.findMany({
      where: {
        OR: [
          { applyToAll: true },
          { assignedUsers: { some: { userId: user.id } } }
        ],
        isActive: true
      },
      include: {
        assignedUsers: true
      }
    })

    // Basic calculations (record already holds gross, deductions, net). We reconstruct pieces as placeholders if available via metadata later.
    const grossPay = num(record.grossPay)
    const deductions = num(record.deductions)
    const netPay = num(record.netPay)

    // Attempt to categorize deductions via rule names (simple heuristic)
    let governmentDeductions = 0
    let loanDeductions = 0
    let otherDeductions = 0

    const appliedRules = payrollRules.map(r => {
      let calculatedAmount = 0
      const amt = num(r.amount)
      if (r.isPercentage) {
        calculatedAmount = grossPay * amt / 100
      } else {
        calculatedAmount = amt
      }

      if (r.type === 'deduction') {
        if (/sss|philhealth|pagibig|tax/i.test(r.name)) {
          governmentDeductions += calculatedAmount
        } else if (/loan/i.test(r.name)) {
          loanDeductions += calculatedAmount
        } else {
          otherDeductions += calculatedAmount
        }
      }

      return {
        name: r.name,
        type: r.type,
        amount: amt,
        calculatedAmount,
        isPercentage: r.isPercentage
      }
    })

    // Derive earnings components heuristically (since not all stored). This can be enhanced if you persist detailed breakdown later.
    const bonuses = appliedRules.filter(r => ['bonus','allowance','additional'].includes(r.type)).reduce((s, r) => s + r.calculatedAmount, 0)
    const basePayApprox = Math.max(0, grossPay - bonuses) // naive assumption

    const payslipData = {
      payrollRecordId: record.id,
      payPeriodStart: record.payPeriodStart,
      payPeriodEnd: record.payPeriodEnd,
      generatedAt: new Date(),
      employee: {
        name: `${record.user.firstName} ${record.user.lastName}`,
        employeeId: record.user.employeeId,
        department: record.user.department,
        position: record.user.position,
        hireDate: record.user.hireDate
      },
      calculations: {
        basePay: basePayApprox,
        overtimePay: 0, // Not persisted; requires attendance reconstruction
        bonuses: bonuses,
        grossPay: grossPay,
        netPay: netPay,
        lateDeductions: 0, // Unknown without attendance details (could be improved)
        governmentDeductions,
        loanDeductions,
        otherDeductions,
        totalDeductions: deductions
      },
      appliedRules
    }

    const { fileName, buffer } = await generatePayslipDocx(payslipData)

    // Convert buffer to ArrayBuffer for Web Response compatibility
    const uint8 = new Uint8Array(buffer)
    const response = new Response(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString()
      }
    })
    return response as NextResponse
  } catch (error) {
    console.error('Payslip generation error', error)
    return NextResponse.json({ success: false, message: 'Failed to generate payslip' }, { status: 500 })
  }
}
