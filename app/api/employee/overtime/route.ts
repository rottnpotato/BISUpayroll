import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/employee/overtime
 * Get all overtime requests for the authenticated employee
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

    const overtimeRequests = await prisma.overtimeRequest.findMany({
      where: { userId: user.id },
      include: {
        attendance: {
          select: {
            date: true,
            timeIn: true,
            timeOut: true
          }
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: overtimeRequests })
  } catch (error) {
    console.error('Error fetching overtime requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overtime requests' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employee/overtime
 * Create a new overtime request
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { attendanceId, startTime, endTime, description } = body

    if (!attendanceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: attendanceId, startTime, endTime' },
        { status: 400 }
      )
    }

    // Verify attendance record exists and belongs to user
    const attendance = await prisma.attendanceRecord.findFirst({
      where: {
        id: attendanceId,
        userId: user.id
      }
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Calculate hours worked
    const start = new Date(startTime)
    const end = new Date(endTime)
    const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    if (hoursWorked <= 0) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Get user's hourly rate from payroll rules
    let hourlyRate = 0
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

    if (dailyRateRule) {
      const dailyRate = Number(dailyRateRule.payrollRule.amount)
      hourlyRate = dailyRate / 8 // Assuming 8-hour workday
    }

    // Calculate overtime pay (1.25x for first 2 hours, 1.5x after)
    let overtimePay = 0
    if (hoursWorked <= 2) {
      overtimePay = hoursWorked * hourlyRate * 1.25
    } else {
      overtimePay = (2 * hourlyRate * 1.25) + ((hoursWorked - 2) * hourlyRate * 1.5)
    }

    // Create overtime request
    const overtimeRequest = await prisma.overtimeRequest.create({
      data: {
        userId: user.id,
        attendanceId,
        startTime: start,
        endTime: end,
        hoursWorked,
        hourlyRate,
        totalAmount: overtimePay,
        description,
        status: 'PENDING'
      },
      include: {
        attendance: {
          select: {
            date: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Overtime request submitted successfully',
        data: overtimeRequest
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating overtime request:', error)
    return NextResponse.json(
      { error: 'Failed to create overtime request' },
      { status: 500 }
    )
  }
}
