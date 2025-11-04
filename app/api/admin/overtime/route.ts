import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/admin/overtime
 * Get all overtime requests with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (userId) where.userId = userId

    const overtimeRequests = await prisma.overtimeRequest.findMany({
      where,
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
 * PATCH /api/admin/overtime
 * Approve or reject an overtime request
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, rejectionReason } = body

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: id, action (approve/reject)' },
        { status: 400 }
      )
    }

    // Find the overtime request
    const overtimeRequest = await prisma.overtimeRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!overtimeRequest) {
      return NextResponse.json({ error: 'Overtime request not found' }, { status: 404 })
    }

    if (overtimeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending requests can be approved or rejected' },
        { status: 400 }
      )
    }

    // Update the request
    const updatedRequest = await prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedById: user.id,
        approvedAt: new Date(),
        rejectionReason: action === 'reject' ? rejectionReason : null
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        attendance: {
          select: {
            date: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Overtime request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: updatedRequest
    })
  } catch (error) {
    console.error('Error updating overtime request:', error)
    return NextResponse.json(
      { error: 'Failed to update overtime request' },
      { status: 500 }
    )
  }
}
