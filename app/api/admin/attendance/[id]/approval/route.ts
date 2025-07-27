import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from cookie and verify admin access
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    if (action === 'reject' && !reason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      )
    }

    // Check if attendance record exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      )
    }

    // Check if record is already processed
    if (existingRecord.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Attendance record is already ${existingRecord.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Update attendance record with approval/rejection
    const updateData: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedById: user.id,
      approvedAt: new Date()
    }

    if (action === 'reject') {
      updateData.rejectionReason = reason.trim()
    }

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: params.id },
      data: updateData,
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
    })

    // Log the action for audit purposes
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: `ATTENDANCE_${action.toUpperCase()}`,
          entityType: 'ATTENDANCE_RECORD',
          entityId: params.id,
          details: `${action === 'approve' ? 'Approved' : 'Rejected'} attendance record for ${existingRecord.user.firstName} ${existingRecord.user.lastName} (${existingRecord.user.employeeId})${action === 'reject' ? `. Reason: ${reason}` : ''}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Continue execution even if audit logging fails
    }

    const actionMessage = action === 'approve' 
      ? `Attendance record approved successfully` 
      : `Attendance record rejected successfully`

    return NextResponse.json({
      message: actionMessage,
      record: updatedRecord
    })

  } catch (error) {
    console.error(`Error processing attendance record:`, error)
    return NextResponse.json(
      { error: "Failed to process attendance record" },
      { status: 500 }
    )
  }
} 