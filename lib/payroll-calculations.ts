// =====================================================
// DEPRECATED: This file contains legacy payroll calculation functions
// =====================================================
// These functions have been replaced by PostgreSQL stored procedures
// that handle all payroll calculations at the database level.
//
// New system: See prisma/migrations/20251026000002_update_payroll_stored_procedures.sql
// Documentation: See PAYROLL_STORED_PROCEDURES.md
//
// Key changes:
// 1. All calculations now done via calculate_payroll_for_period() stored procedure
// 2. baseSalary concept replaced with dailyRate from payroll_rules
// 3. Payroll results stored in payroll_results table with automatic triggers
// 4. Real-time updates when attendance or rules change
//
// Migration guide:
// - Old: calculateBaseSalaryFromRules(rules) / 22 for daily rate
// - New: Get daily_rate directly from payroll_rules where type='daily_rate'
// - Old: Call calculateCompletePayroll() in application
// - New: Use stored procedure via /api/admin/payroll/recalculate
// =====================================================

import { ContributionsConfig, TaxBracket, TaxBracketsConfig } from "@/app/admin/payroll/types"
import { PayrollConfigurationService } from "@/app/admin/payroll/configuration/service"
import { getWorkingDaysInMonth, getWorkingDaysInYear } from "./work-calendar"

let cachedConfig: { contributions: ContributionsConfig; tax: TaxBracketsConfig } | null = null
let lastConfigFetch = 0
const CONFIG_CACHE_TTL_MS = 60_000

const ensureConfigLoaded = async (): Promise<{ contributions: ContributionsConfig; tax: TaxBracketsConfig }> => {
  const now = Date.now()
  if (!cachedConfig || now - lastConfigFetch > CONFIG_CACHE_TTL_MS) {
    const [contributions, tax] = (await Promise.all([
      PayrollConfigurationService.loadType('contributions'),
      PayrollConfigurationService.loadType('taxBrackets')
    ])) as [ContributionsConfig, TaxBracketsConfig]

    cachedConfig = { contributions, tax }
    lastConfigFetch = now
  }
  return cachedConfig as { contributions: ContributionsConfig; tax: TaxBracketsConfig }
}

const getTaxConfig = async (): Promise<TaxBracketsConfig> => {
  const config = await ensureConfigLoaded()
  return config.tax
}

const getContributionConfig = async (): Promise<ContributionsConfig> => {
  const config = await ensureConfigLoaded()
  return config.contributions
}

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
    contributions?: ContributionsConfig
    tax?: TaxBracketsConfig
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

export function calculateDailyRate(dailyRate: number): number {
  return dailyRate
}

export function calculateHourlyRate(dailyRate: number, dailyHours: number = 8): number {
  return dailyRate / dailyHours
}

export function calculateAnnualTaxableIncome(annualGross: number): number {
  return annualGross
}

export function calculateWithholdingTax(annualTaxableIncome: number, brackets: TaxBracket[]): number {
  for (const bracket of brackets) {
    if (annualTaxableIncome > bracket.min && annualTaxableIncome <= bracket.max) {
      const taxableAmount = annualTaxableIncome - bracket.min
      const rate = bracket.rate / 100
      const tax = (bracket.fixedAmount ?? 0) + (taxableAmount * rate)
      return tax / 12
    }
  }
  const lastBracket = brackets[brackets.length - 1]
  if (lastBracket && annualTaxableIncome > lastBracket.min) {
    const rate = lastBracket.rate / 100
    const taxableAmount = annualTaxableIncome - lastBracket.min
    const tax = (lastBracket.fixedAmount ?? 0) + (taxableAmount * rate)
    return tax / 12
  }
  return 0
}

export function calculateGSISContribution(salaryBase: number, config: ContributionsConfig): number {
  const { employeeRate, minSalary, maxSalary, brackets } = config.gsis
  if (brackets && brackets.length > 0) {
    const matched = brackets.find(bracket => salaryBase >= bracket.salaryMin && salaryBase <= bracket.salaryMax)
    if (matched) {
      return salaryBase * (matched.employeeRate / 100)
    }
  }
  const contributionBase = Math.max(minSalary, Math.min(maxSalary, salaryBase))
  return contributionBase * (employeeRate / 100)
}

export function calculatePhilHealthContribution(salaryBase: number, config: ContributionsConfig): number {
  const { employeeRate, minContribution, maxContribution, minSalary, maxSalary, brackets } = config.philHealth
  if (brackets && brackets.length > 0) {
    const matched = brackets.find(bracket => salaryBase >= bracket.salaryMin && salaryBase <= bracket.salaryMax)
    if (matched) {
      const contribution = salaryBase * (matched.employeeRate / 100)
      return Math.max(minContribution, Math.min(maxContribution, contribution))
    }
  }

  if (salaryBase < minSalary) {
    return minContribution
  }

  const contributionBase = Math.min(maxSalary, salaryBase)
  const contribution = contributionBase * (employeeRate / 100)
  return Math.max(minContribution, Math.min(maxContribution, contribution))
}

export function calculatePagibigContribution(salaryBase: number, config: ContributionsConfig): number {
  const { employeeRate, minContribution, maxContribution, minSalary, maxSalary, brackets } = config.pagibig
  if (brackets && brackets.length > 0) {
    const matched = brackets.find(bracket => salaryBase >= bracket.salaryMin && salaryBase <= bracket.salaryMax)
    if (matched) {
      const contribution = salaryBase * (matched.employeeRate / 100)
      return Math.max(minContribution, Math.min(maxContribution, contribution))
    }
  }

  if (salaryBase < minSalary) {
    return minContribution
  }

  const contributionBase = Math.min(maxSalary, salaryBase)
  const contribution = contributionBase * (employeeRate / 100)
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

export async function calculateCompletePayroll(data: PayrollCalculationData): Promise<PayrollCalculationResult> {
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

  const contributionConfig = configurations.contributions || await getContributionConfig()
  const taxConfig = configurations.tax || await getTaxConfig()

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
  // Night differential removed
  
  // Apply payroll rules for earnings
  const earningsRules = applyPayrollRules(appliedRules, baseSalary, 0, 'earnings')
  const allowances = earningsRules.breakdown.filter(r => r.category === 'allowance').reduce((sum, r) => sum + r.amount, 0)
  const bonuses = earningsRules.breakdown.filter(r => r.category === 'bonus').reduce((sum, r) => sum + r.amount, 0)
  const thirteenthMonthPay = earningsRules.breakdown.filter(r => r.category === 'mandatory_benefit').reduce((sum, r) => sum + r.amount, 0)
  const serviceIncentiveLeave = earningsRules.breakdown.filter(r => r.category === 'leave_benefit').reduce((sum, r) => sum + r.amount, 0)
  const otherEarnings = earningsRules.breakdown.filter(r => !['allowance', 'bonus', 'mandatory_benefit', 'leave_benefit'].includes(r.category)).reduce((sum, r) => sum + r.amount, 0)
  
  const totalEarnings = regularPay + overtimePay + holidayPay + allowances + bonuses + thirteenthMonthPay + serviceIncentiveLeave + otherEarnings
  const grossPay = totalEarnings
  
  // Calculate mandatory contributions based on daily rate and actual days worked
  const contributionBase = dailyRate * daysWorked
  const gsisContribution = calculateGSISContribution(contributionBase, contributionConfig)
  const philHealthContribution = calculatePhilHealthContribution(contributionBase, contributionConfig)
  const pagibigContribution = calculatePagibigContribution(contributionBase, contributionConfig)
  
  // Calculate taxable income (gross pay minus non-taxable contributions)
  const taxableIncome = grossPay - gsisContribution - philHealthContribution - pagibigContribution - thirteenthMonthPay - serviceIncentiveLeave
  // Annualize based on working days in year vs month
  try {
    const now = new Date()
    const workingDaysMonth = await getWorkingDaysInMonth(now.getFullYear(), now.getMonth() + 1)
    const workingDaysYear = await getWorkingDaysInYear(now.getFullYear())
    const monthlyEquivalent = workingDaysMonth > 0 ? taxableIncome * (22 / workingDaysMonth) : taxableIncome
    const annualGrossEquivalent = workingDaysYear > 0 ? (monthlyEquivalent * (workingDaysYear / 22)) : (monthlyEquivalent * 12)
    const annualTaxableIncome = calculateAnnualTaxableIncome(annualGrossEquivalent)
    var computedAnnualTaxableIncome = annualTaxableIncome
  } catch {
    // Fallback to 12x if calendar unavailable
    var computedAnnualTaxableIncome = taxableIncome * 12
  }
  const withholdingTax = calculateWithholdingTax(computedAnnualTaxableIncome, taxConfig.brackets)
  
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