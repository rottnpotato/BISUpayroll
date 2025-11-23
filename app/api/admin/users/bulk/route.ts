import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import bcrypt from "bcryptjs"
import { AuditLogger } from "@/lib/audit-logger"
import { getSalaryGradesByPosition, getDailyRateByGrade } from "@/lib/salary-grades-server"

interface BulkEmployee {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  employeeType: string
  department: string
  position: string
  phone: string
  employeeId: string
  hireDate: string
  status: string
  address: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  salaryGrade?: string
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
        const validEmployeeTypes = ["TEACHING_PERSONNEL", "NON_TEACHING_PERSONNEL", "CASUAL", "PLANTILLA"]
        const employeeType = employee.employeeType && validEmployeeTypes.includes(employee.employeeType.toUpperCase())
          ? employee.employeeType.toUpperCase()
          : null

        // Handle salary grade and daily rate
        let salaryGrade: number | undefined
        let dailyRate: number | undefined

        if (employee.salaryGrade) {
          // Salary grade provided - use it
          salaryGrade = parseInt(employee.salaryGrade)
          dailyRate = await getDailyRateByGrade(salaryGrade)
        } else if (employee.position) {
          // No salary grade but position provided - get lowest grade for position
          const gradesForPosition = await getSalaryGradesByPosition(employee.position)
          if (gradesForPosition.length > 0) {
            // Get the first (lowest rank) salary grade for this position
            salaryGrade = gradesForPosition[0].grade
            dailyRate = gradesForPosition[0].dailyRate
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

    // Return the result
    return NextResponse.json({
      ...result,
      message: `Successfully created ${result.created} employees. ${result.failed} failed.`
    }, { status: result.created > 0 ? 201 : 400 })

  } catch (error) {
    console.error("Error in bulk import:", error)
    return NextResponse.json(
      { error: "Failed to process bulk import" },
      { status: 500 }
    )
  }
}
