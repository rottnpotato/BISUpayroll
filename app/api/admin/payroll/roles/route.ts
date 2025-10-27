import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { AuditLogger } from '@/lib/audit-logger'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const includeUsers = searchParams.get('includeUsers') === 'true'

    const payrollRoles = await prisma.payrollRole.findMany({
      include: {
        userRoles: includeUsers ? {
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
          }
        } : false,
        _count: {
          select: {
            userRoles: true
          }
        }
      },
      orderBy: [
        { department: 'asc' },
        { position: 'asc' },
        { name: 'asc' }
      ]
    })

    await AuditLogger.log({
      action: 'VIEW',
      entityType: 'PAYROLL_ROLES',
      userId: user.id,
      details: JSON.stringify({ count: payrollRoles.length })
    }, request)

    return NextResponse.json({ payrollRoles })
  } catch (error) {
    console.error('Error fetching payroll roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll roles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      name,
      description,
      department,
      position,
      dailyRate,
      overtimeEligible,
  // Night differential removed
      holidayPayEligible,
      gsisEligible,
      philHealthEligible,
      pagibigEligible,
      withholdingTaxEligible,
      thirteenthMonthEligible,
      leaveEligible
    } = body

    const payrollRole = await prisma.payrollRole.create({
      data: {
        name,
        description,
        department,
        position,
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        overtimeEligible: overtimeEligible ?? true,
  // Night differential removed
        holidayPayEligible: holidayPayEligible ?? true,
        gsisEligible: gsisEligible ?? true,
        philHealthEligible: philHealthEligible ?? true,
        pagibigEligible: pagibigEligible ?? true,
        withholdingTaxEligible: withholdingTaxEligible ?? true,
        thirteenthMonthEligible: thirteenthMonthEligible ?? true,
        leaveEligible: leaveEligible ?? true
      }
    })

    await AuditLogger.log({
      action: 'CREATE',
      entityType: 'PAYROLL_ROLE',
      entityId: payrollRole.id,
      userId: user.id,
      details: JSON.stringify({ payrollRoleId: payrollRole.id, name: payrollRole.name })
    }, request)

    return NextResponse.json({ payrollRole }, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll role:', error)
    return NextResponse.json(
      { error: 'Failed to create payroll role' },
      { status: 500 }
    )
  }
}