import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { AuditLogger } from '@/lib/audit-logger'

const prisma = new PrismaClient()

export async function POST(
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { id: payrollRoleId } = params
    const { userIds } = await request.json()

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 })
    }

    // Check if payroll role exists
    const payrollRole = await prisma.payrollRole.findUnique({
      where: { id: payrollRoleId }
    })

    if (!payrollRole) {
      return NextResponse.json({ error: 'Payroll role not found' }, { status: 404 })
    }

    // Remove existing assignments for this role
    await prisma.userPayrollRole.deleteMany({
      where: { payrollRoleId }
    })

    // Create new assignments
    if (userIds.length > 0) {
      const assignments = userIds.map((userId: string) => ({
        userId,
        payrollRoleId
      }))

      await prisma.userPayrollRole.createMany({
        data: assignments,
        skipDuplicates: true
      })
    }

    await AuditLogger.log({
      action: 'UPDATE',
      entityType: 'USER_PAYROLL_ROLE_ASSIGNMENTS',
      entityId: payrollRoleId,
      userId: user.id,
      details: JSON.stringify({ 
        payrollRoleId,
        roleName: payrollRole.name,
        assignedUserCount: userIds.length
      })
    }, request)

    return NextResponse.json({ 
      message: 'User assignments updated successfully',
      assignedCount: userIds.length
    })
  } catch (error) {
    console.error('Error updating user assignments:', error)
    return NextResponse.json(
      { error: 'Failed to update user assignments' },
      { status: 500 }
    )
  }
}

export async function GET(
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { id: payrollRoleId } = params

    const assignments = await prisma.userPayrollRole.findMany({
      where: { payrollRoleId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching user assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user assignments' },
      { status: 500 }
    )
  }
}