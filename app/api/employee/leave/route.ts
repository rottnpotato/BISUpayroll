import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { LeaveRequest, LeaveStatus, LeaveType } from '@prisma/client'

// Define the LeaveRequest with User type for better type safety
type LeaveRequestWithApprover = LeaveRequest & {
  approvedBy?: {
    firstName: string;
    lastName: string;
  } | null;
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
    console.log("user id: "+user?.id);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    // Get all leave requests for the user
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: user?.id
      },
      include: {
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
    })

    // Format leave requests for the response
    const formattedLeaveRequests = leaveRequests.map((request) => {
      return {
        id: request.id,
        type: request.type,
        startDate: request.startDate.toISOString().split('T')[0],
        endDate: request.endDate.toISOString().split('T')[0],
        reason: request.reason,
        status: request.status,
        approvedBy: request.approvedBy ? `${request.approvedBy.firstName} ${request.approvedBy.lastName}` : null,
        approvedAt: request.approvedAt ? request.approvedAt.toISOString() : null,
        createdAt: request.createdAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedLeaveRequests
    })
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching leave requests'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    // Get leave request data from request body
    const body = await request.json()
    const { type, startDate, endDate, reason } = body

    // Validate required fields
    if (!type || !startDate || !endDate) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: type, startDate, and endDate are required'
      }, { status: 400 })
    }

    // Validate leave type
    const validLeaveTypes = Object.values(LeaveType)
    if (!validLeaveTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid leave type'
      }, { status: 400 })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        success: false,
        message: 'Invalid date format'
      }, { status: 400 })
    }

    if (start > end) {
      return NextResponse.json({
        success: false,
        message: 'Start date must be before or equal to end date'
      }, { status: 400 })
    }

    // Create the leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        type: type,
        startDate: start,
        endDate: end,
        reason: reason || null,
        status: LeaveStatus.PENDING
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        id: leaveRequest.id,
        type: leaveRequest.type,
        startDate: leaveRequest.startDate.toISOString().split('T')[0],
        endDate: leaveRequest.endDate.toISOString().split('T')[0],
        reason: leaveRequest.reason,
        status: leaveRequest.status
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating leave request:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while creating the leave request'
    }, { status: 500 })
  }
} 