import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { format } from "date-fns"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exportFormat = searchParams.get("format") || "csv"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const department = searchParams.get("department")
    const includeHeaders = searchParams.get("includeHeaders") !== "false"

    // Build where clause
    const where: any = {}

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (department && department !== "all") {
      where.user = {
        department: department
      }
    }

    // Fetch attendance records
    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true
          }
        }
      },
      orderBy: [
        { date: "desc" },
        { user: { employeeId: "asc" } }
      ]
    })

    if (exportFormat === "json") {
      // Return JSON format
      const jsonData = records.map(record => ({
        employeeId: record.user.employeeId,
        employeeName: `${record.user.firstName} ${record.user.lastName}`,
        department: record.user.department,
        position: record.user.position,
        date: format(record.date, 'yyyy-MM-dd'),
        timeIn: record.timeIn ? format(record.timeIn, 'HH:mm:ss') : null,
        timeOut: record.timeOut ? format(record.timeOut, 'HH:mm:ss') : null,
        hoursWorked: record.hoursWorked ? parseFloat(record.hoursWorked.toString()) : null,
        isLate: record.isLate,
        isAbsent: record.isAbsent,
        status: record.isAbsent ? 'Absent' : record.isLate ? 'Late' : 'Present'
      }))

      return NextResponse.json({
        success: true,
        data: jsonData,
        total: records.length
      })
    }

    // Generate CSV content
    const csvHeaders = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Position',
      'Date',
      'Time In',
      'Time Out',
      'Hours Worked',
      'Status',
      'Is Late',
      'Is Absent'
    ]

    const csvRows = records.map(record => [
      record.user.employeeId || '',
      `${record.user.firstName} ${record.user.lastName}`,
      record.user.department || '',
      record.user.position || '',
      format(record.date, 'yyyy-MM-dd'),
      record.timeIn ? format(record.timeIn, 'HH:mm:ss') : '',
      record.timeOut ? format(record.timeOut, 'HH:mm:ss') : '',
      record.hoursWorked ? parseFloat(record.hoursWorked.toString()).toFixed(2) : '',
      record.isAbsent ? 'Absent' : record.isLate ? 'Late' : 'Present',
      record.isLate ? 'Yes' : 'No',
      record.isAbsent ? 'Yes' : 'No'
    ])

    // Build CSV content
    let csvContent = ''
    
    if (includeHeaders) {
      csvContent += csvHeaders.join(',') + '\n'
    }

    csvContent += csvRows.map(row => 
      row.map(field => {
        // Escape fields that contain commas, quotes, or newlines
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      }).join(',')
    ).join('\n')

    // Generate filename
    const dateRange = startDate && endDate 
      ? `${startDate}_to_${endDate}`
      : format(new Date(), 'yyyy-MM-dd')
    const filename = `attendance_report_${dateRange}.csv`

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error("Error exporting attendance data:", error)
    return NextResponse.json(
      { error: "Failed to export attendance data" },
      { status: 500 }
    )
  }
} 