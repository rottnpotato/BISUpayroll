import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import bcrypt from "bcryptjs"
import { AuditLogger } from "@/lib/audit-logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const department = searchParams.get("department") || ""
    const status = searchParams.get("status") || ""

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } }
      ]
    }

    if (department) {
      where.department = department
    }

    if (status) {
      where.status = status
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          employeeType: true,
          employeeId: true,
          department: true,
          position: true,
          salaryGrade: true,
          salaryStep: true,
          dailyRate: true,
          hireDate: true,
          phone: true,
          address: true,
          emergencyContactName: true,
          emergencyContactRelationship: true,
          emergencyContactPhone: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      employeeType,
      employeeId,
      department,
      position,
      salaryGrade,
      dailyRate,
      hireDate,
      phone,
      address,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      status
    } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate employeeType if provided
    const validEmployeeTypes = ['TEACHING_PERSONNEL', 'NON_TEACHING_PERSONNEL', 'CASUAL_PLANTILLA']
    if (employeeType && employeeType !== "" && !validEmployeeTypes.includes(employeeType)) {
      return NextResponse.json(
        { error: `Invalid employee type. Must be one of: ${validEmployeeTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['PERMANENT', 'TEMPORARY', 'CONTRACTUAL', 'INACTIVE']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid employment status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Check if employeeId is unique
    if (employeeId) {
      const existingEmployee = await prisma.user.findUnique({
        where: { employeeId }
      })

      if (existingEmployee) {
        return NextResponse.json(
          { error: "Employee ID already exists" },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || "EMPLOYEE",
        employeeType: employeeType && employeeType !== "" ? employeeType : null,
        employeeId,
        department,
        position,
        salaryGrade: salaryGrade ? parseInt(salaryGrade) : null,
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        hireDate: hireDate ? new Date(hireDate) : null,
        phone,
        address,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        status: status || "CONTRACTUAL"
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeType: true,
        employeeId: true,
        department: true,
        position: true,
        salaryGrade: true,
        dailyRate: true,
        hireDate: true,
        phone: true,
        createdAt: true
      }
    })

    // Log the user creation
    await AuditLogger.logUser(
      user.id, // For now using the created user as the actor, should be replaced with the actual admin user ID
      'create',
      user.id,
      request,
      `New ${user.role.toLowerCase()} user created: ${user.firstName} ${user.lastName} (${user.email})`
    )

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
} 