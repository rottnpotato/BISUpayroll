import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = req.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Get overload hourly rate from payroll rules
    const overloadRule = await prisma.payrollRule.findFirst({
      where: {
        name: { contains: 'overload', mode: 'insensitive' },
        type: 'earnings',
        isActive: true,
      },
    })

    let rate = 100 // Default rate per hour
    if (overloadRule) {
      rate = parseFloat(overloadRule.amount.toString())
    }

    return NextResponse.json({
      success: true,
      rate,
      source: overloadRule ? 'payroll_rule' : 'default',
    })
  } catch (error) {
    console.error('Error fetching overload rate:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while fetching overload rate',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
