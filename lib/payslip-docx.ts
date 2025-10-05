import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { format } from 'date-fns'

// Shape of data expected by the generator
export interface PayslipData {
  payrollRecordId: string
  payPeriodStart: Date
  payPeriodEnd: Date
  generatedAt?: Date
  employee: {
    name: string
    employeeId?: string | null
    department?: string | null
    position?: string | null
    hireDate?: Date | null
  }
  calculations: {
    basePay: number
    overtimePay: number
    bonuses: number
    grossPay: number
    netPay: number
    lateDeductions: number
    governmentDeductions: number
    loanDeductions: number
    otherDeductions: number
    totalDeductions: number
  }
  deductionBreakdown?: any
  appliedRules?: Array<{ name: string; type: string; amount: number; calculatedAmount?: number; isPercentage?: boolean }>
  currency?: string
}

const numberFmt = (v: number, currency: string = 'PHP') => {
  if (isNaN(v)) return ''
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency, minimumFractionDigits: 2 }).format(v)
}

// Generate amount in words (very simple, can be improved or replaced later)
function amountInWords(amount: number): string {
  try {
    const pesos = Math.floor(amount)
    const cents = Math.round((amount - pesos) * 100)
    return `${pesos.toLocaleString('en-PH')} peso${pesos === 1 ? '' : 's'} and ${cents} centavo${cents === 1 ? '' : 's'}`
  } catch {
    return ''
  }
}

export async function generatePayslipDocx(data: PayslipData): Promise<{ fileName: string; buffer: Buffer }> {
  const templatePath = path.join(process.cwd(), 'public', 'sap.docx')
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template sap.docx not found in public folder')
  }

  const templateBinary = fs.readFileSync(templatePath, 'binary')
  const zip = new PizZip(templateBinary)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

  const currency = data.currency || 'PHP'

  // Prepare applied rules tables (earnings & deductions separated)
  const earningsRules = (data.appliedRules || []).filter(r => ['bonus','allowance','additional','base'].includes(r.type))
  const deductionRules = (data.appliedRules || []).filter(r => r.type === 'deduction')

  const ctx = {
    company_name: 'BISU Payroll System',
    payslip_title: 'Employee Payslip',
    period_start: format(data.payPeriodStart, 'yyyy-MM-dd'),
    period_end: format(data.payPeriodEnd, 'yyyy-MM-dd'),
    generated_at: format(data.generatedAt || new Date(), 'yyyy-MM-dd HH:mm'),
    employee_name: data.employee.name,
    employee_id: data.employee.employeeId || '',
    employee_department: data.employee.department || '',
    employee_position: data.employee.position || '',
    employee_hire_date: data.employee.hireDate ? format(data.employee.hireDate, 'yyyy-MM-dd') : '',

    base_pay: numberFmt(data.calculations.basePay, currency),
    overtime_pay: numberFmt(data.calculations.overtimePay, currency),
    bonuses_pay: numberFmt(data.calculations.bonuses, currency),
    gross_pay: numberFmt(data.calculations.grossPay, currency),
    net_pay: numberFmt(data.calculations.netPay, currency),
    late_deductions: numberFmt(data.calculations.lateDeductions, currency),
    govt_deductions: numberFmt(data.calculations.governmentDeductions, currency),
    loan_deductions: numberFmt(data.calculations.loanDeductions, currency),
    other_deductions: numberFmt(data.calculations.otherDeductions, currency),
    total_deductions: numberFmt(data.calculations.totalDeductions, currency),
    net_pay_words: amountInWords(data.calculations.netPay).toUpperCase(),

    // Rule tables
    earnings_rules: earningsRules.map(r => ({
      rule_name: r.name,
      rule_amount: numberFmt(r.calculatedAmount ?? r.amount, currency),
      rule_rate: r.isPercentage ? `${r.amount}%` : ''
    })),
    deduction_rules: deductionRules.map(r => ({
      rule_name: r.name,
      rule_amount: numberFmt(r.calculatedAmount ?? r.amount, currency),
      rule_rate: r.isPercentage ? `${r.amount}%` : ''
    })),

    reference_id: data.payrollRecordId
  }

  try {
    // New API: pass context directly into render (setData deprecated)
    ;(doc as any).render(ctx)
  } catch (e: any) {
    console.error('Docx render error', e)
    throw e
  }

  const buf = doc.getZip().generate({ type: 'nodebuffer' })
  const fileName = `Payslip_${format(data.payPeriodStart, 'yyyyMM')}_${data.employee.employeeId || 'EMP'}.docx`
  return { fileName, buffer: buf }
}
