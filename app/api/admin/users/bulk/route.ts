import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import bcrypt from "bcryptjs"
import { AuditLogger } from "@/lib/audit-logger"
import { getDailyRateByGradeAndStep } from "@/lib/salary-grades-server"

// Helper to convert Roman numeral to number
function romanToNumber(roman: string): number | null {
  const romanNumerals: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8
  }
  return romanNumerals[roman.toUpperCase()] || null
}

interface BulkEmployee {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  employeeType: string
  department: string
  position: string
  rank: string  // Roman numeral rank (e.g., "I", "II", "III")
  step: string  // Step within salary grade (1-8)
  phone: string
  employeeId: string
  hireDate: string
  status: string
  address: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  salaryGrade?: string  // Legacy support
  dailyRate?: string
}

interface BulkImportResult {
  created: number
  failed: number
  errors: Array<{
    email: string
    employeeId: string
    error: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employees } = body as { employees: BulkEmployee[] }

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { error: "No employees provided" },
        { status: 400 }
      )
    }

    const result: BulkImportResult = {
      created: 0,
      failed: 0,
      errors: []
    }

    // Process each employee
    for (const employee of employees) {
      try {
        // Validate required fields
        if (!employee.email || !employee.password || !employee.firstName || !employee.lastName) {
          result.failed++
          result.errors.push({
            email: employee.email || "unknown",
            employeeId: employee.employeeId || "unknown",
            error: "Missing required fields"
          })
          continue
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: employee.email },
              ...(employee.employeeId ? [{ employeeId: employee.employeeId }] : [])
            ]
          }
        })

        if (existingUser) {
          result.failed++
          result.errors.push({
            email: employee.email,
            employeeId: employee.employeeId,
            error: existingUser.email === employee.email 
              ? "Email already exists" 
              : "Employee ID already exists"
          })
          continue
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(employee.password, 12)

        // Validate and map employment status
        const statusMap: { [key: string]: "PERMANENT" | "TEMPORARY" | "CONTRACTUAL" } = {
          "PERMANENT": "PERMANENT",
          "TEMPORARY": "TEMPORARY",
          "CONTRACTUAL": "CONTRACTUAL"
        }
        const employmentStatus = employee.status && statusMap[employee.status.toUpperCase()] 
          ? statusMap[employee.status.toUpperCase()] 
          : "CONTRACTUAL"

        // Validate employee type if provided
        const validEmployeeTypes = ["TEACHING_PERSONNEL", "NON_TEACHING_PERSONNEL", "CASUAL_PLANTILLA"]
        const employeeType = employee.employeeType && validEmployeeTypes.includes(employee.employeeType.toUpperCase())
          ? employee.employeeType.toUpperCase()
          : null

        // Handle salary grade and daily rate lookup using position, rank, and step
        let salaryGrade: number | undefined
        let salaryStep: number | undefined
        let dailyRate: number | undefined

        if (employee.position && employee.rank && employee.step) {
          // Convert rank from Roman numeral to number
          const rankNumber = romanToNumber(employee.rank)
          const stepNumber = parseInt(employee.step) || 1

          if (rankNumber) {
            // Look up the salary grade from the database using position, rank, and step
            const salaryGradeRecord = await prisma.salaryGrade.findFirst({
              where: {
                position: employee.position,
                rank: rankNumber,
                step: stepNumber,
                isActive: true
              }
            })

            if (salaryGradeRecord) {
              salaryGrade = salaryGradeRecord.grade
              salaryStep = salaryGradeRecord.step
              dailyRate = Number(salaryGradeRecord.dailyRate)
            } else {
              // Salary grade not found - record error
              result.failed++
              result.errors.push({
                email: employee.email,
                employeeId: employee.employeeId,
                error: `Salary grade not found for position: ${employee.position}, rank: ${employee.rank}, step: ${employee.step}`
              })
              continue
            }
          }
        } else if (employee.position && employee.rank) {
          // Position and rank provided but no step - default to step 1
          const rankNumber = romanToNumber(employee.rank)
          const stepNumber = 1

          if (rankNumber) {
            const salaryGradeRecord = await prisma.salaryGrade.findFirst({
              where: {
                position: employee.position,
                rank: rankNumber,
                step: stepNumber,
                isActive: true
              }
            })

            if (salaryGradeRecord) {
              salaryGrade = salaryGradeRecord.grade
              salaryStep = salaryGradeRecord.step
              dailyRate = Number(salaryGradeRecord.dailyRate)
            } else {
              result.failed++
              result.errors.push({
                email: employee.email,
                employeeId: employee.employeeId,
                error: `Salary grade not found for position: ${employee.position}, rank: ${employee.rank}`
              })
              continue
            }
          }
        } else if (employee.position) {
          // Only position provided - get the lowest rank and step 1
          const salaryGradeRecord = await prisma.salaryGrade.findFirst({
            where: {
              position: employee.position,
              isActive: true
            },
            orderBy: [
              { rank: 'asc' },
              { step: 'asc' }
            ]
          })

          if (salaryGradeRecord) {
            salaryGrade = salaryGradeRecord.grade
            salaryStep = salaryGradeRecord.step
            dailyRate = Number(salaryGradeRecord.dailyRate)
          }
        }

        // Create user
        const user = await prisma.user.create({
          data: {
            email: employee.email,
            password: hashedPassword,
            firstName: employee.firstName,
            lastName: employee.lastName,
            role: "EMPLOYEE",
            status: employmentStatus,
            employeeType: employeeType as any,
            employeeId: employee.employeeId || undefined,
            department: employee.department || undefined,
            position: employee.position || undefined,
            salaryGrade: salaryGrade,
            salaryStep: salaryStep,
            dailyRate: dailyRate,
            hireDate: employee.hireDate ? new Date(employee.hireDate) : undefined,
            phone: employee.phone || undefined,
            address: employee.address || undefined,
            emergencyContactName: employee.emergencyContactName || undefined,
            emergencyContactRelationship: employee.emergencyContactRelationship || undefined,
            emergencyContactPhone: employee.emergencyContactPhone || undefined
          }
        })

        // Log the user creation
        await AuditLogger.logUser(
          user.id,
          'create',
          user.id,
          request,
          `Bulk import: New ${user.role.toLowerCase()} user created: ${user.firstName} ${user.lastName} (${user.email})`
        )

        result.created++
      } catch (error) {
        console.error(`Error creating user ${employee.email}:`, error)
        result.failed++
        result.errors.push({
          email: employee.email,
          employeeId: employee.employeeId,
          error: error instanceof Error ? error.message : "Failed to create user"
        })
      }
    }

    // Return the result with detailed feedback
    const message = result.created > 0
      ? `Successfully imported ${result.created} employee${result.created !== 1 ? 's' : ''}.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`
      : `Import failed. ${result.failed} employee${result.failed !== 1 ? 's' : ''} could not be imported.`

    return NextResponse.json({
      ...result,
      message,
      success: result.created > 0
    }, { status: result.created > 0 ? 201 : 400 })

  } catch (error) {
    console.error("Error in bulk import:", error)
    return NextResponse.json(
      { error: "Failed to process bulk import" },
      { status: 500 }
    )
  }
}
