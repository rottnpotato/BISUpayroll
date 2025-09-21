import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { 
  calculateCompletePayroll, 
  PayrollCalculationData,
  PayrollCalculationResult,
  calculateBaseSalaryFromRules
} from "@/lib/payroll-calculations"
import { encryptPayrollFile, createSecureDirectory } from "@/lib/crypto-utils"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import fs from 'fs'
import path from 'path'

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
      status: "ACTIVE"
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
            message: "Check if users have role 'EMPLOYEE' and status 'ACTIVE'"
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
      regularHolidayRate: parseFloat(configs['rates_regularHolidayRate'] || '2.0'),
      specialHolidayRate: parseFloat(configs['rates_specialHolidayRate'] || '1.3'),
      lateDeductionAmount: parseFloat(configs['working_hours_lateDeductionAmount'] || '0'),
      lateDeductionBasis: configs['working_hours_lateDeductionBasis'] || 'fixed'
    }

    for (const user of users) {
      try {
        // Determine base salary from applicable rules
        const baseSalary = calculateBaseSalaryFromRules([
          ...user.payrollRules.map(ur => ur.payrollRule),
          ...globalRules
        ])
        
        // Calculate attendance data from records
        let totalHoursWorked = 0
        let overtimeHours = 0
        let lateHours = 0
        let undertimeHours = 0
        let holidayHours = 0
  // Night shift removed
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
            
            // Night shift removed
          }
        })

        // Combine user-specific and global rules
  const userSpecificRules = user.payrollRules.map((ur: any) => ur.payrollRule).filter((rule: any) => rule.isActive)
  const allApplicableRules = [...userSpecificRules, ...globalRules]

        // Prepare calculation data
        const calculationData: PayrollCalculationData = {
          baseSalary,
          daysWorked,
          hoursWorked: totalHoursWorked,
          overtimeHours,
          lateHours,
          undertimeHours,
          holidayHours,
          // Night shift removed from calculation input
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
            nightShiftHours: 0,
            
            // Earnings breakdown
            regularPay: result.regularPay,
            overtimePay: result.overtimePay,
            holidayPay: result.holidayPay,
            nightDifferential: 0,
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
                position: true
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

    // Generate and encrypt payroll file
    let payrollFileRecord = null
    if (payrollResults.length > 0) {
      try {
        // Create payroll summary data
        const payrollSummary = {
          payPeriodStart: startDate.toISOString(),
          payPeriodEnd: endDate.toISOString(),
          generatedAt: new Date().toISOString(),
          department: department || 'All Departments',
          employees: payrollResults.map((result: any) => ({
            employeeId: result.user?.employeeId || 'N/A',
            name: `${result.user?.firstName || ''} ${result.user?.lastName || ''}`.trim(),
            department: result.user?.department || 'Unassigned',
            position: result.user?.position || 'N/A',
            baseSalary: Number(result.baseSalary),
            grossPay: Number(result.grossPay),
            netPay: Number(result.netPay),
            totalDeductions: Number(result.totalDeductions),
            regularPay: Number(result.regularPay),
            overtimePay: Number(result.overtimePay),
            holidayPay: Number(result.holidayPay),
            allowances: Number(result.allowances),
            bonuses: Number(result.bonuses),
            deductions: {
              gsisContribution: Number(result.gsisContribution),
              philHealthContribution: Number(result.philHealthContribution),
              pagibigContribution: Number(result.pagibigContribution),
              withholdingTax: Number(result.withholdingTax),
              lateDeductions: Number(result.lateDeductions),
              loanDeductions: Number(result.loanDeductions),
              otherDeductions: Number(result.otherDeductions)
            }
          })),
          totals: {
            totalGrossPay: payrollResults.reduce((sum, r) => sum + Number(r.grossPay), 0),
            totalNetPay: payrollResults.reduce((sum, r) => sum + Number(r.netPay), 0),
            totalDeductions: payrollResults.reduce((sum, r) => sum + Number(r.totalDeductions), 0)
          }
        }

        // Create temporary file
        const tempDir = path.join(process.cwd(), 'temp')
        await fs.promises.mkdir(tempDir, { recursive: true })
        
        const timestamp = Date.now()
        const tempFileName = `payroll_${department || 'all'}_${timestamp}.json`
        const tempFilePath = path.join(tempDir, tempFileName)
        
        await fs.promises.writeFile(tempFilePath, JSON.stringify(payrollSummary, null, 2))

        // Encrypt and store the file
        const encryptionResult = await encryptPayrollFile(
          tempFilePath,
          tempFileName,
          { start: startDate, end: endDate },
          department
        )

        // Get current user from auth cookie; fallback to any ADMIN user
        let currentUserId: string | null = null
        try {
          const cookieStore = await cookies()
          const token = cookieStore.get('auth-token')?.value
          if (token) {
            const user = await verifyToken(token)
            if (user?.id) currentUserId = user.id
          }
        } catch (e) {
          console.warn('Could not resolve current user from token, will try fallback admin user')
        }
        if (!currentUserId) {
          const fallbackAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } })
          if (fallbackAdmin?.id) {
            currentUserId = fallbackAdmin.id
          } else if (users.length > 0) {
            // last resort: use the first employee in this batch to satisfy FK constraint
            currentUserId = users[0].id
          } else {
            // if still null, abort file record creation to avoid FK failure
            console.warn('No user available to set as generatedBy; skipping PayrollFile record creation')
          }
        }

        // Create PayrollFile record
        if (currentUserId) {
          payrollFileRecord = await prisma.payrollFile.create({
            data: {
            fileName: encryptionResult.metadata.originalFileName,
            filePath: encryptionResult.encryptedFilePath,
            fileSize: encryptionResult.metadata.fileSize,
            fileType: 'json',
            reportType: 'monthly',
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
              generatedBy: currentUserId,
            department: department || null,
            employeeCount: payrollResults.length,
            totalGrossPay: payrollSummary.totals.totalGrossPay,
            totalNetPay: payrollSummary.totals.totalNetPay,
            totalDeductions: payrollSummary.totals.totalDeductions,
            status: 'GENERATED',
            metadata: JSON.stringify({
              encryptedAt: encryptionResult.metadata.encryptedAt,
              checksum: encryptionResult.metadata.checksum,
              originalFileName: encryptionResult.metadata.originalFileName
            }),
            checksum: encryptionResult.metadata.checksum
            }
          })
        }

        console.log(`Payroll file encrypted and stored: ${encryptionResult.encryptedFilePath}`)
      } catch (fileError) {
        console.error('Error creating payroll file:', fileError)
        // Don't fail the entire operation if file creation fails
      }
    }

    return NextResponse.json({
      message: `Generated payroll for ${payrollResults.length} employees`,
      generated: payrollResults.length,
      records: payrollResults,
      errors: errors.length > 0 ? errors : undefined,
      payrollFile: payrollFileRecord ? {
        id: payrollFileRecord.id,
        fileName: payrollFileRecord.fileName,
        isEncrypted: true,
        generatedAt: payrollFileRecord.generatedAt
      } : null
    })

  } catch (error) {
    console.error("Error generating payroll:", error)
    return NextResponse.json(
      { error: "Failed to generate payroll" },
      { status: 500 }
    )
  }
} 