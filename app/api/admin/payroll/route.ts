import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const isPaid = searchParams.get("isPaid")
    const department = searchParams.get("department")

    const skip = (page - 1) * limit

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (startDate && endDate) {
      where.payPeriodStart = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (isPaid !== null && isPaid !== undefined) {
      where.isPaid = isPaid === "true"
    }

    if (department) {
      where.user = {
        department: department
      }
    }

    const [records, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: { payPeriodStart: "desc" }
      }),
      prisma.payrollRecord.count({ where })
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching payroll records:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll records" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      payPeriodStart,
      payPeriodEnd,
      baseSalary,
      overtime,
      deductions,
      bonuses
    } = body

    if (!userId || !payPeriodStart || !payPeriodEnd || !baseSalary) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if payroll record already exists for this period
    const existingRecord = await prisma.payrollRecord.findFirst({
      where: {
        userId,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd)
      }
    })

    if (existingRecord) {
      return NextResponse.json(
        { error: "Payroll record already exists for this period" },
        { status: 409 }
      )
    }

    // Calculate gross and net pay
    const overtimeAmount = overtime || 0
    const deductionAmount = deductions || 0
    const bonusAmount = bonuses || 0
    
    const grossPay = parseFloat(baseSalary) + overtimeAmount + bonusAmount
    const netPay = grossPay - deductionAmount

    const record = await prisma.payrollRecord.create({
      data: {
        userId,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd),
        baseSalary: parseFloat(baseSalary),
        overtime: overtimeAmount,
        deductions: deductionAmount,
        bonuses: bonusAmount,
        grossPay,
        netPay
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

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error("Error creating payroll record:", error)
    return NextResponse.json(
      { error: "Failed to create payroll record" },
      { status: 500 }
    )
  }
} 