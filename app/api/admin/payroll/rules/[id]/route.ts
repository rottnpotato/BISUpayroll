import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const rules = await prisma.$queryRaw`
      SELECT 
        pr.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pra.id,
              'userId', pra."userId",
              'user', JSON_BUILD_OBJECT(
                'id', u.id,
                'firstName', u."firstName",
                'lastName', u."lastName",
                'employeeId', u."employeeId",
                'department', u.department
              )
            )
          ) FILTER (WHERE pra.id IS NOT NULL),
          '[]'::json
        ) as "assignedUsers"
      FROM payroll_rules pr
      LEFT JOIN payroll_rule_assignments pra ON pr.id = pra."payrollRuleId"
      LEFT JOIN users u ON pra."userId" = u.id
      WHERE pr.id = ${id}
      GROUP BY pr.id
    `
    
    const rule = Array.isArray(rules) ? rules[0] : null

    if (!rule) {
      return NextResponse.json(
        { error: "Payroll rule not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Error fetching payroll rule:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll rule" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, type, amount, isPercentage, isActive, description, applyToAll, selectedUserIds } = body

    if (!name || !type || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update the payroll rule using raw SQL
    await prisma.$executeRaw`
      UPDATE payroll_rules 
      SET name = ${name}, type = ${type}, amount = ${parseFloat(amount)}, 
          "isPercentage" = ${isPercentage || false}, "isActive" = ${isActive !== undefined ? isActive : true}, 
          description = ${description}, "applyToAll" = ${applyToAll !== undefined ? applyToAll : true},
          "updatedAt" = NOW()
      WHERE id = ${id}
    `

    // Delete existing user assignments
    await prisma.$executeRaw`
      DELETE FROM payroll_rule_assignments WHERE "payrollRuleId" = ${id}
    `

    // If not applying to all users, create new user assignments
    if (!applyToAll && selectedUserIds && selectedUserIds.length > 0) {
      for (const userId of selectedUserIds) {
        await prisma.$executeRaw`
          INSERT INTO payroll_rule_assignments (id, "userId", "payrollRuleId", "createdAt")
          VALUES (gen_random_uuid(), ${userId}, ${id}, NOW())
        `
      }
    }

    const rule = { 
      id, 
      name, 
      type, 
      amount: parseFloat(amount), 
      isPercentage: isPercentage || false, 
      isActive: isActive !== undefined ? isActive : true, 
      description, 
      applyToAll: applyToAll !== undefined ? applyToAll : true 
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Error updating payroll rule:", error)
    return NextResponse.json(
      { error: "Failed to update payroll rule" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    await prisma.payrollRule.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting payroll rule:", error)
    return NextResponse.json(
      { error: "Failed to delete payroll rule" },
      { status: 500 }
    )
  }
} 