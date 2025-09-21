import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Fetch payroll files with user information
    const payrollFiles = await prisma.payrollFile.findMany({
      include: {
        generatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    // Map PayrollFile data to Report interface
    const reports = payrollFiles.map((file: any) => ({
      id: file.id,
      name: file.fileName,
      type: file.reportType,
      generatedBy: file.generatedByUser ? `${file.generatedByUser.firstName} ${file.generatedByUser.lastName}` : 'System',
      generatedOn: file.generatedAt?.toISOString?.() || new Date(file.generatedAt).toISOString(),
      status: file.status,
      downloadUrl: `/api/admin/payroll/files/${file.id}/download`
    }))

    return NextResponse.json({
      success: true,
      reports
    })

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 