import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payPeriodStart = searchParams.get("payPeriodStart")
    const payPeriodEnd = searchParams.get("payPeriodEnd")
    const department = searchParams.get("department")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    const where: any = {}

    if (payPeriodStart && payPeriodEnd) {
      where.payPeriodStart = { gte: new Date(payPeriodStart) }
      where.payPeriodEnd = { lte: new Date(payPeriodEnd) }
    }

    if (department && department !== "all") {
      where.user = {
        department: department
      }
    }

    if (userId) {
      where.userId = userId
    }

    if (status) {
      where.status = status
    }

    const results = await prisma.payrollResult.findMany({
      where,
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
      },
      orderBy: [
        { payPeriodStart: 'desc' },
        { user: { lastName: 'asc' } }
      ]
    })

    // Transform results to include applied rules breakdown
    const transformedResults = results.map((result: any) => ({
      ...result,
      appliedRulesBreakdown: result.appliedRules ? JSON.parse(result.appliedRules) : []
    }))

    return NextResponse.json({ results: transformedResults })
  } catch (error) {
    console.error("Error fetching payroll results:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll results" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, isApproved, approvedById } = body

    if (!id) {
      return NextResponse.json(
        { error: "Payroll result ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (status !== undefined) {
      updateData.status = status
    }

    if (isApproved !== undefined) {
      updateData.isApproved = isApproved
      if (isApproved) {
        updateData.approvedAt = new Date()
        if (approvedById) {
          updateData.approvedById = approvedById
        }
      } else {
        updateData.approvedAt = null
        updateData.approvedById = null
      }
    }

    const result = await prisma.payrollResult.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error updating payroll result:", error)
    return NextResponse.json(
      { error: "Failed to update payroll result" },
      { status: 500 }
    )
  }
} 