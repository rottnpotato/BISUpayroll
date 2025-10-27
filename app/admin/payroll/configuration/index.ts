import {
  WorkingHoursConfig,
  RatesConfig,
  LeaveBenefitsConfig,
  ContributionsConfig,
  ContributionBracket,
  TaxBracketsConfig,
  TaxBracket,
  ConfigurationScope,
  HolidayType
} from "../types"

export type ConfigType =
  | "workingHours"
  | "rates"
  | "leaveBenefits"
  | "contributions"
  | "taxBrackets"

export interface RawSetting {
  key: string
  value: string
  dataType?: string | null
}

export interface ContributionBracketRecord {
  id?: string
  contributionType: "gsis" | "philhealth" | "pagibig"
  salaryMin: number
  salaryMax: number
  employeeRate: number
  employerRate: number
  minContribution?: number | null
  maxContribution?: number | null
  description?: string | null
  isActive?: boolean | null
  priority?: number | null
}

export interface TaxBracketRecord {
  id?: string
  salaryMin: number
  salaryMax: number
  taxRate: number
  fixedAmount?: number | null
  description: string
  isActive?: boolean | null
  priority?: number | null
  source?: string | null
  apiReference?: string | null
}

export interface PayrollConfigurationBundle {
  workingHours: WorkingHoursConfig
  rates: RatesConfig
  leaveBenefits: LeaveBenefitsConfig
  contributions: ContributionsConfig
  taxBrackets: TaxBracketsConfig
  holidays: HolidayType[]
}

export const PAYROLL_CONFIG_DEFAULTS: PayrollConfigurationBundle = {
  workingHours: {
    dailyHours: 8,
    weeklyHours: 40,
    overtimeThreshold: 8,
    lateGraceMinutes: 15,
    lateDeductionBasis: "per_minute",
    lateDeductionAmount: 0
  },
  rates: {
    overtimeRate1: 1.25,
    overtimeRate2: 1.5,
    regularHolidayRate: 200,
    specialHolidayRate: 130,
    currency: "PHP"
  },
  leaveBenefits: {
    vacationLeave: 15,
    sickLeave: 7,
    serviceIncentiveLeave: 5,
    maternityLeave: 105,
    paternityLeave: 7
  },
  contributions: {
    gsis: {
      employeeRate: 0,
      employerRate: 0,
      minSalary: 0,
      maxSalary: 0
    },
    philHealth: {
      employeeRate: 0,
      employerRate: 0,
      minContribution: 0,
      maxContribution: 0,
      minSalary: 0,
      maxSalary: 0
    },
    pagibig: {
      employeeRate: 0,
      employerRate: 0,
      minContribution: 0,
      maxContribution: 0,
      minSalary: 0,
      maxSalary: 0
    }
  },
  taxBrackets: {
    brackets: [
      { min: 0, max: 20833, rate: 0, description: "₱0 - ₱250,000 annually" },
      { min: 20834, max: 33333, rate: 20, description: "₱250,001 - ₱400,000 annually" },
      { min: 33334, max: 66667, rate: 25, description: "₱400,001 - ₱800,000 annually" },
      { min: 66668, max: 166667, rate: 30, description: "₱800,001 - ₱2,000,000 annually" },
      { min: 166668, max: 666667, rate: 32, description: "₱2,000,001 - ₱8,000,000 annually" },
      { min: 666668, max: 999999999, rate: 35, description: "Above ₱8,000,000 annually" }
    ],
    withholdingEnabled: true,
    showBreakdownOnPayslip: true,
    autoComputeTax: true
  },
  holidays: []
}

export const CONFIG_TYPE_KEY_MAP: Record<ConfigType, string> = {
  workingHours: "working_hours",
  rates: "rates",
  leaveBenefits: "leave_benefits",
  contributions: "contributions",
  taxBrackets: "tax_brackets"
}

const workingHoursKeyMap: Record<keyof WorkingHoursConfig, string> = {
  dailyHours: "working_hours_dailyHours",
  weeklyHours: "working_hours_weeklyHours",
  overtimeThreshold: "working_hours_overtimeThreshold",
  lateGraceMinutes: "working_hours_lateGraceMinutes",
  lateDeductionBasis: "working_hours_lateDeductionBasis",
  lateDeductionAmount: "working_hours_lateDeductionAmount"
}

const ratesKeyMap: Record<keyof RatesConfig, string> = {
  overtimeRate1: "rates_overtimeRate1",
  overtimeRate2: "rates_overtimeRate2",
  regularHolidayRate: "rates_regularHolidayRate",
  specialHolidayRate: "rates_specialHolidayRate",
  currency: "rates_currency"
}

const leaveBenefitsKeyMap: Record<keyof LeaveBenefitsConfig, string> = {
  vacationLeave: "leave_benefits_vacationLeave",
  sickLeave: "leave_benefits_sickLeave",
  serviceIncentiveLeave: "leave_benefits_serviceIncentiveLeave",
  maternityLeave: "leave_benefits_maternityLeave",
  paternityLeave: "leave_benefits_paternityLeave"
}

const contributionKeyMap = {
  gsis: {
    employeeRate: "contributions_gsis_employeeRate",
    employerRate: "contributions_gsis_employerRate",
    minSalary: "contributions_gsis_minSalary",
    maxSalary: "contributions_gsis_maxSalary"
  },
  philHealth: {
    employeeRate: "contributions_philHealth_employeeRate",
    employerRate: "contributions_philHealth_employerRate",
    minContribution: "contributions_philHealth_minContribution",
    maxContribution: "contributions_philHealth_maxContribution",
    minSalary: "contributions_philHealth_minSalary",
    maxSalary: "contributions_philHealth_maxSalary"
  },
  pagibig: {
    employeeRate: "contributions_pagibig_employeeRate",
    employerRate: "contributions_pagibig_employerRate",
    minContribution: "contributions_pagibig_minContribution",
    maxContribution: "contributions_pagibig_maxContribution",
    minSalary: "contributions_pagibig_minSalary",
    maxSalary: "contributions_pagibig_maxSalary"
  }
} as const

const taxSettingKeyMap = {
  withholdingEnabled: "tax_brackets_withholdingEnabled",
  showBreakdownOnPayslip: "tax_brackets_showBreakdownOnPayslip",
  autoComputeTax: "tax_brackets_autoComputeTax"
} as const

export const PAYROLL_SETTING_KEYS = [
  ...Object.values(workingHoursKeyMap),
  ...Object.values(ratesKeyMap),
  ...Object.values(leaveBenefitsKeyMap),
  ...Object.values(contributionKeyMap.gsis),
  ...Object.values(contributionKeyMap.philHealth),
  ...Object.values(contributionKeyMap.pagibig),
  ...Object.values(taxSettingKeyMap)
]

const toNumber = (value: string | undefined, fallback: number) => {
  if (value === undefined || value === null) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === null) return fallback
  if (value === "true" || value === true) return true
  if (value === "false" || value === false) return false
  return fallback
}

export const normalizeSettingKey = (key: string) => key.trim()

export function mapSettingsToConfiguration(
  settings: RawSetting[],
  contributionBrackets: ContributionBracketRecord[] = [],
  taxBrackets: TaxBracketRecord[] = [],
  holidays: HolidayType[] = []
): PayrollConfigurationBundle {
  const settingMap = new Map<string, string>()
  settings.forEach(setting => {
    settingMap.set(normalizeSettingKey(setting.key), setting.value)
  })

  const workingHours: WorkingHoursConfig = {
    dailyHours: toNumber(settingMap.get(workingHoursKeyMap.dailyHours), PAYROLL_CONFIG_DEFAULTS.workingHours.dailyHours),
    weeklyHours: toNumber(settingMap.get(workingHoursKeyMap.weeklyHours), PAYROLL_CONFIG_DEFAULTS.workingHours.weeklyHours),
    overtimeThreshold: toNumber(settingMap.get(workingHoursKeyMap.overtimeThreshold), PAYROLL_CONFIG_DEFAULTS.workingHours.overtimeThreshold),
    lateGraceMinutes: toNumber(settingMap.get(workingHoursKeyMap.lateGraceMinutes), PAYROLL_CONFIG_DEFAULTS.workingHours.lateGraceMinutes),
    lateDeductionBasis: (settingMap.get(workingHoursKeyMap.lateDeductionBasis) as WorkingHoursConfig["lateDeductionBasis"]) || PAYROLL_CONFIG_DEFAULTS.workingHours.lateDeductionBasis,
    lateDeductionAmount: toNumber(settingMap.get(workingHoursKeyMap.lateDeductionAmount), PAYROLL_CONFIG_DEFAULTS.workingHours.lateDeductionAmount)
  }

  const rates: RatesConfig = {
    overtimeRate1: toNumber(settingMap.get(ratesKeyMap.overtimeRate1), PAYROLL_CONFIG_DEFAULTS.rates.overtimeRate1),
    overtimeRate2: toNumber(settingMap.get(ratesKeyMap.overtimeRate2), PAYROLL_CONFIG_DEFAULTS.rates.overtimeRate2),
    regularHolidayRate: toNumber(settingMap.get(ratesKeyMap.regularHolidayRate), PAYROLL_CONFIG_DEFAULTS.rates.regularHolidayRate),
    specialHolidayRate: toNumber(settingMap.get(ratesKeyMap.specialHolidayRate), PAYROLL_CONFIG_DEFAULTS.rates.specialHolidayRate),
    currency: (settingMap.get(ratesKeyMap.currency) as RatesConfig["currency"]) || PAYROLL_CONFIG_DEFAULTS.rates.currency
  }

  const leaveBenefits: LeaveBenefitsConfig = {
    vacationLeave: toNumber(settingMap.get(leaveBenefitsKeyMap.vacationLeave), PAYROLL_CONFIG_DEFAULTS.leaveBenefits.vacationLeave),
    sickLeave: toNumber(settingMap.get(leaveBenefitsKeyMap.sickLeave), PAYROLL_CONFIG_DEFAULTS.leaveBenefits.sickLeave),
    serviceIncentiveLeave: toNumber(settingMap.get(leaveBenefitsKeyMap.serviceIncentiveLeave), PAYROLL_CONFIG_DEFAULTS.leaveBenefits.serviceIncentiveLeave),
    maternityLeave: toNumber(settingMap.get(leaveBenefitsKeyMap.maternityLeave), PAYROLL_CONFIG_DEFAULTS.leaveBenefits.maternityLeave ?? 0),
    paternityLeave: toNumber(settingMap.get(leaveBenefitsKeyMap.paternityLeave), PAYROLL_CONFIG_DEFAULTS.leaveBenefits.paternityLeave ?? 0)
  }

  const mapContributionSection = (section: keyof ContributionsConfig) => {
    const defaults = PAYROLL_CONFIG_DEFAULTS.contributions[section]
    const keys = contributionKeyMap[section]
    const result: any = {}
    Object.entries(keys).forEach(([field, key]) => {
      result[field] = toNumber(settingMap.get(key), (defaults as any)[field])
    })
    return result
  }

  const contributions: ContributionsConfig = {
    gsis: {
      ...mapContributionSection("gsis"),
      brackets: contributionBrackets
        .filter(bracket => bracket.contributionType === "gsis")
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        .map<ContributionBracket>(bracket => ({
          id: bracket.id,
          contributionType: "gsis",
          salaryMin: bracket.salaryMin,
          salaryMax: bracket.salaryMax,
          employeeRate: bracket.employeeRate * 100,
          employerRate: bracket.employerRate * 100,
          minContribution: bracket.minContribution ?? undefined,
          maxContribution: bracket.maxContribution ?? undefined,
          description: bracket.description ?? undefined,
          isActive: bracket.isActive ?? undefined,
          priority: bracket.priority ?? undefined
        }))
    },
    philHealth: {
      ...mapContributionSection("philHealth"),
      brackets: contributionBrackets
        .filter(bracket => bracket.contributionType === "philhealth")
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        .map<ContributionBracket>(bracket => ({
          id: bracket.id,
          contributionType: "philhealth",
          salaryMin: bracket.salaryMin,
          salaryMax: bracket.salaryMax,
          employeeRate: bracket.employeeRate * 100,
          employerRate: bracket.employerRate * 100,
          minContribution: bracket.minContribution ?? undefined,
          maxContribution: bracket.maxContribution ?? undefined,
          description: bracket.description ?? undefined,
          isActive: bracket.isActive ?? undefined,
          priority: bracket.priority ?? undefined
        }))
    },
    pagibig: {
      ...mapContributionSection("pagibig"),
      brackets: contributionBrackets
        .filter(bracket => bracket.contributionType === "pagibig")
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        .map<ContributionBracket>(bracket => ({
          id: bracket.id,
          contributionType: "pagibig",
          salaryMin: bracket.salaryMin,
          salaryMax: bracket.salaryMax,
          employeeRate: bracket.employeeRate * 100,
          employerRate: bracket.employerRate * 100,
          minContribution: bracket.minContribution ?? undefined,
          maxContribution: bracket.maxContribution ?? undefined,
          description: bracket.description ?? undefined,
          isActive: bracket.isActive ?? undefined,
          priority: bracket.priority ?? undefined
        }))
    }
  }

  const mappedTaxBrackets: TaxBracket[] = taxBrackets
    .filter(bracket => bracket.isActive !== false)
    .sort((a, b) => a.salaryMin - b.salaryMin)
    .map<TaxBracket>(bracket => ({
      id: bracket.id,
      min: bracket.salaryMin,
      max: bracket.salaryMax,
      rate: bracket.taxRate * 100,
      fixedAmount: (bracket.fixedAmount ?? 0) as number,
      description: bracket.description,
      effectiveDate: undefined,
      isActive: bracket.isActive ?? undefined,
      priority: bracket.priority ?? undefined,
      source: bracket.source ?? undefined,
      apiReference: bracket.apiReference ?? undefined
    }))

  const taxBracketsConfig: TaxBracketsConfig = {
    brackets: mappedTaxBrackets.length > 0 ? mappedTaxBrackets : PAYROLL_CONFIG_DEFAULTS.taxBrackets.brackets,
    withholdingEnabled: toBoolean(settingMap.get(taxSettingKeyMap.withholdingEnabled), PAYROLL_CONFIG_DEFAULTS.taxBrackets.withholdingEnabled),
    showBreakdownOnPayslip: toBoolean(settingMap.get(taxSettingKeyMap.showBreakdownOnPayslip), PAYROLL_CONFIG_DEFAULTS.taxBrackets.showBreakdownOnPayslip),
    autoComputeTax: toBoolean(settingMap.get(taxSettingKeyMap.autoComputeTax), PAYROLL_CONFIG_DEFAULTS.taxBrackets.autoComputeTax)
  }

  return {
    workingHours,
    rates,
    leaveBenefits,
    contributions,
    taxBrackets: taxBracketsConfig,
    holidays
  }
}

export interface SettingPayload {
  key: string
  value: string
  dataType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "DECIMAL"
  category: string
}

const makeNumberValue = (value: number) => ({
  value: String(value),
  dataType: Number.isInteger(value) ? "NUMBER" : "DECIMAL"
})

export function buildSettingsPayload(type: ConfigType, config: any): SettingPayload[] {
  switch (type) {
    case "workingHours":
      return Object.entries(workingHoursKeyMap).map(([field, key]) => {
        const parsed = makeNumberValue(config[field as keyof WorkingHoursConfig])
        return {
          key,
          value: parsed.value,
          dataType: parsed.dataType,
          category: "payroll"
        }
      })
    case "rates":
      return Object.entries(ratesKeyMap).map(([field, key]) => {
        if (field === "currency") {
          return {
            key,
            value: config.currency,
            dataType: "STRING",
            category: "payroll"
          }
        }
        const parsed = makeNumberValue(config[field as keyof RatesConfig])
        return {
          key,
          value: parsed.value,
          dataType: parsed.dataType,
          category: "payroll"
        }
      })
    case "leaveBenefits":
      return Object.entries(leaveBenefitsKeyMap).map(([field, key]) => {
        const parsed = makeNumberValue(config[field as keyof LeaveBenefitsConfig] ?? 0)
        return {
          key,
          value: parsed.value,
          dataType: parsed.dataType,
          category: "payroll"
        }
      })
    case "contributions": {
      const payload: SettingPayload[] = []
      const sections = Object.keys(contributionKeyMap) as Array<keyof ContributionsConfig>
      sections.forEach(section => {
        const sectionKeys = contributionKeyMap[section]
        Object.entries(sectionKeys).forEach(([field, key]) => {
          const value = (config[section] as Record<string, number>)[field]
          const parsed = makeNumberValue(value)
          payload.push({
            key,
            value: parsed.value,
            dataType: parsed.dataType,
            category: "payroll"
          })
        })
      })
      return payload
    }
    case "taxBrackets":
      return Object.entries(taxSettingKeyMap).map(([field, key]) => ({
        key,
        value: String(Boolean(config[field])),
        dataType: "BOOLEAN",
        category: "payroll"
      }))
    default:
      return []
  }
}

export interface ContributionPersistencePayload {
  brackets: ContributionBracketRecord[]
}

export interface TaxPersistencePayload {
  brackets: TaxBracketRecord[]
}

export function buildContributionPersistencePayload(config: ContributionsConfig): ContributionPersistencePayload {
  const brackets: ContributionBracketRecord[] = []

  const pushBracket = (type: "gsis" | "philhealth" | "pagibig", bracket: ContributionBracket) => {
    brackets.push({
      id: bracket.id,
      contributionType: type,
      salaryMin: bracket.salaryMin,
      salaryMax: bracket.salaryMax,
      employeeRate: bracket.employeeRate / 100,
      employerRate: bracket.employerRate / 100,
      minContribution: bracket.minContribution ?? null,
      maxContribution: bracket.maxContribution ?? null,
      description: bracket.description ?? null,
      isActive: bracket.isActive ?? true,
      priority: bracket.priority ?? 0
    })
  }

  config.gsis.brackets?.forEach(bracket => pushBracket("gsis", bracket))
  config.philHealth.brackets?.forEach(bracket => pushBracket("philhealth", bracket))
  config.pagibig.brackets?.forEach(bracket => pushBracket("pagibig", bracket))

  return { brackets }
}

export function buildTaxPersistencePayload(config: TaxBracketsConfig): TaxPersistencePayload {
  const brackets: TaxBracketRecord[] = config.brackets.map(bracket => ({
    id: bracket.id,
    salaryMin: bracket.min,
    salaryMax: bracket.max,
    taxRate: bracket.rate / 100,
    fixedAmount: bracket.fixedAmount ?? 0,
    description: bracket.description,
    isActive: bracket.isActive ?? true,
    priority: bracket.priority ?? 0,
    source: bracket.source ?? "manual",
    apiReference: bracket.apiReference ?? null
  }))

  return { brackets }
}

export interface SaveConfigResponse {
  success: boolean
  message: string
  configId?: string
  errors?: string[]
}

export interface SaveConfigurationParams {
  type: ConfigType
  config: WorkingHoursConfig | RatesConfig | LeaveBenefitsConfig | ContributionsConfig | TaxBracketsConfig
  scope?: ConfigurationScope
}

export const normalizeConfigType = (input: string): ConfigType | "holidays" => {
  const lower = input.replace(/-/g, "_")
  switch (lower) {
    case "working_hours":
    case "workinghours":
    case "workingHours":
      return "workingHours"
    case "rates":
      return "rates"
    case "leave_benefits":
    case "leavebenefits":
    case "leaveBenefits":
      return "leaveBenefits"
    case "contributions":
      return "contributions"
    case "tax_brackets":
    case "taxbrackets":
    case "taxBrackets":
      return "taxBrackets"
    case "holidays":
      return "holidays"
    default:
      return input as ConfigType
  }
}

export const toClientHoliday = (holiday: HolidayType): HolidayType => ({
  ...holiday,
  date: holiday.date
})

