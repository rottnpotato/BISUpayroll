import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

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

      case "department-payroll":
        return await generateDepartmentPayrollReport(dateFilter, department || undefined)
      
      case "custom-period-payroll":
        return await generateCustomPeriodPayrollReport(dateFilter, department || undefined)
      
      case "tax-withholding-summary":
        return await generateTaxWithholdingSummaryReport(dateFilter, department || undefined)
      
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate report", 
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
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

async function generateDepartmentPayrollReport(dateFilter: any, department?: string) {
  try {
    if (!department || department === "all") {
      return NextResponse.json(
        { error: "Department parameter is required for department payroll report" },
        { status: 400 }
      )
    }

    const where: any = {
      user: { department, role: "EMPLOYEE", status: "ACTIVE" }
    }
    
    if (dateFilter) {
      where.payPeriodStart = dateFilter
    }

    const payrollRecords = await prisma.payrollRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
            salary: true
          }
        }
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    })

    if (payrollRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No payroll records found for department: ${department}`,
        records: [],
        summary: {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalNetPay: 0,
          totalDeductions: 0,
          department
        }
      })
    }

    const summary = {
      totalEmployees: payrollRecords.length,
      totalGrossPay: payrollRecords.reduce((sum, record) => sum + (parseFloat(record.grossPay?.toString() || '0')), 0),
      totalNetPay: payrollRecords.reduce((sum, record) => sum + (parseFloat(record.netPay?.toString() || '0')), 0),
      totalDeductions: payrollRecords.reduce((sum, record) => sum + (parseFloat(record.deductions?.toString() || '0')), 0),
      department
    }

    return NextResponse.json({
      success: true,
      records: payrollRecords,
      summary,
      reportType: 'department-payroll',
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating department payroll report:', error)
    return NextResponse.json(
      { 
        error: "Failed to generate department payroll report", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

async function generateCustomPeriodPayrollReport(dateFilter: any, department?: string) {
  try {
    if (!dateFilter?.gte || !dateFilter?.lte) {
      return NextResponse.json(
        { error: "Start date and end date are required for custom period payroll report" },
        { status: 400 }
      )
    }

    const where: any = {
      user: { role: "EMPLOYEE", status: "ACTIVE" },
      payPeriodStart: dateFilter
    }
    
    if (department && department !== "all") {
      where.user.department = department
    }

    const payrollRecords = await prisma.payrollRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
            salary: true
          }
        }
      },
      orderBy: [
        { user: { department: 'asc' } },
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    })

    if (payrollRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No payroll records found for the specified period`,
        records: [],
        summary: {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalNetPay: 0,
          totalDeductions: 0,
          periodStart: dateFilter.gte,
          periodEnd: dateFilter.lte
        }
      })
    }

    // Group by department for better analysis
    const departmentGroups = payrollRecords.reduce((groups, record) => {
      const dept = record.user.department || 'Unknown'
      if (!groups[dept]) {
        groups[dept] = []
      }
      groups[dept].push(record)
      return groups
    }, {} as Record<string, any[]>)

    const summary = {
      totalEmployees: payrollRecords.length,
      totalGrossPay: payrollRecords.reduce((sum, record) => sum + (parseFloat(record.grossPay?.toString() || '0')), 0),
      totalNetPay: payrollRecords.reduce((sum, record) => sum + (parseFloat(record.netPay?.toString() || '0')), 0),
      totalDeductions: payrollRecords.reduce((sum, record) => sum + (parseFloat(record.deductions?.toString() || '0')), 0),
      periodStart: dateFilter.gte,
      periodEnd: dateFilter.lte,
      departmentBreakdown: Object.keys(departmentGroups).map(dept => ({
        department: dept,
        employeeCount: departmentGroups[dept].length,
        totalGrossPay: departmentGroups[dept].reduce((sum, record) => sum + (parseFloat(record.grossPay?.toString() || '0')), 0),
        totalNetPay: departmentGroups[dept].reduce((sum, record) => sum + (parseFloat(record.netPay?.toString() || '0')), 0)
      }))
    }

    return NextResponse.json({
      success: true,
      records: payrollRecords,
      summary,
      reportType: 'custom-period-payroll',
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating custom period payroll report:', error)
    return NextResponse.json(
      { 
        error: "Failed to generate custom period payroll report", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

async function generateTaxWithholdingSummaryReport(dateFilter: any, department?: string) {
  try {
    const where: any = {
      user: { role: "EMPLOYEE", status: "ACTIVE" }
    }
    
    if (dateFilter) {
      where.payPeriodStart = dateFilter
    }
    
    if (department && department !== "all") {
      where.user.department = department
    }

    const payrollRecords = await prisma.payrollRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
            salary: true
          }
        }
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    })

    if (payrollRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No payroll records found for tax withholding summary`,
        records: [],
        summary: {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalWithholdingTax: 0,
          totalPagibigContribution: 0,
          totalSSSContribution: 0,
          totalPhilHealthContribution: 0
        }
      })
    }

    // Calculate tax withholdings and contributions for each record
    const taxRecords = payrollRecords.map(record => {
      const grossPay = parseFloat(record.grossPay?.toString() || '0')
      const withholdingTax = grossPay * 0.12 // 12% withholding tax
      const pagibigContribution = grossPay * 0.02 // 2% Pag-IBIG contribution
      const sssContribution = Math.min(grossPay * 0.045, 1350) // 4.5% SSS, max 1350
      const philHealthContribution = Math.min(grossPay * 0.0275, 1800) // 2.75% PhilHealth, max 1800

      return {
        ...record,
        taxBreakdown: {
          withholdingTax,
          pagibigContribution,
          sssContribution,
          philHealthContribution,
          totalContributions: withholdingTax + pagibigContribution + sssContribution + philHealthContribution
        }
      }
    })

    const summary = {
      totalEmployees: taxRecords.length,
      totalGrossPay: taxRecords.reduce((sum, record) => sum + (parseFloat(record.grossPay?.toString() || '0')), 0),
      totalWithholdingTax: taxRecords.reduce((sum, record) => sum + record.taxBreakdown.withholdingTax, 0),
      totalPagibigContribution: taxRecords.reduce((sum, record) => sum + record.taxBreakdown.pagibigContribution, 0),
      totalSSSContribution: taxRecords.reduce((sum, record) => sum + record.taxBreakdown.sssContribution, 0),
      totalPhilHealthContribution: taxRecords.reduce((sum, record) => sum + record.taxBreakdown.philHealthContribution, 0),
      totalAllContributions: taxRecords.reduce((sum, record) => sum + record.taxBreakdown.totalContributions, 0)
    }

    return NextResponse.json({
      success: true,
      records: taxRecords,
      summary,
      reportType: 'tax-withholding-summary',
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating tax withholding summary report:', error)
    return NextResponse.json(
      { 
        error: "Failed to generate tax withholding summary report", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
} 