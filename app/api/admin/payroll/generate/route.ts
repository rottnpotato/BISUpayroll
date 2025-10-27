import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { encryptPayrollFile } from "@/lib/crypto-utils"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import fs from 'fs'
import path from 'path'
import { PayrollResultStatus, EmploymentStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payPeriodStart, payPeriodEnd, userIds, department, role, employmentStatus } = body as {
      payPeriodStart: string
      payPeriodEnd: string
      userIds?: string[]
      department?: string
      role?: string
      employmentStatus?: string
    }

    if (!payPeriodStart || !payPeriodEnd) {
      return NextResponse.json(
        { error: "Pay period start and end dates are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(payPeriodStart)
    const endDate = new Date(payPeriodEnd)

    // Get users to generate payroll for
    const whereClause: any = {}

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

    // Filter by employment status if specified; otherwise exclude INACTIVE by default
    const validEmploymentStatuses = Object.values(EmploymentStatus)
    if (employmentStatus && typeof employmentStatus === 'string' && validEmploymentStatuses.includes(employmentStatus as EmploymentStatus)) {
      whereClause.status = employmentStatus as EmploymentStatus
    } else {
      // Default behavior: exclude INACTIVE users from payroll generation
      whereClause.status = { not: EmploymentStatus.INACTIVE }
    }

    if (userIds && userIds.length > 0) {
      whereClause.id = { in: userIds }
    }

    console.log("Payroll generation whereClause:", whereClause)

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        position: true,
        status: true,
        role: true
      }
    })

    console.log(`Found ${users.length} users for payroll generation`)

    if (users.length === 0) {
      return NextResponse.json(
        { 
          error: "No eligible users found for payroll generation",
          debug: {
            whereClause,
            message: "Check if users have role 'EMPLOYEE' and are not INACTIVE, or match the selected employment status"
          }
        },
        { status: 400 }
      )
    }

    const payrollResults = []
    const errors = []

    // Use stored procedure to calculate payroll for each user
    for (const user of users) {
      try {
        // Call stored procedure for payroll calculation
        const calculation = await prisma.$queryRaw<any[]>`
          SELECT * FROM calculate_payroll_for_period(
            ${user.id}::text,
            ${startDate}::date,
            ${endDate}::date
          )
        `

        if (!calculation || calculation.length === 0) {
          throw new Error('No payroll calculation returned from stored procedure')
        }

        const calc = calculation[0]
        
        // Ensure required fields have valid values
        const dailyRate = calc.daily_rate || 0
        const hourlyRate = calc.hourly_rate || (dailyRate / 8) || 0
        const regularPay = calc.regular_pay || 0
        const totalEarnings = calc.total_earnings || 0
        const grossPay = calc.gross_pay || 0
        const totalDeductions = calc.total_deductions || 0
        const netPay = calc.net_pay || 0
        
        // Upsert PayrollResult record
        const payrollResult = await prisma.payrollResult.upsert({
          where: {
            userId_payPeriodStart_payPeriodEnd: {
              userId: calc.user_id,
              payPeriodStart: startDate,
              payPeriodEnd: endDate
            }
          },
          create: {
            user: {
              connect: { id: calc.user_id }
            },
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            dailyRate: dailyRate,
            hourlyRate: hourlyRate,
            daysWorked: calc.days_worked || 0,
            hoursWorked: calc.hours_worked || 0,
            overtimeHours: calc.overtime_hours || 0,
            undertimeHours: calc.undertime_hours || 0,
            lateHours: calc.late_hours || 0,
            holidayHours: calc.holiday_hours || 0,
            nightShiftHours: 0,
            regularPay: regularPay,
            overtimePay: calc.overtime_pay || 0,
            holidayPay: calc.holiday_pay || 0,
            nightDifferential: 0,
            allowances: calc.allowances || 0,
            bonuses: calc.bonuses || 0,
            thirteenthMonthPay: calc.thirteenth_month_pay || 0,
            serviceIncentiveLeave: calc.service_incentive_leave || 0,
            otherEarnings: calc.other_earnings || 0,
            totalEarnings: totalEarnings,
            grossPay: grossPay,
            gsisContribution: calc.gsis_contribution || 0,
            philHealthContribution: calc.philhealth_contribution || 0,
            pagibigContribution: calc.pagibig_contribution || 0,
            taxableIncome: calc.taxable_income || 0,
            withholdingTax: calc.withholding_tax || 0,
            lateDeductions: calc.late_deductions || 0,
            undertimeDeductions: calc.undertime_deductions || 0,
            loanDeductions: calc.loan_deductions || 0,
            otherDeductions: calc.other_deductions || 0,
            totalDeductions: totalDeductions,
            netPay: netPay,
            status: PayrollResultStatus.GENERATED,
            appliedRules: '[]'
          },
          update: {
            user: {
              connect: { id: calc.user_id }
            },
            dailyRate: dailyRate,
            hourlyRate: hourlyRate,
            daysWorked: calc.days_worked || 0,
            hoursWorked: calc.hours_worked || 0,
            overtimeHours: calc.overtime_hours || 0,
            undertimeHours: calc.undertime_hours || 0,
            lateHours: calc.late_hours || 0,
            holidayHours: calc.holiday_hours || 0,
            regularPay: regularPay,
            overtimePay: calc.overtime_pay || 0,
            holidayPay: calc.holiday_pay || 0,
            allowances: calc.allowances || 0,
            bonuses: calc.bonuses || 0,
            thirteenthMonthPay: calc.thirteenth_month_pay || 0,
            serviceIncentiveLeave: calc.service_incentive_leave || 0,
            otherEarnings: calc.other_earnings || 0,
            totalEarnings: totalEarnings,
            grossPay: grossPay,
            gsisContribution: calc.gsis_contribution || 0,
            philHealthContribution: calc.philhealth_contribution || 0,
            pagibigContribution: calc.pagibig_contribution || 0,
            taxableIncome: calc.taxable_income || 0,
            withholdingTax: calc.withholding_tax || 0,
            lateDeductions: calc.late_deductions || 0,
            undertimeDeductions: calc.undertime_deductions || 0,
            loanDeductions: calc.loan_deductions || 0,
            otherDeductions: calc.other_deductions || 0,
            totalDeductions: totalDeductions,
            netPay: netPay,
            updatedAt: new Date()
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
                status: true
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
              overtime: calc.overtime_pay || 0,
              deductions: totalDeductions,
              bonuses: (calc.bonuses || 0) + (calc.holiday_pay || 0),
              grossPay: grossPay,
              netPay: netPay,
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
              overtime: calc.overtime_pay || 0,
              deductions: totalDeductions,
              bonuses: (calc.bonuses || 0) + (calc.holiday_pay || 0),
              grossPay: grossPay,
              netPay: netPay,
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
          employmentStatus: (employmentStatus && validEmploymentStatuses.includes(employmentStatus as EmploymentStatus)) ? employmentStatus : 'All Statuses',
          employees: payrollResults.map((result: any) => ({
            employeeId: result.user?.employeeId || 'N/A',
            name: `${result.user?.firstName || ''} ${result.user?.lastName || ''}`.trim(),
            department: result.user?.department || 'Unassigned',
            position: result.user?.position || 'N/A',
            dailyRate: Number(result.dailyRate),
            hourlyRate: Number(result.hourlyRate),
            daysPresent: Number(result.daysWorked),
            hoursWorked: Number(result.hoursWorked),
            totalEarnings: Number(result.totalEarnings),
            grossPay: Number(result.grossPay),
            netPay: Number(result.netPay),
            totalDeductions: Number(result.totalDeductions),
            regularPay: Number(result.regularPay),
            overtimePay: Number(result.overtimePay),
            holidayPay: Number(result.holidayPay),
            allowances: Number(result.allowances),
            bonuses: Number(result.bonuses),
            thirteenthMonthPay: Number(result.thirteenthMonthPay),
            serviceIncentiveLeave: Number(result.serviceIncentiveLeave),
            otherEarnings: Number(result.otherEarnings),
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
  const statusSlug = (employmentStatus && validEmploymentStatuses.includes(employmentStatus as EmploymentStatus)) ? (employmentStatus as string).toLowerCase() : 'all'
  const tempFileName = `payroll_${department || 'all'}_${statusSlug}_${timestamp}.json`
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
              originalFileName: encryptionResult.metadata.originalFileName,
              employmentStatus: (employmentStatus && validEmploymentStatuses.includes(employmentStatus as EmploymentStatus)) ? employmentStatus : 'all'
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