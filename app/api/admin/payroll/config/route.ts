import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
        key: {
          in: [
            'working_hours_dailyHours',
            'working_hours_weeklyHours',
            'working_hours_nightShiftEnabled',
            'working_hours_nightShiftStart',
            'working_hours_nightShiftEnd',
            'working_hours_lateGraceMinutes',
            'working_hours_lateDeductionBasis',
            'working_hours_lateDeductionAmount',
            'rates_overtimeRate1',
            'rates_overtimeRate2',
            'rates_nightDifferential',
            'rates_regularHolidayRate',
            'rates_specialHolidayRate',
            'rates_currency',
            'leave_benefits_vacationLeave',
            'leave_benefits_sickLeave',
            'leave_benefits_serviceIncentiveLeave',
            'leave_benefits_maternityLeave',
            'leave_benefits_paternityLeave',
          ]
        }
      }
    })

    const configurations: {
      workingHours: Record<string, any>
      rates: Record<string, any>
      leaveBenefits: Record<string, any>
    } = {
      workingHours: {},
      rates: {},
      leaveBenefits: {}
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
    const { type, config } = body

    if (!type || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Save configuration to system settings
    for (const [key, value] of Object.entries(config)) {
      const settingKey = `${type}_${key}`
      
      await prisma.systemSettings.upsert({
        where: { key: settingKey },
        update: { value: String(value) },
        create: {
          key: settingKey,
          value: String(value)
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Configuration saved successfully" 
    })
  } catch (error) {
    console.error("Error saving payroll configuration:", error)
    return NextResponse.json(
      { error: "Failed to save payroll configuration" },
      { status: 500 }
    )
  }
}
