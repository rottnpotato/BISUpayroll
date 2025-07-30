// Philippine Payroll Calculation Utilities
// Based on TRAIN Law (RA 10963) and current government contribution rates

// Philippine Income Tax Brackets (TRAIN Law - 2023 rates)
export const TAX_BRACKETS = [
  { min: 0, max: 250000, rate: 0, fixedAmount: 0 },
  { min: 250000, max: 400000, rate: 0.15, fixedAmount: 0 },
  { min: 400000, max: 800000, rate: 0.20, fixedAmount: 22500 },
  { min: 800000, max: 2000000, rate: 0.25, fixedAmount: 102500 },
  { min: 2000000, max: 8000000, rate: 0.30, fixedAmount: 402500 },
  { min: 8000000, max: Infinity, rate: 0.35, fixedAmount: 2202500 }
]

// Government contribution rates and limits
export const CONTRIBUTION_RATES = {
  gsis: {
    employee: 0.09, // 9% employee share
    employer: 0.12, // 12% employer share
    minSalary: 5000,
    maxSalary: 100000
  },
  philHealth: {
    rate: 0.05, // 5% total (2.5% employee, 2.5% employer)
    employeeShare: 0.025,
    employerShare: 0.025,
    minContribution: 200,
    maxContribution: 1750,
    minSalary: 8000,
    maxSalary: 70000
  },
  pagibig: {
    employeeRate: 0.02, // 2% employee
    employerRate: 0.02, // 2% employer  
    minContribution: 24,
    maxContribution: 200,
    minSalary: 1200,
    maxSalary: 10000
  }
}

export interface PayrollCalculationData {
  baseSalary: number
  daysWorked: number
  hoursWorked: number
  overtimeHours: number
  lateHours: number
  undertimeHours: number
  holidayHours: number
  nightShiftHours: number
  holidayType?: 'REGULAR' | 'SPECIAL'
  appliedRules: any[]
  configurations: {
    dailyHours: number
    overtimeRate1: number
    overtimeRate2: number
    nightDifferential: number
    regularHolidayRate: number
    specialHolidayRate: number
    lateDeductionAmount: number
    lateDeductionBasis: string
  }
}

export interface PayrollCalculationResult {
  // Basic rates
  dailyRate: number
  hourlyRate: number
  
  // Earnings
  regularPay: number
  overtimePay: number
  holidayPay: number
  nightDifferential: number
  allowances: number
  bonuses: number
  thirteenthMonthPay: number
  serviceIncentiveLeave: number
  otherEarnings: number
  totalEarnings: number
  grossPay: number
  
  // Contributions
  gsisContribution: number
  philHealthContribution: number
  pagibigContribution: number
  
  // Tax
  taxableIncome: number
  withholdingTax: number
  
  // Other deductions
  lateDeductions: number
  undertimeDeductions: number
  loanDeductions: number
  otherDeductions: number
  totalDeductions: number
  
  // Final amount
  netPay: number
  
  // Applied rules breakdown
  appliedRulesBreakdown: any[]
}

export function calculateDailyRate(monthlySalary: number): number {
  return monthlySalary / 22 // Standard 22 working days per month
}

export function calculateHourlyRate(monthlySalary: number, dailyHours: number = 8): number {
  return calculateDailyRate(monthlySalary) / dailyHours
}

export function calculateAnnualTaxableIncome(monthlyGross: number): number {
  return monthlyGross * 12
}

export function calculateWithholdingTax(annualTaxableIncome: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (annualTaxableIncome > bracket.min && annualTaxableIncome <= bracket.max) {
      const taxableAmount = annualTaxableIncome - bracket.min
      const tax = bracket.fixedAmount + (taxableAmount * bracket.rate)
      return tax / 12 // Return monthly withholding tax
    }
  }
  return 0
}

export function calculateGSISContribution(monthlySalary: number): number {
  const { employee, minSalary, maxSalary } = CONTRIBUTION_RATES.gsis
  const contributionBase = Math.max(minSalary, Math.min(maxSalary, monthlySalary))
  return contributionBase * employee
}

export function calculatePhilHealthContribution(monthlySalary: number): number {
  const { employeeShare, minContribution, maxContribution, minSalary, maxSalary } = CONTRIBUTION_RATES.philHealth
  
  if (monthlySalary < minSalary) {
    return minContribution
  }
  
  const contributionBase = Math.min(maxSalary, monthlySalary)
  const contribution = contributionBase * employeeShare
  return Math.max(minContribution, Math.min(maxContribution, contribution))
}

export function calculatePagibigContribution(monthlySalary: number): number {
  const { employeeRate, minContribution, maxContribution, minSalary, maxSalary } = CONTRIBUTION_RATES.pagibig
  
  if (monthlySalary < minSalary) {
    return minContribution
  }
  
  const contributionBase = Math.min(maxSalary, monthlySalary)
  const contribution = contributionBase * employeeRate
  return Math.max(minContribution, Math.min(maxContribution, contribution))
}

export function calculateOvertimePay(
  overtimeHours: number, 
  hourlyRate: number, 
  overtimeRate1: number = 1.25, 
  overtimeRate2: number = 1.5
): number {
  if (overtimeHours <= 0) return 0
  
  // First 2 hours at rate1, remaining at rate2
  const firstOvertimeHours = Math.min(overtimeHours, 2)
  const secondOvertimeHours = Math.max(0, overtimeHours - 2)
  
  return (firstOvertimeHours * hourlyRate * overtimeRate1) + 
         (secondOvertimeHours * hourlyRate * overtimeRate2)
}

export function calculateHolidayPay(
  holidayHours: number,
  hourlyRate: number,
  holidayType: 'REGULAR' | 'SPECIAL' = 'REGULAR',
  regularRate: number = 2.0,
  specialRate: number = 1.3
): number {
  if (holidayHours <= 0) return 0
  
  const rate = holidayType === 'REGULAR' ? regularRate : specialRate
  return holidayHours * hourlyRate * (rate - 1) // Additional pay only
}

export function calculateNightDifferential(
  nightShiftHours: number,
  hourlyRate: number,
  nightDifferentialRate: number = 0.10
): number {
  if (nightShiftHours <= 0) return 0
  return nightShiftHours * hourlyRate * nightDifferentialRate
}

export function calculateLateDeductions(
  lateHours: number,
  hourlyRate: number,
  dailyRate: number,
  deductionAmount: number,
  deductionBasis: string
): number {
  if (lateHours <= 0) return 0
  
  switch (deductionBasis) {
    case 'fixed':
      return lateHours * deductionAmount
    case 'hourly':
      return lateHours * hourlyRate * deductionAmount
    case 'daily':
      return lateHours * dailyRate * deductionAmount
    case 'per_minute':
      return (lateHours * 60) * (hourlyRate / 60) * deductionAmount
    default:
      return 0
  }
}

export function applyPayrollRules(
  rules: any[],
  basePay: number,
  grossPay: number,
  calculationType: 'earnings' | 'deductions'
): { total: number; breakdown: any[] } {
  let total = 0
  const breakdown: any[] = []
  
  rules
    .filter(rule => rule.isActive && 
      (calculationType === 'earnings' 
        ? ['bonus', 'allowance', 'additional'].includes(rule.type)
        : ['deduction'].includes(rule.type)
      )
    )
    .forEach(rule => {
      let amount = 0
      const ruleAmount = Number(rule.amount)
      
      if (rule.isPercentage) {
        // Determine computation basis
        const computationBase = rule.computationBasis === 'basic_salary' ? basePay : grossPay
        amount = computationBase * ruleAmount / 100
      } else {
        amount = ruleAmount
      }
      
      // Apply min/max limits if specified
      if (rule.minAmount && amount < rule.minAmount) {
        amount = rule.minAmount
      }
      if (rule.maxAmount && amount > rule.maxAmount) {
        amount = rule.maxAmount
      }
      
      total += amount
      breakdown.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        category: rule.category,
        amount: amount,
        isPercentage: rule.isPercentage,
        rate: rule.isPercentage ? ruleAmount : undefined
      })
    })
  
  return { total, breakdown }
}

export function calculateCompletePayroll(data: PayrollCalculationData): PayrollCalculationResult {
  const {
    baseSalary,
    daysWorked,
    hoursWorked,
    overtimeHours,
    lateHours,
    undertimeHours,
    holidayHours,
    nightShiftHours,
    holidayType,
    appliedRules,
    configurations
  } = data
  
  // Calculate basic rates
  const dailyRate = calculateDailyRate(baseSalary)
  const hourlyRate = calculateHourlyRate(baseSalary, configurations.dailyHours)
  
  // Calculate earnings
  const regularPay = (hoursWorked - overtimeHours - holidayHours - nightShiftHours) * hourlyRate
  const overtimePay = calculateOvertimePay(overtimeHours, hourlyRate, configurations.overtimeRate1, configurations.overtimeRate2)
  const holidayPay = calculateHolidayPay(holidayHours, hourlyRate, holidayType, configurations.regularHolidayRate, configurations.specialHolidayRate)
  const nightDifferential = calculateNightDifferential(nightShiftHours, hourlyRate, configurations.nightDifferential / 100)
  
  // Apply payroll rules for earnings
  const earningsRules = applyPayrollRules(appliedRules, baseSalary, 0, 'earnings')
  const allowances = earningsRules.breakdown.filter(r => r.category === 'allowance').reduce((sum, r) => sum + r.amount, 0)
  const bonuses = earningsRules.breakdown.filter(r => r.category === 'bonus').reduce((sum, r) => sum + r.amount, 0)
  const thirteenthMonthPay = earningsRules.breakdown.filter(r => r.category === 'mandatory_benefit').reduce((sum, r) => sum + r.amount, 0)
  const serviceIncentiveLeave = earningsRules.breakdown.filter(r => r.category === 'leave_benefit').reduce((sum, r) => sum + r.amount, 0)
  const otherEarnings = earningsRules.breakdown.filter(r => !['allowance', 'bonus', 'mandatory_benefit', 'leave_benefit'].includes(r.category)).reduce((sum, r) => sum + r.amount, 0)
  
  const totalEarnings = regularPay + overtimePay + holidayPay + nightDifferential + allowances + bonuses + thirteenthMonthPay + serviceIncentiveLeave + otherEarnings
  const grossPay = totalEarnings
  
  // Calculate mandatory contributions
  const gsisContribution = calculateGSISContribution(baseSalary)
  const philHealthContribution = calculatePhilHealthContribution(baseSalary)
  const pagibigContribution = calculatePagibigContribution(baseSalary)
  
  // Calculate taxable income (gross pay minus non-taxable contributions)
  const taxableIncome = grossPay - gsisContribution - philHealthContribution - pagibigContribution - thirteenthMonthPay - serviceIncentiveLeave
  const annualTaxableIncome = calculateAnnualTaxableIncome(taxableIncome)
  const withholdingTax = calculateWithholdingTax(annualTaxableIncome)
  
  // Calculate other deductions
  const lateDeductions = calculateLateDeductions(lateHours, hourlyRate, dailyRate, configurations.lateDeductionAmount, configurations.lateDeductionBasis)
  const undertimeDeductions = undertimeHours * hourlyRate // Simple undertime calculation
  
  // Apply payroll rules for deductions
  const deductionRules = applyPayrollRules(appliedRules, baseSalary, grossPay, 'deductions')
  const loanDeductions = deductionRules.breakdown.filter(r => r.category === 'loan').reduce((sum, r) => sum + r.amount, 0)
  const otherDeductions = deductionRules.breakdown.filter(r => r.category !== 'loan').reduce((sum, r) => sum + r.amount, 0)
  
  const totalDeductions = gsisContribution + philHealthContribution + pagibigContribution + withholdingTax + 
                         lateDeductions + undertimeDeductions + loanDeductions + otherDeductions
  
  const netPay = Math.max(0, grossPay - totalDeductions)
  
  // Combine all applied rules
  const appliedRulesBreakdown = [...earningsRules.breakdown, ...deductionRules.breakdown]
  
  return {
    dailyRate,
    hourlyRate,
    regularPay,
    overtimePay,
    holidayPay,
    nightDifferential,
    allowances,
    bonuses,
    thirteenthMonthPay,
    serviceIncentiveLeave,
    otherEarnings,
    totalEarnings,
    grossPay,
    gsisContribution,
    philHealthContribution,
    pagibigContribution,
    taxableIncome,
    withholdingTax,
    lateDeductions,
    undertimeDeductions,
    loanDeductions,
    otherDeductions,
    totalDeductions,
    netPay,
    appliedRulesBreakdown
  }
} 