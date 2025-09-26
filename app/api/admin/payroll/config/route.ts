import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { PayrollConfigurationService } from "@/app/admin/payroll/configuration/service"
import { normalizeConfigType } from "@/app/admin/payroll/configuration"
import type { ConfigurationScope } from "@/app/admin/payroll/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configType = searchParams.get("type")

    if (configType) {
      const normalized = normalizeConfigType(configType)
      if (normalized === 'holidays') {
        const bundle = await PayrollConfigurationService.loadBundle()
        return NextResponse.json({ config: bundle.holidays })
      }

      const config = await PayrollConfigurationService.loadType(normalized)
      return NextResponse.json({ config })
    }

    const bundle = await PayrollConfigurationService.loadBundle()
    return NextResponse.json({ configurations: bundle })
  } catch (error) {
    console.error("Error fetching payroll configurations:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll configurations" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, config, applicationScope } = body

    if (!type || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    const normalizedType = normalizeConfigType(type)

    if (normalizedType === 'holidays') {
      return NextResponse.json({
        success: false,
        message: 'Holiday configuration must be managed via holiday endpoints'
      }, { status: 400 })
    }

    const response = await PayrollConfigurationService.saveConfiguration(
      normalizedType as Exclude<ReturnType<typeof normalizeConfigType>, 'holidays'>,
      config
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error saving payroll configuration:", error)
    return NextResponse.json(
      { error: "Failed to save payroll configuration" },
      { status: 500 }
    )
  }
}

async function saveContributionsWithBrackets(config: any, applicationScope?: ConfigurationScope) {
  // Save contribution brackets to dedicated table
  const contributionTypes = ['gsis', 'philhealth', 'pagibig']
  
  for (const type of contributionTypes) {
    if (config[type]?.brackets) {
      // Delete existing brackets for this type
      await prisma.contributionBracket.deleteMany({
        where: { contributionType: type }
      })

      // Create new brackets
      for (const bracket of config[type].brackets) {
        await prisma.contributionBracket.create({
          data: {
            contributionType: type,
            salaryMin: bracket.salaryMin,
            salaryMax: bracket.salaryMax,
            employeeRate: bracket.employeeRate / 100, // Convert percentage to decimal
            employerRate: bracket.employerRate / 100,
            minContribution: bracket.minContribution,
            maxContribution: bracket.maxContribution,
            description: bracket.description,
            isActive: bracket.isActive !== false,
            priority: bracket.priority || 0
          }
        })
      }
    }
  }

  // Save basic configuration
  const basicConfig = { ...config }
  for (const type of contributionTypes) {
    if (basicConfig[type]) {
      delete basicConfig[type].brackets
    }
  }

  return NextResponse.json({
    success: true,
    message: "Contributions configuration with brackets saved successfully"
  })
}

async function saveTaxBracketsConfig(config: any, applicationScope?: ConfigurationScope) {
  // Delete existing tax brackets
  await prisma.taxBracketConfig.deleteMany({})

  // Create new tax brackets
  for (const bracket of config.brackets) {
    await prisma.taxBracketConfig.create({
      data: {
        salaryMin: bracket.min,
        salaryMax: bracket.max,
        taxRate: bracket.rate / 100, // Convert percentage to decimal
        fixedAmount: bracket.fixedAmount || 0,
        description: bracket.description,
        isActive: bracket.isActive !== false,
        priority: bracket.priority || 0,
        source: bracket.source || 'manual',
        apiReference: bracket.apiReference
      }
    })
  }

  // Save other tax configuration
  const { brackets, ...otherConfig } = config
  for (const [key, value] of Object.entries(otherConfig)) {
    if (key === 'applicationScope') continue
    
    const settingKey = `tax_brackets_${key}`
    await prisma.systemSettings.upsert({
      where: { key: settingKey },
      update: { 
        value: String(value),
        dataType: typeof value === 'boolean' ? 'BOOLEAN' : 'STRING',
        category: 'payroll'
      },
      create: {
        key: settingKey,
        value: String(value),
        dataType: typeof value === 'boolean' ? 'BOOLEAN' : 'STRING',
        category: 'payroll'
      }
    })
  }

  return NextResponse.json({
    success: true,
    message: "Tax brackets configuration saved successfully"
  })
}
