import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const reportType = searchParams.get('reportType')
    const department = searchParams.get('department')
    const status = searchParams.get('status')

    // Build where clause
    const whereClause: any = {
      isArchived: false
    }

    if (reportType) {
      whereClause.reportType = reportType
    }

    if (department) {
      whereClause.department = department
    }

    if (status) {
      whereClause.status = status
    }

    // Get payroll files with pagination
    const files = await prisma.payrollFile.findMany({
      where: whereClause,
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
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.payrollFile.count({
      where: whereClause
    })

    // Transform data to match the interface
    const transformedFiles = files.map((file: any) => ({
      id: file.id,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      fileType: file.fileType,
      reportType: file.reportType,
      payPeriodStart: file.payPeriodStart,
      payPeriodEnd: file.payPeriodEnd,
      generatedBy: file.generatedBy,
      generatedAt: file.generatedAt,
      department: file.department,
      employeeCount: file.employeeCount,
      totalGrossPay: Number(file.totalGrossPay),
      totalNetPay: Number(file.totalNetPay),
      totalDeductions: Number(file.totalDeductions),
      status: file.status,
      isArchived: file.isArchived,
      downloadCount: file.downloadCount,
      lastDownloadAt: file.lastDownloadAt,
      scheduleId: file.scheduleId,
      scheduleName: file.scheduleName,
      generatedByUser: file.generatedByUser
    }))

    return NextResponse.json({
      files: transformedFiles,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching payroll files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fileName,
      filePath,
      fileSize,
      fileType,
      reportType,
      payPeriodStart,
      payPeriodEnd,
      generatedBy,
      department,
      employeeCount,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      scheduleId,
      scheduleName,
      metadata,
      checksum
    } = body

    // Validate required fields
    if (!fileName || !filePath || !fileType || !reportType || !payPeriodStart || !payPeriodEnd || !generatedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payroll file record
    const payrollFile = await prisma.payrollFile.create({
      data: {
        fileName,
        filePath,
        fileSize: fileSize || 0,
        fileType,
        reportType,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd),
        generatedBy,
        department,
        employeeCount: employeeCount || 0,
        totalGrossPay: totalGrossPay || 0,
        totalNetPay: totalNetPay || 0,
        totalDeductions: totalDeductions || 0,
        scheduleId,
        scheduleName,
        metadata: metadata ? JSON.stringify(metadata) : null,
        checksum,
        status: 'GENERATED'
      },
      include: {
        generatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Payroll file recorded successfully',
      file: {
        id: payrollFile.id,
        fileName: payrollFile.fileName,
        filePath: payrollFile.filePath,
        fileSize: payrollFile.fileSize,
        fileType: payrollFile.fileType,
        reportType: payrollFile.reportType,
        payPeriodStart: payrollFile.payPeriodStart,
        payPeriodEnd: payrollFile.payPeriodEnd,
        generatedBy: payrollFile.generatedBy,
        generatedAt: payrollFile.generatedAt,
        department: payrollFile.department,
        employeeCount: payrollFile.employeeCount,
        totalGrossPay: Number(payrollFile.totalGrossPay),
        totalNetPay: Number(payrollFile.totalNetPay),
        totalDeductions: Number(payrollFile.totalDeductions),
        status: payrollFile.status,
        isArchived: payrollFile.isArchived,
        downloadCount: payrollFile.downloadCount,
        lastDownloadAt: payrollFile.lastDownloadAt,
        scheduleId: payrollFile.scheduleId,
        scheduleName: payrollFile.scheduleName,
        generatedByUser: payrollFile.generatedByUser
      }
    })

  } catch (error) {
    console.error('Error creating payroll file record:', error)
    return NextResponse.json(
      { error: 'Failed to create payroll file record' },
      { status: 500 }
    )
  }
} 