import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payPeriodStart, payPeriodEnd, userIds, department, role } = body

    if (!payPeriodStart || !payPeriodEnd) {
      return NextResponse.json(
        { error: "Pay period start and end dates are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(payPeriodStart)
    const endDate = new Date(payPeriodEnd)

    // Get system configurations for payroll calculations
    const systemConfigs = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
            'working_hours_dailyHours',
            'working_hours_weeklyHours',
            'working_hours_lateGraceMinutes',
            'working_hours_lateDeductionBasis',
            'working_hours_lateDeductionAmount',
            'rates_overtimeRate1',
            'rates_overtimeRate2',
            'rates_nightDifferential',
            'rates_regularHolidayRate',
            'rates_specialHolidayRate',
            'rates_currency'
          ]
        }
      }
    })

    const configs = systemConfigs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, string>)

    // Get holidays within the pay period
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Get users to generate payroll for
    const whereClause: any = {
      status: "ACTIVE",
      salary: { not: null }
    }

    // Filter by role (default to EMPLOYEE for payroll)
    if (role) {
      whereClause.role = role
    } else {
      whereClause.role = "EMPLOYEE"
    }

    // Filter by department if specified
    if (department && department !== "all") {
      whereClause.department = department
    }

    if (userIds && userIds.length > 0) {
      whereClause.id = { in: userIds }
    }

    console.log("Payroll generation whereClause:", whereClause)

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        attendanceRecords: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        payrollRules: {
          include: {
            payrollRule: true
          }
        }
      }
    })

    // Also get global payroll rules that apply to all users
    const globalRules = await prisma.payrollRule.findMany({
      where: {
        applyToAll: true,
        isActive: true
      }
    })

    console.log(`Found ${users.length} users for payroll generation`)

    if (users.length === 0) {
      return NextResponse.json(
        { 
          error: "No eligible users found for payroll generation",
          debug: {
            whereClause,
            message: "Check if users have role 'EMPLOYEE', status 'ACTIVE', and salary not null"
          }
        },
        { status: 400 }
      )
    }

    const payrollRecords = []
    const errors = []

    // Parse configuration values
    const dailyHours = parseFloat(configs['working_hours_dailyHours'] || '8')
    const overtimeRate1 = parseFloat(configs['rates_overtimeRate1'] || '1.25')
    const overtimeRate2 = parseFloat(configs['rates_overtimeRate2'] || '1.5')
    const regularHolidayRate = parseFloat(configs['rates_regularHolidayRate'] || '2.0')
    const specialHolidayRate = parseFloat(configs['rates_specialHolidayRate'] || '1.3')
    const lateDeductionAmount = parseFloat(configs['working_hours_lateDeductionAmount'] || '0')
    const lateDeductionBasis = configs['working_hours_lateDeductionBasis'] || 'fixed'

    for (const user of users) {
      try {
        // Check if payroll already exists for this period
        const existingPayroll = await prisma.payrollRecord.findFirst({
          where: {
            userId: user.id,
            payPeriodStart: startDate,
            payPeriodEnd: endDate
          }
        })

        if (existingPayroll) {
          errors.push(`Payroll already exists for ${user.firstName} ${user.lastName}`)
          continue
        }

        // Calculate attendance metrics
        const totalHoursWorked = user.attendanceRecords.reduce((sum: number, record: any) => {
          return sum + (Number(record.hoursWorked) || 0)
        }, 0)

        const lateCount = user.attendanceRecords.filter((record: any) => record.isLate).length
        const absentCount = user.attendanceRecords.filter((record: any) => record.isAbsent).length
        const workDays = user.attendanceRecords.filter((record: any) => !record.isAbsent).length

        // Calculate expected hours and overtime
        const expectedTotalHours = workDays * dailyHours
        const regularHours = Math.min(totalHoursWorked, expectedTotalHours)
        const overtimeHours = Math.max(0, totalHoursWorked - expectedTotalHours)

        // Calculate salary rates
        const monthlySalary = Number(user.salary)
        const dailyRate = monthlySalary / 22 // Standard working days per month
        const hourlyRate = dailyRate / dailyHours

        // Calculate regular pay
        let regularPay = regularHours * hourlyRate

        // Calculate holiday pay
        let holidayPay = 0
        user.attendanceRecords.forEach((record: any) => {
          const recordDate = new Date(record.date)
          const holiday = holidays.find((h: any) => {
            const holidayDate = new Date(h.date)
            return holidayDate.toDateString() === recordDate.toDateString()
          })

          if (holiday && record.hoursWorked) {
            const hoursWorked = Number(record.hoursWorked)
            if (holiday.type === 'REGULAR') {
              holidayPay += hoursWorked * hourlyRate * (regularHolidayRate - 1) // Additional pay
            } else if (holiday.type === 'SPECIAL') {
              holidayPay += hoursWorked * hourlyRate * (specialHolidayRate - 1) // Additional pay
            }
          }
        })

        // Calculate overtime pay (different rates for different overtime hours)
        let overtimePay = 0
        if (overtimeHours > 0) {
          const firstOvertimeHours = Math.min(overtimeHours, 2) // First 2 hours at rate1
          const secondOvertimeHours = Math.max(0, overtimeHours - 2) // Remaining hours at rate2
          
          overtimePay = (firstOvertimeHours * hourlyRate * overtimeRate1) + 
                       (secondOvertimeHours * hourlyRate * overtimeRate2)
        }

        // Calculate base gross pay
        const baseGrossPay = regularPay + overtimePay + holidayPay

        // Apply payroll rules for bonuses and allowances
        let bonuses = 0
        const userRules = user.payrollRules.map((ur: any) => ur.payrollRule).filter((rule: any) => rule.isActive)
        const allApplicableRules = [...userRules, ...globalRules]

        allApplicableRules.forEach((rule: any) => {
          if (rule.type === 'bonus' || rule.type === 'allowance') {
            const amount = Number(rule.amount)
            if (rule.isPercentage) {
              bonuses += baseGrossPay * amount / 100
            } else {
              bonuses += amount
            }
          }
        })

        const grossPay = baseGrossPay + bonuses

        // Calculate deductions
        let totalDeductions = 0

        // Apply payroll rules for deductions
        allApplicableRules.forEach((rule: any) => {
          if (rule.type === 'deduction') {
            const amount = Number(rule.amount)
            if (rule.isPercentage) {
              totalDeductions += grossPay * amount / 100
            } else {
              totalDeductions += amount
            }
          }
        })

        // Calculate late deductions
        let lateDeductions = 0
        if (lateCount > 0) {
          if (lateDeductionBasis === 'fixed') {
            lateDeductions = lateCount * lateDeductionAmount
          } else if (lateDeductionBasis === 'hourly') {
            lateDeductions = lateCount * hourlyRate * lateDeductionAmount
          } else if (lateDeductionBasis === 'daily') {
            lateDeductions = lateCount * dailyRate * lateDeductionAmount
          }
        }

        totalDeductions += lateDeductions

        const netPay = Math.max(0, grossPay - totalDeductions)

        const payrollRecord = await prisma.payrollRecord.create({
          data: {
            userId: user.id,
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            baseSalary: regularPay,
            overtime: overtimePay,
            deductions: totalDeductions,
            bonuses: bonuses + holidayPay,
            grossPay: grossPay,
            netPay: netPay,
            isGenerated: true,
            generatedAt: new Date(),
            isPaid: false
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: true,
                position: true,
                salary: true
              }
            }
          }
        })

        payrollRecords.push({
          ...payrollRecord,
          calculationDetails: {
            totalHoursWorked,
            regularHours,
            overtimeHours,
            holidayPay,
            lateCount,
            absentCount,
            workDays,
            lateDeductions,
            hourlyRate,
            dailyRate,
            appliedRules: allApplicableRules.length
          }
        })
      } catch (error: any) {
        console.error(`Error generating payroll for user ${user.id}:`, error)
        errors.push(`Failed to generate payroll for ${user.firstName} ${user.lastName}: ${error?.message || 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      generated: payrollRecords.length,
      records: payrollRecords,
      errors: errors,
      summary: {
        totalUsers: users.length,
        successfulGenerations: payrollRecords.length,
        errors: errors.length,
        holidaysInPeriod: holidays.length,
        configsUsed: Object.keys(configs).length
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error generating bulk payroll:", error)
    return NextResponse.json(
      { error: "Failed to generate payroll records", details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 