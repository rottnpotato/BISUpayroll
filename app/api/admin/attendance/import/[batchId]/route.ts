import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

/**
 * DELETE /api/admin/attendance/import/[batchId]
 * Revert an attendance import batch by deleting all associated records
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const { batchId } = params

    // Check if batch exists
    const batch = await prisma.attendanceImportBatch.findUnique({
      where: { id: batchId },
      include: {
        _count: {
          select: {
            attendanceRecords: true,
            attendancePunches: true
          }
        },
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!batch) {
      return NextResponse.json(
        { success: false, message: 'Import batch not found' },
        { status: 404 }
      )
    }

    // Delete all attendance records and punches associated with this batch
    // Using transaction to ensure atomicity
    await prisma.$transaction([
      // Delete attendance punches first (child records)
      prisma.attendancePunch.deleteMany({
        where: { importBatchId: batchId }
      }),
      
      // Delete attendance records
      prisma.attendanceRecord.deleteMany({
        where: { importBatchId: batchId }
      }),
      
      // Delete the import batch itself
      prisma.attendanceImportBatch.delete({
        where: { id: batchId }
      })
    ])

    return NextResponse.json({
      success: true,
      message: `Successfully reverted import batch. Deleted ${batch._count.attendanceRecords} attendance records and ${batch._count.attendancePunches} punch logs.`,
      deletedRecords: batch._count.attendanceRecords,
      deletedPunches: batch._count.attendancePunches,
      batchInfo: {
        fileName: batch.fileName,
        uploadedBy: `${batch.uploadedBy.firstName} ${batch.uploadedBy.lastName}`,
        uploadedAt: batch.uploadedAt
      }
    })
  } catch (error) {
    console.error("Error reverting import batch:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to revert import batch", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/attendance/import/[batchId]
 * Get details of a specific import batch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const { batchId } = params

    const batch = await prisma.attendanceImportBatch.findUnique({
      where: { id: batchId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            attendanceRecords: true,
            attendancePunches: true
          }
        }
      }
    })

    if (!batch) {
      return NextResponse.json(
        { success: false, message: 'Import batch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        fileName: batch.fileName,
        fileSize: batch.fileSize,
        checksum: batch.checksum,
        summary: batch.summary,
        notes: batch.notes,
        uploadedAt: batch.uploadedAt,
        uploadedBy: {
          id: batch.uploadedBy.id,
          name: `${batch.uploadedBy.firstName} ${batch.uploadedBy.lastName}`,
          email: batch.uploadedBy.email
        },
        recordCount: batch._count.attendanceRecords,
        punchCount: batch._count.attendancePunches
      }
    })
  } catch (error) {
    console.error("Error fetching import batch:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch import batch", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
