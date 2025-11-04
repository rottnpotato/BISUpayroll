import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/employee/overtime/rate
 * Get the employee's hourly rate for overtime calculation
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get daily rate from payroll rules
    const dailyRateRule = await prisma.payrollRuleAssignment.findFirst({
      where: {
        userId: user.id,
        payrollRule: {
          type: 'daily_rate',
          isActive: true
        }
      },
      include: { payrollRule: true }
    })

    if (!dailyRateRule) {
      // Try global rules
      const globalDailyRate = await prisma.payrollRule.findFirst({
        where: {
          type: 'daily_rate',
          isActive: true,
          applyToAll: true
        }
      })

      if (!globalDailyRate) {
        return NextResponse.json({ error: 'No daily rate configured' }, { status: 404 })
      }

      const dailyRate = Number(globalDailyRate.amount)
      const hourlyRate = dailyRate / 8 // Assuming 8-hour workday

      return NextResponse.json({ 
        success: true, 
        dailyRate, 
        hourlyRate,
        overtimeRate1: hourlyRate * 1.25,
        overtimeRate2: hourlyRate * 1.5
      })
    }

    const dailyRate = Number(dailyRateRule.payrollRule.amount)
    const hourlyRate = dailyRate / 8 // Assuming 8-hour workday

    return NextResponse.json({ 
      success: true, 
      dailyRate, 
      hourlyRate,
      overtimeRate1: hourlyRate * 1.25,
      overtimeRate2: hourlyRate * 1.5
    })
  } catch (error) {
    console.error('Error fetching hourly rate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hourly rate' },
      { status: 500 }
    )
  }
}
