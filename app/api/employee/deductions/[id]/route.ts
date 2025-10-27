import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * PUT /api/employee/deductions/[id]
 * Update an employee's manual deduction
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { name, amount, isPercentage, description, isActive } = body

    // Verify the rule exists and belongs to this user
    const existingRule = await prisma.payrollRule.findFirst({
      where: {
        id,
        type: 'deduction',
        applyToAll: false,
        assignedUsers: {
          some: {
            userId: user.id
          }
        }
      }
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Deduction not found or access denied' },
        { status: 404 }
      )
    }

    // Validation
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        )
      }
    }

    // Check if changing name conflicts with another rule
    if (name && name !== existingRule.name) {
      const conflictingRule = await prisma.payrollRule.findFirst({
        where: {
          name,
          id: { not: id },
          assignedUsers: {
            some: {
              userId: user.id
            }
          }
        }
      })

      if (conflictingRule) {
        return NextResponse.json(
          { error: 'A deduction with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update the deduction
    const updatedDeduction = await prisma.payrollRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(isPercentage !== undefined && { isPercentage }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
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
      message: 'Deduction updated successfully',
      deduction: updatedDeduction
    })
  } catch (error) {
    console.error('Error updating employee deduction:', error)
    return NextResponse.json(
      { error: 'Failed to update deduction' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/employee/deductions/[id]
 * Delete an employee's manual deduction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Verify the rule exists and belongs to this user
    const existingRule = await prisma.payrollRule.findFirst({
      where: {
        id,
        type: 'deduction',
        applyToAll: false,
        assignedUsers: {
          some: {
            userId: user.id
          }
        }
      }
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Deduction not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the payroll rule assignment first
    await prisma.payrollRuleAssignment.deleteMany({
      where: {
        payrollRuleId: id,
        userId: user.id
      }
    })

    // Check if this rule has any other assignments
    const remainingAssignments = await prisma.payrollRuleAssignment.count({
      where: {
        payrollRuleId: id
      }
    })

    // If no other users are assigned, delete the rule entirely
    if (remainingAssignments === 0) {
      await prisma.payrollRule.delete({
        where: { id }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Deduction deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting employee deduction:', error)
    return NextResponse.json(
      { error: 'Failed to delete deduction' },
      { status: 500 }
    )
  }
}
