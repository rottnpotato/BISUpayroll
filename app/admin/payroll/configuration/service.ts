import 'server-only'
import { prisma } from "@/lib/database"
import { SystemSettings } from "@prisma/client"
import {
  buildContributionPersistencePayload,
  buildSettingsPayload,
  buildTaxPersistencePayload,
  ConfigType,
  normalizeConfigType,
  mapSettingsToConfiguration,
  PAYROLL_CONFIG_DEFAULTS,
  PayrollConfigurationBundle,
  RawSetting,
  SaveConfigResponse
} from "./index"
import type { ContributionsConfig, TaxBracketsConfig } from "../types"
import { HolidayType } from "../types"

const ACTIVE_ONLY = { isActive: true }

export class PayrollConfigurationService {
  static async loadBundle(): Promise<PayrollConfigurationBundle> {
    const [settings, contributionBrackets, taxBrackets, holidays, scopes] = await Promise.all([
      prisma.systemSettings.findMany({ 
        where: { category: "payroll" },
        include: { scopes: { where: { isActive: true } } }
      }),
      prisma.contributionBracket.findMany({ where: ACTIVE_ONLY }),
      prisma.taxBracketConfig.findMany({ where: ACTIVE_ONLY }),
      prisma.holiday.findMany(),
      prisma.configurationScope.findMany({ where: { isActive: true } })
    ])

    return mapSettingsToConfiguration(
      settings as RawSetting[],
      contributionBrackets.map(bracket => ({
        id: bracket.id,
        contributionType: bracket.contributionType as "gsis" | "philhealth" | "pagibig",
        salaryMin: Number(bracket.salaryMin),
        salaryMax: Number(bracket.salaryMax),
        employeeRate: Number(bracket.employeeRate),
        employerRate: Number(bracket.employerRate),
        minContribution: bracket.minContribution ? Number(bracket.minContribution) : undefined,
        maxContribution: bracket.maxContribution ? Number(bracket.maxContribution) : undefined,
        description: bracket.description,
        isActive: bracket.isActive,
        priority: bracket.priority
      })),
      taxBrackets.map(bracket => ({
        id: bracket.id,
        salaryMin: Number(bracket.salaryMin),
        salaryMax: Number(bracket.salaryMax),
        taxRate: Number(bracket.taxRate),
        fixedAmount: bracket.fixedAmount ? Number(bracket.fixedAmount) : undefined,
        description: bracket.description,
        isActive: bracket.isActive,
        priority: bracket.priority,
        source: bracket.source,
        apiReference: bracket.apiReference
      })),
      holidays.map<HolidayType>(holiday => ({
        id: holiday.id,
        name: holiday.name,
        date: holiday.date.toISOString(),
        type: holiday.type.toLowerCase() as HolidayType["type"],
        payMultiplier: holiday.type === "REGULAR" ? PAYROLL_CONFIG_DEFAULTS.rates.regularHolidayRate / 100 : PAYROLL_CONFIG_DEFAULTS.rates.specialHolidayRate / 100,
        isActive: true,
        isRecurring: holiday.isRecurring
      })),
      scopes
    )
  }

  static async loadType(type: ConfigType): Promise<PayrollConfigurationBundle[ConfigType]> {
    const bundle = await this.loadBundle()
    return bundle[type]
  }

  static async saveConfiguration(type: ConfigType, config: any): Promise<SaveConfigResponse> {
    const normalized = normalizeConfigType(type)

    if (normalized === "holidays") {
      return { success: true, message: "Holiday configuration handled separately" }
    }

    const payload = buildSettingsPayload(normalized, config)
    const applicationScope = config.applicationScope

    await prisma.$transaction(async tx => {
      if (payload.length > 0) {
        // Save each setting with its configuration scope
        await Promise.all(payload.map(async setting => {
          const settingRecord = await tx.systemSettings.upsert({
            where: { key: setting.key },
            create: setting,
            update: {
              value: setting.value,
              dataType: setting.dataType,
              category: setting.category,
              isActive: true
            }
          })

          // If there's an application scope, create/update configuration scope
          if (applicationScope) {
            // First, deactivate old scopes for this setting
            await tx.configurationScope.updateMany({
              where: { settingsId: settingRecord.id },
              data: { isActive: false }
            })

            // Create new scope
            await tx.configurationScope.create({
              data: {
                settingsId: settingRecord.id,
                applicationType: applicationScope.applicationType || 'ALL',
                targetId: applicationScope.targetId,
                targetName: applicationScope.targetName,
                priority: applicationScope.priority || 0,
                isActive: true
              }
            })
          }
        }))
      }

      if (normalized === "contributions") {
        const { brackets } = buildContributionPersistencePayload(config as ContributionsConfig)
        await tx.contributionBracket.deleteMany({})
        if (brackets.length > 0) {
          await tx.contributionBracket.createMany({
            data: brackets.map(bracket => ({
              contributionType: bracket.contributionType,
              salaryMin: bracket.salaryMin,
              salaryMax: bracket.salaryMax,
              employeeRate: bracket.employeeRate,
              employerRate: bracket.employerRate,
              minContribution: bracket.minContribution ?? undefined,
              maxContribution: bracket.maxContribution ?? undefined,
              description: bracket.description ?? undefined,
              isActive: bracket.isActive ?? true,
              priority: bracket.priority ?? 0
            }))
          })
        }
      }

      if (normalized === "taxBrackets") {
        const { brackets } = buildTaxPersistencePayload(config as TaxBracketsConfig)
        await tx.taxBracketConfig.deleteMany({})
        if (brackets.length > 0) {
          await tx.taxBracketConfig.createMany({
            data: brackets.map(bracket => ({
              salaryMin: bracket.salaryMin,
              salaryMax: bracket.salaryMax,
              taxRate: bracket.taxRate,
              fixedAmount: bracket.fixedAmount ?? 0,
              description: bracket.description,
              isActive: bracket.isActive ?? true,
              priority: bracket.priority ?? 0,
              source: bracket.source ?? "manual",
              apiReference: bracket.apiReference ?? null
            }))
          })
        }
      }
    })

    return { success: true, message: `${normalized} configuration saved` }
  }

  static async upsertSettings(settings: SystemSettings[]): Promise<void> {
    await prisma.$transaction(settings.map(setting =>
      prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting
      })
    ))
  }
}

