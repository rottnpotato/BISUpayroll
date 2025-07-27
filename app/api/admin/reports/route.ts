import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function getRecentReports() {
  try {
    // Get recent audit logs for report generation activities
    const recentReportLogs = await prisma.auditLog.findMany({
      where: {
        action: 'report_generated',
        entityType: 'report'
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Transform to reports format
    const reports = recentReportLogs.map((log, index) => ({
      id: `RPT-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      name: log.details || `Generated Report`,
      type: log.entityId || 'general',
      generatedBy: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      generatedOn: log.createdAt.toISOString(),
      status: 'ready',
      downloadUrl: '#'
    }))

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching recent reports:', error)
    return NextResponse.json({ reports: [] })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const department = searchParams.get("department")

    // If no report type specified, return list of recent reports
    if (!reportType) {
      return await getRecentReports()
    }

    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(endDate)
    } : undefined

    switch (reportType) {
      case "attendance-summary":
        return await generateAttendanceSummaryReport(dateFilter, department || undefined)
      
      case "payroll-summary":
        return await generatePayrollSummaryReport(dateFilter, department || undefined)
      
      case "employee-summary":
        return await generateEmployeeSummaryReport(department || undefined)
      
      case "department-analytics":
        return await generateDepartmentAnalyticsReport(dateFilter)
      
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

async function generateAttendanceSummaryReport(dateFilter: any, department?: string) {
  const where: any = {}
  
  if (dateFilter) {
    where.date = dateFilter
  }
  
  if (department) {
    where.user = { department }
  }

  const [totalRecords, lateRecords, absentRecords, attendanceByDepartment] = await Promise.all([
    prisma.attendanceRecord.count({ where }),
    prisma.attendanceRecord.count({ where: { ...where, isLate: true } }),
    prisma.attendanceRecord.count({ where: { ...where, isAbsent: true } }),
    prisma.attendanceRecord.groupBy({
      by: ['userId'],
      where,
      _count: {
        id: true
      },
      _avg: {
        hoursWorked: true
      }
    })
  ])

  const departmentStats = await prisma.user.groupBy({
    by: ['department'],
    where: department ? { department } : {},
    _count: {
      id: true
    }
  })

  return NextResponse.json({
    summary: {
      totalRecords,
      lateRecords,
      absentRecords,
      attendanceRate: totalRecords > 0 ? ((totalRecords - absentRecords) / totalRecords * 100).toFixed(2) : 0
    },
    departmentStats,
    attendanceByEmployee: attendanceByDepartment
  })
}

async function generatePayrollSummaryReport(dateFilter: any, department?: string) {
  const where: any = {}
  
  if (dateFilter) {
    where.payPeriodStart = dateFilter
  }
  
  if (department) {
    where.user = { department }
  }

  const [totalRecords, paidRecords, unpaidRecords, payrollStats] = await Promise.all([
    prisma.payrollRecord.count({ where }),
    prisma.payrollRecord.count({ where: { ...where, isPaid: true } }),
    prisma.payrollRecord.count({ where: { ...where, isPaid: false } }),
    prisma.payrollRecord.aggregate({
      where,
      _sum: {
        grossPay: true,
        netPay: true,
        overtime: true,
        deductions: true,
        bonuses: true
      },
      _avg: {
        grossPay: true,
        netPay: true
      }
    })
  ])

  const departmentPayroll = await prisma.payrollRecord.groupBy({
    by: ['userId'],
    where,
    _sum: {
      grossPay: true,
      netPay: true
    },
    _count: {
      id: true
    }
  })

  return NextResponse.json({
    summary: {
      totalRecords,
      paidRecords,
      unpaidRecords,
      totalGrossPay: payrollStats._sum.grossPay || 0,
      totalNetPay: payrollStats._sum.netPay || 0,
      totalOvertime: payrollStats._sum.overtime || 0,
      totalDeductions: payrollStats._sum.deductions || 0,
      totalBonuses: payrollStats._sum.bonuses || 0,
      averageGrossPay: payrollStats._avg.grossPay || 0,
      averageNetPay: payrollStats._avg.netPay || 0
    },
    departmentPayroll
  })
}

async function generateEmployeeSummaryReport(department?: string) {
  const where = department ? { department } : {}

  const [totalEmployees, activeEmployees, inactiveEmployees, employeesByDepartment, employeesByRole] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.user.count({ where: { ...where, status: { not: "ACTIVE" } } }),
    prisma.user.groupBy({
      by: ['department'],
      where,
      _count: {
        id: true
      }
    }),
    prisma.user.groupBy({
      by: ['role'],
      where,
      _count: {
        id: true
      }
    })
  ])

  const salaryStats = await prisma.user.aggregate({
    where: { ...where, salary: { not: null } },
    _avg: {
      salary: true
    },
    _min: {
      salary: true
    },
    _max: {
      salary: true
    }
  })

  return NextResponse.json({
    summary: {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      averageSalary: salaryStats._avg.salary || 0,
      minSalary: salaryStats._min.salary || 0,
      maxSalary: salaryStats._max.salary || 0
    },
    employeesByDepartment,
    employeesByRole
  })
}

async function generateDepartmentAnalyticsReport(dateFilter: any) {
  const departments = await prisma.user.findMany({
    select: { department: true },
    distinct: ['department'],
    where: { department: { not: null } }
  })

  const analytics = await Promise.all(
    departments.map(async (dept) => {
      const departmentName = dept.department!
      
      const [employeeCount, attendanceCount, payrollSum] = await Promise.all([
        prisma.user.count({
          where: { department: departmentName, status: "ACTIVE" }
        }),
        prisma.attendanceRecord.count({
          where: {
            user: { department: departmentName },
            ...(dateFilter && { date: dateFilter })
          }
        }),
        prisma.payrollRecord.aggregate({
          where: {
            user: { department: departmentName },
            ...(dateFilter && { payPeriodStart: dateFilter })
          },
          _sum: {
            grossPay: true,
            netPay: true
          }
        })
      ])

      return {
        department: departmentName,
        employeeCount,
        attendanceCount,
        totalGrossPay: payrollSum._sum.grossPay || 0,
        totalNetPay: payrollSum._sum.netPay || 0
      }
    })
  )

  return NextResponse.json({ analytics })
} 