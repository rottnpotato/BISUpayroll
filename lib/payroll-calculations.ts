// =====================================================
// DEPRECATED: This file contains legacy payroll calculation functions
// =====================================================
// These functions have been replaced by PostgreSQL stored procedures
// that handle all payroll calculations at the database level.
//
// New system: See prisma/migrations/20251123000001_use_user_daily_rate.sql
// Documentation: See PAYROLL_STORED_PROCEDURES.md
//
// Key changes:
// 1. All calculations now done via calculate_payroll_for_period() stored procedure
// 2. Users have dailyRate field that takes priority over payroll_rules
// 3. Tax, GSIS, PhilHealth, Pag-IBIG calculations done in database procedures
// 4. Payroll results stored in payroll_results table with automatic triggers
// 5. Real-time updates when attendance or rules change
//
// Migration guide:
// - Old: Get rate from payroll_rules
// - New: Get daily_rate from users table (with payroll_rules fallback)
// - Old: Call calculateCompletePayroll() in application
// - New: Use stored procedure via /api/admin/payroll/recalculate
// - Old: Calculate contributions in app
// - New: Contributions calculated in database procedures
// =====================================================

export interface PayrollCalculationData {
  baseSalary: number
  daysWorked: number
  hoursWorked: number
  overtimeHours: number
  lateHours: number
  undertimeHours: number
  holidayHours: number
  holidayType?: 'REGULAR' | 'SPECIAL'
  appliedRules: any[]
  configurations: {
    dailyHours: number
    overtimeRate1: number
    overtimeRate2: number
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
  allowances: number
  bonuses: number
  thirteenthMonthPay: number
  serviceIncentiveLeave: number
  otherEarnings: number
  totalEarnings: number
  grossPay: number
  
  // Contributions (calculated in database)
  gsisContribution: number
  philHealthContribution: number
  pagibigContribution: number
  
  // Tax (calculated in database)
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

export function calculateDailyRate(dailyRate: number): number {
  return dailyRate
}

export function calculateHourlyRate(dailyRate: number, dailyHours: number = 8): number {
  return dailyRate / dailyHours
}

export function calculatePagibigContribution(salaryBase: number): number {
  // NOTE: This is deprecated - contributions are now calculated in database procedures
  // See calculate_pagibig_contribution() in stored procedures
  // Kept for backwards compatibility only
  console.warn('calculatePagibigContribution is deprecated - use database procedure instead')
  
  const rate = 0.02 // 2% employee share
  const minSalary = 1000
  const maxSalary = 5000
  
  if (salaryBase < minSalary) {
    return minSalary * rate
  }
  
  const contributionBase = Math.min(maxSalary, salaryBase)
  return contributionBase * rate
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

// Night differential removed

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

// Function to calculate base salary from payroll rules
export function calculateBaseSalaryFromRules(appliedRules: any[]): number {
  const baseSalaryRule = appliedRules.find(rule => 
    rule.isActive && 
    (rule.type === 'base' || rule.category === 'base_pay')
  )
  
  if (baseSalaryRule) {
    return Number(baseSalaryRule.amount)
  }
  
  // Default fallback - daily rate unavailable
  return 0
}

// NOTE: calculateCompletePayroll is DEPRECATED
// This function is kept for backwards compatibility but should not be used in new code
// Use the database stored procedure calculate_payroll_for_period() instead
export async function calculateCompletePayroll(data: PayrollCalculationData): Promise<PayrollCalculationResult> {
  console.warn('calculateCompletePayroll is deprecated - use database stored procedure calculate_payroll_for_period() instead')
  
  const {
    baseSalary,
    daysWorked,
    hoursWorked,
    overtimeHours,
    lateHours,
    undertimeHours,
    holidayHours,
    holidayType,
    appliedRules,
    configurations
  } = data

  const dailyRate = calculateDailyRate(baseSalary)
  const hourlyRate = calculateHourlyRate(dailyRate, configurations.dailyHours)
  
  // Calculate earnings
  const regularPay = (hoursWorked - overtimeHours - holidayHours) * hourlyRate
  const overtimePay = calculateOvertimePay(overtimeHours, hourlyRate, configurations.overtimeRate1, configurations.overtimeRate2)
  const holidayPay = calculateHolidayPay(
    holidayHours,
    hourlyRate,
    holidayType,
    configurations.regularHolidayRate,
    configurations.specialHolidayRate
  )
  
  // Apply payroll rules for earnings
  const earningsRules = applyPayrollRules(appliedRules, baseSalary, 0, 'earnings')
  const allowances = earningsRules.breakdown.filter(r => r.category === 'allowance').reduce((sum, r) => sum + r.amount, 0)
  const bonuses = earningsRules.breakdown.filter(r => r.category === 'bonus').reduce((sum, r) => sum + r.amount, 0)
  const thirteenthMonthPay = earningsRules.breakdown.filter(r => r.category === 'mandatory_benefit').reduce((sum, r) => sum + r.amount, 0)
  const serviceIncentiveLeave = earningsRules.breakdown.filter(r => r.category === 'leave_benefit').reduce((sum, r) => sum + r.amount, 0)
  const otherEarnings = earningsRules.breakdown.filter(r => !['allowance', 'bonus', 'mandatory_benefit', 'leave_benefit'].includes(r.category)).reduce((sum, r) => sum + r.amount, 0)
  
  const totalEarnings = regularPay + overtimePay + holidayPay + allowances + bonuses + thirteenthMonthPay + serviceIncentiveLeave + otherEarnings
  const grossPay = totalEarnings
  
  // NOTE: Contributions and tax are now calculated in database - returning zeros for compatibility
  const contributionBase = dailyRate * daysWorked
  const gsisContribution = 0 // Calculated in database
  const philHealthContribution = 0 // Calculated in database
  const pagibigContribution = 0 // Calculated in database
  
  const taxableIncome = grossPay - gsisContribution - philHealthContribution - pagibigContribution - thirteenthMonthPay - serviceIncentiveLeave
  const withholdingTax = 0 // Calculated in database
  
  // Calculate other deductions
  const lateDeductions = calculateLateDeductions(lateHours, hourlyRate, dailyRate, configurations.lateDeductionAmount, configurations.lateDeductionBasis)
  const undertimeDeductions = undertimeHours * hourlyRate
  
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