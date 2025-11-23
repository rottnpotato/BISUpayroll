import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { format } from 'date-fns'

// Shape of data expected by the generator
export interface PayslipData {
  payrollRecordId: string | null
  payPeriodStart: Date
  payPeriodEnd: Date
  generatedAt?: Date
  scheduleType?: string // 'monthly' | 'bi-monthly' | 'weekly' | etc
  employee: {
    name: string
    employeeId?: string | null
    department?: string | null
    position?: string | null
    hireDate?: Date | null
  }
  calculations: {
    monthlySalary: number
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
  const doc = new Docxtemplater(zip, { 
    paragraphLoop: true, 
    linebreaks: true
  })

  const currency = data.currency || 'PHP'

  // Extract individual deduction amounts from breakdown
  const deductionBreakdown = data.deductionBreakdown || {}
  
  // Parse applied rules to get specific deduction amounts
  const appliedRules = data.appliedRules || []
  
  // Check if schedule is monthly to determine if net amounts should be shown
  const isMonthlySchedule = data.scheduleType?.toLowerCase().includes('monthly') ?? true // default to true if not specified
  
  // Calculate net pay for each half (simple division by 2) - only for NON-monthly schedules
  const netPayFirstHalf = data.calculations.netPay / 2
  const netPaySecondHalf = data.calculations.netPay / 2

  // Get allowances and others from applied rules
  const allowanceRules = appliedRules.filter(r => r.type === 'allowance')
  const allowanceTotal = allowanceRules.reduce((sum, r) => sum + (r.calculatedAmount ?? r.amount), 0)
  
  const otherEarningsRules = appliedRules.filter(r => ['bonus', 'additional'].includes(r.type))
  const othersTotal = otherEarningsRules.reduce((sum, r) => sum + (r.calculatedAmount ?? r.amount), 0)

  // Build deductions list dynamically
  const deductionsList: Array<{ name: string; amount: string }> = []
  
  // Add standard government deductions (check if breakdown exists and has values)
  if (deductionBreakdown?.withholdingTax && deductionBreakdown.withholdingTax > 0) {
    deductionsList.push({
      name: 'Withholding Tax',
      amount: numberFmt(deductionBreakdown.withholdingTax, currency)
    })
  }
  
  if (deductionBreakdown?.gsisContribution && deductionBreakdown.gsisContribution > 0) {
    deductionsList.push({
      name: 'GSIS Premium',
      amount: numberFmt(deductionBreakdown.gsisContribution, currency)
    })
  }
  
  if (deductionBreakdown?.pagibigContribution && deductionBreakdown.pagibigContribution > 0) {
    deductionsList.push({
      name: 'Pag-IBIG Premium',
      amount: numberFmt(deductionBreakdown.pagibigContribution, currency)
    })
  }
  
  if (deductionBreakdown?.philHealthContribution && deductionBreakdown.philHealthContribution > 0) {
    deductionsList.push({
      name: 'PhilHealth',
      amount: numberFmt(deductionBreakdown.philHealthContribution, currency)
    })
  }
  
  if (deductionBreakdown?.sssContribution && deductionBreakdown.sssContribution > 0) {
    deductionsList.push({
      name: 'SSS Premium',
      amount: numberFmt(deductionBreakdown.sssContribution, currency)
    })
  }

  // Add late/undertime deductions
  if (data.calculations.lateDeductions > 0) {
    deductionsList.push({
      name: 'Undertime / Late',
      amount: numberFmt(data.calculations.lateDeductions, currency)
    })
  }

  if(data.calculations.otherDeductions > 0) {
    deductionsList.push({
      name: 'Other Deductions',
      amount: numberFmt(data.calculations.otherDeductions, currency)
    })
  }

  // Add user-defined deductions from applied rules
  const customDeductions = appliedRules.filter(r => r.type === 'deduction')
  customDeductions.forEach(deduction => {
    // Check if this deduction was already added from breakdown to avoid duplicates
    const alreadyAdded = deductionsList.some(d => 
      d.name.toLowerCase().includes(deduction.name.toLowerCase())
    )
    if (!alreadyAdded) {
      deductionsList.push({
        name: deduction.name,
        amount: numberFmt(deduction.calculatedAmount ?? deduction.amount, currency)
      })
    }
  })

  const ctx = {
    company_name: 'BISU Payroll System',
    payslip_title: 'PAY SLIP',
    period_start: format(data.payPeriodStart, 'MMMM yyyy'),
    period_end: format(data.payPeriodEnd, 'MMMM yyyy'),
    generated_at: format(data.generatedAt || new Date(), 'yyyy-MM-dd HH:mm'),
    
    // Employee Information
    employee_name: data.employee.name,
    employee_id: data.employee.employeeId || '',
    employee_department: data.employee.department || '',
    employee_position: data.employee.position || '',
    employee_hire_date: data.employee.hireDate ? format(data.employee.hireDate, 'yyyy-MM-dd') : '',
    
    // Earnings
    monthly_salary: numberFmt(data.calculations.monthlySalary, currency),
    allowance: numberFmt(allowanceTotal, currency),
    others: numberFmt(othersTotal, currency),
    gross_pay: numberFmt(data.calculations.grossPay, currency),
    
    // Deductions - Array for template loop (for table rows)
    deductions: deductionsList,
    // Deductions as formatted string with actual line breaks for single cell
    deductions_formatted: deductionsList.map(d => `${d.name + (d.name.length > 4 ? '' : '        ')}: ${d.amount}`).join('\n'),
    total_deductions: numberFmt(data.calculations.totalDeductions, currency),
    
    // Net Pay
    net_pay: numberFmt(data.calculations.netPay, currency),
    net_pay_words: amountInWords(data.calculations.netPay).toUpperCase(),
    net_amount_first_half: numberFmt(netPayFirstHalf, currency),
    net_amount_second_half: numberFmt(netPaySecondHalf, currency),
    // Conditionals for template
    show_half_payments: !isMonthlySchedule, // Show split payments only for non-monthly schedules
    is_monthly: isMonthlySchedule, // Alternative: show if monthly
    is_bimonthly: !isMonthlySchedule, // Alternative: show if NOT monthly
    
    reference_id: data.payrollRecordId
  }

  console.log('Payslip generation - Schedule type:', data.scheduleType, 'isMonthly:', isMonthlySchedule, 'show_half_payments:', !isMonthlySchedule)
  console.log('Payslip context data:', data)
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
