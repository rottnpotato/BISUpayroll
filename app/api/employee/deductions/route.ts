import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/employee/deductions
 * Get all deductions for the authenticated employee
 * Includes both employee-created and system-assigned payroll rules
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all applicable payroll rules for this user
    // This includes both employee-specific AND global rules
    // Filter only deduction-type rules
    const allDeductions = await prisma.payrollRule.findMany({
      where: {
        type: 'deduction', // Only get deduction-type rules
        OR: [
          { applyToAll: true },
          {
            assignedUsers: {
              some: {
                userId: user.id
              }
            }
          }
        ],
        isActive: true
      },
      include: {
        assignedUsers: {
          where: {
            userId: user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Categorize deductions
    const employeeDeductions = allDeductions.filter(d => 
      d.createdByRole === 'EMPLOYEE' && !d.applyToAll
    )

    const systemDeductions = allDeductions.filter(d => 
      d.createdByRole !== 'EMPLOYEE' || d.applyToAll
    )

    return NextResponse.json({
      success: true,
      deductions: employeeDeductions,
      systemDeductions: systemDeductions
    })
  } catch (error) {
    console.error('Error fetching employee deductions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deductions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employee/deductions
 * Create a new manual deduction for the employee
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, amount, isPercentage, description } = body

    // Validation
    if (!name || !amount) {
      return NextResponse.json(
        { error: 'Name and amount are required' },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Check if a rule with this name already exists for this user
    const existingRule = await prisma.payrollRule.findFirst({
      where: {
        name,
        assignedUsers: {
          some: {
            userId: user.id
          }
        }
      }
    })

    if (existingRule) {
      return NextResponse.json(
        { error: 'A deduction with this name already exists' },
        { status: 400 }
      )
    }

    // Create the payroll rule as a deduction
    const deduction = await prisma.payrollRule.create({
      data: {
        name,
        type: 'deduction',
        amount: parsedAmount,
        isPercentage: isPercentage || false,
        description: description || `Manual deduction added by employee`,
        applyToAll: false,
        isActive: true,
        createdBy: user.id,
        createdByRole: 'EMPLOYEE',
        assignedUsers: {
          create: {
            userId: user.id
          }
        }
      },
      include: {
        assignedUsers: {
          where: {
            userId: user.id
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Deduction added successfully',
      deduction
    })
  } catch (error) {
    console.error('Error creating employee deduction:', error)
    return NextResponse.json(
      { error: 'Failed to create deduction' },
      { status: 500 }
    )
  }
}
