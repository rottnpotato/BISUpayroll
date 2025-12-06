export const PREDEFINED_DEDUCTION_TYPES = [
  { id: 'withholding_tax', name: 'Withholding Tax', code: '412w', category: 'government' },
  { id: 'sic_premium', name: 'SIC Premium', code: '413-1', category: 'government' },
  { id: 'paibig_premium', name: 'Pa-ibig Premium', code: '414-1', category: 'government' },
  { id: 'phil_health', name: 'PHIL Health', code: '415', category: 'government' },
  { id: 'city_savings_bank_loan', name: 'City Savings Bank Loan', code: '439-5', category: 'loans' },
  { id: 'gsis_conso_loan', name: 'GSIS Conso Loan', code: '413-4', category: 'loans' },
  { id: 'gsis_optional_policy_loan', name: 'GSIS Optional Policy Loan', code: '413-3', category: 'loans' },
  { id: 'gsis_gfal', name: 'GSIS GFAL', code: '413-7', category: 'loans' },
  { id: 'coa_disallowance', name: 'COA Disallowance', code: '439-6', category: 'other' },
  { id: 'gsis_emergency_loan', name: 'GSIS Emergency Loan', code: '413-8', category: 'loans' },
  { id: 'gsis_mpl', name: 'GSIS MPL', code: '413-6', category: 'loans' },
  { id: 'gsis_mpl_lite', name: 'GSIS MPL_LITE', code: '413-9', category: 'loans' },
  { id: 'gsis_cpl', name: 'GSIS CPL', code: '413-2', category: 'loans' },
  { id: 'sss_kaltas', name: 'SSS Kaltas Contribution', code: '439-8', category: 'government' },
  { id: 'fa_deduction', name: 'FA Deduction', code: '439-9', category: 'other' },
  { id: 'hdmf_mp2_account', name: 'HDMF MP2 Account', code: '414-3', category: 'government' },
  { id: 'hdmf_pml_loan', name: 'HDMF PML Loan', code: '414-2', category: 'loans' },
  { id: 'custom', name: 'Custom Deduction', code: '', category: 'other' }
] as const

export type DeductionTypeId = typeof PREDEFINED_DEDUCTION_TYPES[number]['id']

export const DEDUCTION_CATEGORIES = {
  government: 'Government Contributions',
  loans: 'Loan Deductions', 
  other: 'Other Deductions'
} as const

export const getDeductionByCode = (code: string) => {
  return PREDEFINED_DEDUCTION_TYPES.find(d => d.code === code)
}

export const getDeductionById = (id: string) => {
  return PREDEFINED_DEDUCTION_TYPES.find(d => d.id === id)
}

