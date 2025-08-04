import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { ApplicationType, ConfigurationScope } from "@/app/admin/payroll/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configType = searchParams.get("type")

    if (configType) {
      // Get specific configuration type
      const settings = await prisma.systemSettings.findMany({
        where: {
          key: {
            startsWith: `${configType}_`
          }
        }
      })

      const config = settings.reduce((acc, setting) => {
        const key = setting.key.replace(`${configType}_`, '')
        let value: any = setting.value

        // Parse numeric values
        if (!isNaN(Number(value))) {
          value = Number(value)
        }
        
        // Parse boolean values
        if (value === 'true' || value === 'false') {
          value = value === 'true'
        }

        acc[key] = value
        return acc
      }, {} as any)

      return NextResponse.json({ config })
    }

    // Get all payroll configurations
    const allSettings = await prisma.systemSettings.findMany({
      where: {
        OR: [
          { key: { startsWith: 'working_hours_' } },
          { key: { startsWith: 'rates_' } },
          { key: { startsWith: 'leave_benefits_' } },
          { key: { startsWith: 'contributions_' } },
          { key: { startsWith: 'tax_brackets_' } }
        ]
      }
    })

    const configurations: {
      workingHours: Record<string, any>
      rates: Record<string, any>
      leaveBenefits: Record<string, any>
      contributions: Record<string, any>
      taxBrackets: Record<string, any>
    } = {
      workingHours: {},
      rates: {},
      leaveBenefits: {},
      contributions: {},
      taxBrackets: {}
    }

    allSettings.forEach(setting => {
      const [category, key] = setting.key.split('_').slice(0, 2).join('_').split('_')
      const fieldKey = setting.key.replace(`${category}_`, '')
      
      let value: any = setting.value

      // Parse numeric values
      if (!isNaN(Number(value))) {
        value = Number(value)
      }
      
      // Parse boolean values
      if (value === 'true' || value === 'false') {
        value = value === 'true'
      }

      if (category === 'working' && key === 'hours') {
        configurations.workingHours[fieldKey] = value
      } else if (category === 'rates') {
        configurations.rates[fieldKey] = value
      } else if (category === 'leave' && key === 'benefits') {
        configurations.leaveBenefits[fieldKey] = value
      } else if (category === 'contributions') {
        configurations.contributions[fieldKey] = value
      } else if (category === 'tax' && key === 'brackets') {
        configurations.taxBrackets[fieldKey] = value
      }
    })

    return NextResponse.json({ configurations })
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

    // Handle special configuration types
    if (type === 'contributions' && config.brackets) {
      return await saveContributionsWithBrackets(config, applicationScope)
    }

    if (type === 'tax_brackets' && config.brackets) {
      return await saveTaxBracketsConfig(config, applicationScope)
    }

    // Save regular configuration to system settings
    const savedSettings = []
    
    for (const [key, value] of Object.entries(config)) {
      if (key === 'applicationScope') continue // Skip scope in flat config
      
      const settingKey = `${type}_${key}`
      let stringValue = String(value)
      let dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DECIMAL' = 'STRING'

      // Determine data type
      if (typeof value === 'number') {
        dataType = Number.isInteger(value) ? 'NUMBER' : 'DECIMAL'
      } else if (typeof value === 'boolean') {
        dataType = 'BOOLEAN'
      } else if (typeof value === 'object') {
        dataType = 'JSON'
        stringValue = JSON.stringify(value)
      }
      
      const setting = await prisma.systemSettings.upsert({
        where: { key: settingKey },
        update: { 
          value: stringValue,
          dataType,
          category: 'payroll',
          isActive: true
        },
        create: {
          key: settingKey,
          value: stringValue,
          dataType,
          category: 'payroll',
          isActive: true
        }
      })

      savedSettings.push(setting)

      // Create configuration scope if provided
      if (applicationScope && applicationScope.applicationType !== 'ALL') {
        // First, delete existing scopes for this setting
        await prisma.configurationScope.deleteMany({
          where: { settingsId: setting.id }
        })

        // Create new scope
        await prisma.configurationScope.create({
          data: {
            settingsId: setting.id,
            applicationType: applicationScope.applicationType as ApplicationType,
            targetId: applicationScope.targetId,
            targetName: applicationScope.targetName,
            priority: applicationScope.priority || 0,
            isActive: applicationScope.isActive !== false
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Configuration saved successfully",
      configId: savedSettings[0]?.id
    })
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
