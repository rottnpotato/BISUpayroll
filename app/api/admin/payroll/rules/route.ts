import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

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
      GROUP BY pr.id
      ORDER BY pr."createdAt" ASC
    `

    return NextResponse.json({ rules })
  } catch (error) {
    console.error("Error fetching payroll rules:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll rules" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, amount, isPercentage, description, applyToAll, selectedUserIds } = body

    if (!name || !type || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create the payroll rule using raw SQL to include the new field
    const ruleId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    await prisma.$executeRaw`
      INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
      VALUES (${ruleId}, ${name}, ${type}, ${parseFloat(amount)}, ${isPercentage || false}, true, ${description}, ${applyToAll !== undefined ? applyToAll : true}, NOW(), NOW())
    `

    const rule = { id: ruleId, name, type, amount: parseFloat(amount), isPercentage: isPercentage || false, description, isActive: true, applyToAll: applyToAll !== undefined ? applyToAll : true }

    // If not applying to all users, create user assignments
    if (!applyToAll && selectedUserIds && selectedUserIds.length > 0) {
      for (const userId of selectedUserIds) {
        await prisma.$executeRaw`
          INSERT INTO payroll_rule_assignments (id, "userId", "payrollRuleId", "createdAt")
          VALUES (gen_random_uuid(), ${userId}, ${rule.id}, NOW())
        `
      }
    }

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error("Error creating payroll rule:", error)
    return NextResponse.json(
      { error: "Failed to create payroll rule" },
      { status: 500 }
    )
  }
} 