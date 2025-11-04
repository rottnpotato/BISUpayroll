import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

/**
 * GET /api/admin/attendance/import/history
 * Get list of all attendance import batches
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Fetch batches with counts
    const [batches, total] = await Promise.all([
      prisma.attendanceImportBatch.findMany({
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
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
      }),
      prisma.attendanceImportBatch.count()
    ])

    const formattedBatches = batches.map(batch => ({
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
    }))

    return NextResponse.json({
      success: true,
      batches: formattedBatches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching import history:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch import history", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
