import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function POST(req: NextRequest) {
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

    const userId = user.id
    const body = await req.json()
    const { attendanceId, startTime, endTime, description, date } = body

    // Validate required fields
    if (!attendanceId || !startTime || !endTime || !date) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the attendance record
    const attendance = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      select: {
        id: true,
        userId: true,
        hoursWorked: true,
        date: true,
        morningTimeOut: true,
        afternoonTimeOut: true,
        timeOut: true,
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Verify the attendance belongs to the user
    if (attendance.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to attendance record' },
        { status: 403 }
      )
    }

    // Validate that regular hours worked is more than 8
    const hoursWorked = parseFloat(attendance.hoursWorked?.toString() || '0')
    if (hoursWorked <= 8) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'You must work more than 8 hours before adding overload records' 
        },
        { status: 400 }
      )
    }

    // Calculate overload hours
    const calculateHours = (start: string, end: string): number => {
      const [startHour, startMin] = start.split(':').map(Number)
      const [endHour, endMin] = end.split(':').map(Number)
      
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      
      let diffMinutes = endMinutes - startMinutes
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }
      
      return diffMinutes / 60
    }

    const overloadHours = calculateHours(startTime, endTime)

    if (overloadHours <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid time range' },
        { status: 400 }
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

    let hourlyRate = 100 // Default rate
    if (overloadRule) {
      // If the rule is a percentage, we'd need the base rate
      // For now, use the amount directly as the hourly rate
      hourlyRate = parseFloat(overloadRule.amount.toString())
    }

    const totalAmount = overloadHours * hourlyRate

    // Create start and end datetime by combining date with time
    const attendanceDate = new Date(attendance.date)
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startDateTime = new Date(attendanceDate)
    startDateTime.setHours(startHour, startMin, 0, 0)
    
    const endDateTime = new Date(attendanceDate)
    endDateTime.setHours(endHour, endMin, 0, 0)
    
    // If end time is before start time, assume it's the next day
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1)
    }

    // Create overload record
    const overloadRecord = await prisma.overloadRecord.create({
      data: {
        userId,
        attendanceId,
        startTime: startDateTime,
        endTime: endDateTime,
        hoursWorked: overloadHours,
        hourlyRate,
        totalAmount,
        description: description || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Overload record submitted successfully',
      data: overloadRecord,
    })
  } catch (error) {
    console.error('Error creating overload record:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while creating overload record',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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

    const userId = user.id
    const { searchParams } = new URL(req.url)
    const attendanceId = searchParams.get('attendanceId')

    if (attendanceId) {
      // Get overload records for a specific attendance
      const overloadRecords = await prisma.overloadRecord.findMany({
        where: {
          attendanceId,
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({
        success: true,
        data: overloadRecords,
      })
    } else {
      // Get all overload records for the user
      const overloadRecords = await prisma.overloadRecord.findMany({
        where: {
          userId,
        },
        include: {
          attendance: {
            select: {
              date: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({
        success: true,
        data: overloadRecords,
      })
    }
  } catch (error) {
    console.error('Error fetching overload records:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while fetching overload records',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
