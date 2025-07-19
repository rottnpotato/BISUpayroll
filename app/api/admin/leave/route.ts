import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

// Define enums that should match the database schema
enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Define types to fix linter errors
type LeaveRequest = {
  id: string
  userId: string
  type: string
  startDate: Date
  endDate: Date
  reason: string | null
  status: string
  approvedById: string | null
  approvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    // Build the where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (userId) {
      where.userId = userId
    }

    const skip = (page - 1) * limit

    // Get leave requests with pagination
    // Using dynamic access to avoid TS errors until Prisma client is updated
    const [leaveRequests, total] = await Promise.all([
      (prisma as any).leaveRequest.findMany({
        where,
        skip,
        take: limit,
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
          },
          approvedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      (prisma as any).leaveRequest.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: leaveRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching leave requests'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: id and status are required'
      }, { status: 400 })
    }

    // Validate status
    const validStatuses = Object.values(LeaveStatus)
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid status value'
      }, { status: 400 })
    }

    // Check if leave request exists
    const leaveRequest = await (prisma as any).leaveRequest.findUnique({
      where: { id }
    }) as LeaveRequest | null

    if (!leaveRequest) {
      return NextResponse.json({
        success: false,
        message: 'Leave request not found'
      }, { status: 404 })
    }

    // Update the leave request
    const updateData: any = {
      status
    }

    // If approving or rejecting, add approver info
    if (status === LeaveStatus.APPROVED || status === LeaveStatus.REJECTED) {
      updateData.approvedById = user.id
      updateData.approvedAt = new Date()
    }

    const updatedLeaveRequest = await (prisma as any).leaveRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: updatedLeaveRequest
    })
  } catch (error) {
    console.error('Error updating leave request:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while updating the leave request'
    }, { status: 500 })
  }
} 