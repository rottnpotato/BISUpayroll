import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * DELETE /api/employee/overtime/[id]
 * Delete a pending overtime request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the overtime request
    const overtimeRequest = await prisma.overtimeRequest.findUnique({
      where: { id: params.id }
    })

    if (!overtimeRequest) {
      return NextResponse.json({ error: 'Overtime request not found' }, { status: 404 })
    }

    // Verify ownership
    if (overtimeRequest.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow deletion of pending requests
    if (overtimeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete pending requests' },
        { status: 400 }
      )
    }

    await prisma.overtimeRequest.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Overtime request deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting overtime request:', error)
    return NextResponse.json(
      { error: 'Failed to delete overtime request' },
      { status: 500 }
    )
  }
}
