import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { AuditLogger } from '@/lib/audit-logger'

const prisma = new PrismaClient()

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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const existingRole = await prisma.payrollRole.findUnique({
      where: { id }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Payroll role not found' }, { status: 404 })
    }

    const updatedRole = await prisma.payrollRole.update({
      where: { id },
      data: {
        name: body.name ?? existingRole.name,
        description: body.description ?? existingRole.description,
        department: body.department ?? existingRole.department,
        position: body.position ?? existingRole.position,
        isActive: body.isActive ?? existingRole.isActive,
        baseSalary: body.baseSalary ? parseFloat(body.baseSalary) : existingRole.baseSalary,
        overtimeEligible: body.overtimeEligible ?? existingRole.overtimeEligible,
  // Night differential removed; keep existing value or set false if needed
        holidayPayEligible: body.holidayPayEligible ?? existingRole.holidayPayEligible,
        gsisEligible: body.gsisEligible ?? existingRole.gsisEligible,
        philHealthEligible: body.philHealthEligible ?? existingRole.philHealthEligible,
        pagibigEligible: body.pagibigEligible ?? existingRole.pagibigEligible,
        withholdingTaxEligible: body.withholdingTaxEligible ?? existingRole.withholdingTaxEligible,
        thirteenthMonthEligible: body.thirteenthMonthEligible ?? existingRole.thirteenthMonthEligible,
        leaveEligible: body.leaveEligible ?? existingRole.leaveEligible
      }
    })

    await AuditLogger.log({
      action: 'UPDATE',
      entityType: 'PAYROLL_ROLE',
      entityId: updatedRole.id,
      userId: user.id,
      details: JSON.stringify({ 
        payrollRoleId: updatedRole.id,
        name: updatedRole.name,
        changes: Object.keys(body)
      })
    }, request)

    return NextResponse.json({ payrollRole: updatedRole })
  } catch (error) {
    console.error('Error updating payroll role:', error)
    return NextResponse.json(
      { error: 'Failed to update payroll role' },
      { status: 500 }
    )
  }
}

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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { id } = params

    const existingRole = await prisma.payrollRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Payroll role not found' }, { status: 404 })
    }

    if (existingRole._count.userRoles > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Remove user assignments first.' },
        { status: 400 }
      )
    }

    await prisma.payrollRole.delete({
      where: { id }
    })

    await AuditLogger.log({
      action: 'DELETE',
      entityType: 'PAYROLL_ROLE',
      entityId: id,
      userId: user.id,
      details: JSON.stringify({ payrollRoleId: id, name: existingRole.name })
    }, request)

    return NextResponse.json({ message: 'Payroll role deleted successfully' })
  } catch (error) {
    console.error('Error deleting payroll role:', error)
    return NextResponse.json(
      { error: 'Failed to delete payroll role' },
      { status: 500 }
    )
  }
}