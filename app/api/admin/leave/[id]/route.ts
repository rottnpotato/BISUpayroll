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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const leaveRequest = await (prisma as any).leaveRequest.findUnique({
      where: { id: params.id },
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
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }) as (LeaveRequest & { user: any, approvedBy: any } | null)

    if (!leaveRequest) {
      return NextResponse.json({ success: false, message: 'Leave request not found' }, { status: 404 })
    }

    // Check permissions - Admin can view any request, Employee can only view their own
    if (user.role !== 'ADMIN' && leaveRequest.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: leaveRequest
    })
  } catch (error) {
    console.error('Error fetching leave request:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching the leave request'
    }, { status: 500 })
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
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    // Check if leave request exists
    const leaveRequest = await (prisma as any).leaveRequest.findUnique({
      where: { id: params.id }
    }) as LeaveRequest | null

    if (!leaveRequest) {
      return NextResponse.json({ success: false, message: 'Leave request not found' }, { status: 404 })
    }

    // Delete the leave request
    await (prisma as any).leaveRequest.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting leave request:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while deleting the leave request'
    }, { status: 500 })
  }
} 