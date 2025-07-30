import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { 
  calculateCompletePayroll, 
  PayrollCalculationData,
  PayrollCalculationResult 
} from "@/lib/payroll-calculations"

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

    const configs = systemConfigs.reduce((acc: { [x: string]: any }, config: { key: string | number; value: any }) => {
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

    const payrollResults = []
    const errors = []

    // Parse configuration values with defaults
    const configurations = {
      dailyHours: parseFloat(configs['working_hours_dailyHours'] || '8'),
      overtimeRate1: parseFloat(configs['rates_overtimeRate1'] || '1.25'),
      overtimeRate2: parseFloat(configs['rates_overtimeRate2'] || '1.5'),
      nightDifferential: parseFloat(configs['rates_nightDifferential'] || '10'),
      regularHolidayRate: parseFloat(configs['rates_regularHolidayRate'] || '2.0'),
      specialHolidayRate: parseFloat(configs['rates_specialHolidayRate'] || '1.3'),
      lateDeductionAmount: parseFloat(configs['working_hours_lateDeductionAmount'] || '0'),
      lateDeductionBasis: configs['working_hours_lateDeductionBasis'] || 'fixed'
    }

    for (const user of users) {
      try {
        const baseSalary = Number(user.salary)
        
        // Calculate attendance data from records
        let totalHoursWorked = 0
        let overtimeHours = 0
        let lateHours = 0
        let undertimeHours = 0
        let holidayHours = 0
        let nightShiftHours = 0
        let daysWorked = 0

        user.attendanceRecords.forEach((record: any) => {
          if (record.timeIn && record.timeOut) {
            daysWorked++
            const hoursWorked = Number(record.hoursWorked || 0)
            totalHoursWorked += hoursWorked
            
            // Check if overtime (more than daily hours)
            if (hoursWorked > configurations.dailyHours) {
              overtimeHours += hoursWorked - configurations.dailyHours
            }
            
            // Check if undertime (less than daily hours and not absent)
            if (hoursWorked < configurations.dailyHours && !record.isAbsent) {
              undertimeHours += configurations.dailyHours - hoursWorked
            }
            
            if (record.isLate) {
              lateHours += 1 // Simplified: count late instances
            }
            
            // Check for holiday work
            const recordDate = new Date(record.date)
            const holiday = holidays.find((h: any) => {
              const holidayDate = new Date(h.date)
              return holidayDate.toDateString() === recordDate.toDateString()
            })
            
            if (holiday) {
              holidayHours += hoursWorked
            }
            
            // Check for night shift (simplified - you may want to improve this logic)
            const timeIn = new Date(record.timeIn)
            const timeOut = new Date(record.timeOut)
            if (timeIn.getHours() >= 22 || timeIn.getHours() <= 6) {
              nightShiftHours += Math.min(hoursWorked, 8) // Max 8 hours night differential
            }
          }
        })

        // Combine user-specific and global rules
        const userRules = user.payrollRules.map((ur: any) => ur.payrollRule).filter((rule: any) => rule.isActive)
        const allApplicableRules = [...userRules, ...globalRules]

        // Prepare calculation data
        const calculationData: PayrollCalculationData = {
          baseSalary,
          daysWorked,
          hoursWorked: totalHoursWorked,
          overtimeHours,
          lateHours,
          undertimeHours,
          holidayHours,
          nightShiftHours,
          holidayType: 'REGULAR', // Default, could be enhanced
          appliedRules: allApplicableRules,
          configurations
        }

        // Calculate complete payroll using our new utility
        const result: PayrollCalculationResult = calculateCompletePayroll(calculationData)

        // Create PayrollResult record
        const payrollResult = await prisma.payrollResult.create({
          data: {
            userId: user.id,
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            
            // Basic salary information
            baseSalary: baseSalary,
            dailyRate: result.dailyRate,
            hourlyRate: result.hourlyRate,
            
            // Attendance data
            daysWorked,
            hoursWorked: totalHoursWorked,
            overtimeHours,
            undertimeHours,
            lateHours,
            holidayHours,
            nightShiftHours,
            
            // Earnings breakdown
            regularPay: result.regularPay,
            overtimePay: result.overtimePay,
            holidayPay: result.holidayPay,
            nightDifferential: result.nightDifferential,
            allowances: result.allowances,
            bonuses: result.bonuses,
            thirteenthMonthPay: result.thirteenthMonthPay,
            serviceIncentiveLeave: result.serviceIncentiveLeave,
            otherEarnings: result.otherEarnings,
            
            // Gross pay
            grossPay: result.grossPay,
            
            // Mandatory contributions
            gsisContribution: result.gsisContribution,
            philHealthContribution: result.philHealthContribution,
            pagibigContribution: result.pagibigContribution,
            
            // Tax calculations
            taxableIncome: result.taxableIncome,
            withholdingTax: result.withholdingTax,
            
            // Other deductions
            lateDeductions: result.lateDeductions,
            undertimeDeductions: result.undertimeDeductions,
            loanDeductions: result.loanDeductions,
            otherDeductions: result.otherDeductions,
            
            // Totals
            totalEarnings: result.totalEarnings,
            totalDeductions: result.totalDeductions,
            netPay: result.netPay,
            
            // Applied rules as JSON
            appliedRules: JSON.stringify(result.appliedRulesBreakdown),
            
            status: 'GENERATED'
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

        // Also create/update the legacy PayrollRecord for backward compatibility
        const existingPayrollRecord = await prisma.payrollRecord.findFirst({
          where: {
            userId: user.id,
            payPeriodStart: startDate,
            payPeriodEnd: endDate
          }
        })

        if (existingPayrollRecord) {
          await prisma.payrollRecord.update({
            where: { id: existingPayrollRecord.id },
            data: {
              baseSalary: result.regularPay,
              overtime: result.overtimePay,
              deductions: result.totalDeductions,
              bonuses: result.bonuses + result.holidayPay,
              grossPay: result.grossPay,
              netPay: result.netPay,
              isGenerated: true,
              generatedAt: new Date()
            }
          })
        } else {
          await prisma.payrollRecord.create({
            data: {
              userId: user.id,
              payPeriodStart: startDate,
              payPeriodEnd: endDate,
              baseSalary: result.regularPay,
              overtime: result.overtimePay,
              deductions: result.totalDeductions,
              bonuses: result.bonuses + result.holidayPay,
              grossPay: result.grossPay,
              netPay: result.netPay,
              isGenerated: true,
              generatedAt: new Date(),
              isPaid: false
            }
          })
        }

        payrollResults.push(payrollResult)

      } catch (error) {
        console.error(`Error generating payroll for user ${user.id}:`, error)
        errors.push({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return NextResponse.json({
      message: `Generated payroll for ${payrollResults.length} employees`,
      generated: payrollResults.length,
      records: payrollResults,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("Error generating payroll:", error)
    return NextResponse.json(
      { error: "Failed to generate payroll" },
      { status: 500 }
    )
  }
} 