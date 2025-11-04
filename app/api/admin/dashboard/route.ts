import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { fetchAllPunchAttendance } from "@/lib/attendance-punches"
import { checkPayrollDeadlineStatus, getUpcomingPayrollDeadlines, checkPayrollFileStatus } from "@/lib/payroll-deadline-utils"

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    // Get overview statistics
    const [
      totalEmployees,
      activeEmployees,
      newEmployeesThisMonth,
      // attendance metrics will be computed via punches below
      _ignored1,
      _ignored2,
      thisMonthPayroll,
      lastMonthPayroll,
      unpaidPayroll,
      _ignored3,
      _ignored4,
      _legacyRecentAttendance,
      recentPayroll,
      totalPayrollRecords,
      paidPayrolls,
      monthlyPayrollTotal,
      payrollGroups,
      totalPayrollFiles,
      pendingApprovalGroups,
      completedGroups
    ] = await Promise.all([
      // Total employees
      prisma.user.count(),
      
      // Active employees
      prisma.user.count({
        where: { status: { not: "INACTIVE" } }
      }),

      // New employees this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // placeholders for indices alignment
      Promise.resolve(0),
      Promise.resolve(0),
      
      // This month's payroll from PayrollResult
      prisma.payrollResult.aggregate({
        where: {
          payPeriodStart: {
            gte: startOfMonth
          }
        },
        _sum: {
          grossPay: true,
          netPay: true
        },
        _count: {
          id: true
        }
      }),

      // Last month's payroll for comparison from PayrollResult
      prisma.payrollResult.aggregate({
        where: {
          payPeriodStart: {
            gte: lastMonth,
            lt: startOfMonth
          }
        },
        _sum: {
          grossPay: true
        }
      }),
      
      // Unpaid payroll from PayrollResult
      prisma.payrollResult.count({
        where: {
          isPaid: false
        }
      }),

      // placeholders; we'll compute using punches
      Promise.resolve(0),
      Promise.resolve(0),
      Promise.resolve([]),
      
      // Recent payroll records from PayrollResult
      prisma.payrollResult.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              department: true,
              status: true
            }
          }
        }
      }),

      // Count all payroll records for basic statistics
      prisma.payrollResult.count(),

      // Count paid payrolls this month
      prisma.payrollResult.count({
        where: {
          isPaid: true,
          paidAt: {
            gte: startOfMonth
          }
        }
      }),

      // Monthly payroll total from PayrollResult
      prisma.payrollResult.aggregate({
        where: {
          payPeriodStart: {
            gte: startOfMonth
          }
        },
        _sum: {
          grossPay: true
        }
      }),

      // Get payroll groups (using PayrollResult table)
      prisma.payrollResult.findMany({
        where: {
          payPeriodStart: {
            gte: startOfMonth
          }
        },
        select: {
          id: true,
          status: true
        }
      }),

      // Total payroll files
      prisma.payrollFile.count(),

      // Pending approval groups
      prisma.payrollResult.findMany({
        where: {
          payPeriodStart: {
            gte: startOfMonth
          },
          isApproved: false
        },
        select: {
          id: true
        }
      }),

      // Completed groups
      prisma.payrollResult.findMany({
        where: {
          payPeriodStart: {
            gte: startOfMonth
          },
          isPaid: true
        },
        select: {
          id: true
        }
      })
    ])

    // Compute attendance metrics from punches
    const todayPunchData = await fetchAllPunchAttendance({ startDate: startOfToday, endDate: endOfToday })
    const todayAttendance = todayPunchData.records.length
    const lateEmployeesToday = todayPunchData.records.filter(r => r.isLate).length
    const absentToday = todayPunchData.records.filter(r => r.isAbsent).length

    const thisWeekPunchData = await fetchAllPunchAttendance({ startDate: startOfWeek, endDate: endOfToday })
    const thisWeekAttendance = thisWeekPunchData.records.length

    // Recent attendance: last 10 records by day/user from punches
    const sevenDaysAgo = new Date(endOfToday)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentRange = await fetchAllPunchAttendance({ startDate: sevenDaysAgo, endDate: endOfToday })
    const recentAttendance = recentRange.records
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    // Get enhanced department statistics with attendance rates
    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: {
        department: { not: null },
        status: { not: "INACTIVE" }
      },
      _count: {
        id: true
      }
    })

    // Calculate attendance rates and average salaries for each department
    const departmentStats = await Promise.all(
      departments.map(async (dept: any) => {
        const totalEmployees = dept._count.id
        // Count attendance via punches (days with any punch)
        const deptAttendance = await fetchAllPunchAttendance({ startDate: startOfMonth, endDate: new Date(), department: dept.department || undefined })
        const attendanceCount = deptAttendance.records.filter(r => !r.isAbsent).length

        const avgSalary = await prisma.payrollResult.aggregate({
          where: {
            user: {
              department: dept.department
            },
            payPeriodStart: {
              gte: startOfMonth
            }
          },
          _avg: {
            grossPay: true
          }
        })

        const attendanceRate = totalEmployees > 0 
          ? Math.round((attendanceCount / (totalEmployees * new Date().getDate())) * 100)
          : 0

        return {
          department: dept.department,
          _count: dept._count,
          attendanceRate: Math.min(attendanceRate, 100),
          avgSalary: Number(avgSalary._avg.grossPay || 25000)
        }
      })
    )

    // Get attendance trends for the last 7 days with rates
    const attendanceTrends = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

        const dayData = await fetchAllPunchAttendance({ startDate: startOfDay, endDate: endOfDay })
        const count = dayData.records.length
        const presentCount = dayData.records.filter(r => !r.isAbsent).length

        return {
          date: startOfDay.toISOString().split('T')[0],
          count,
          rate: count > 0 ? Math.round((presentCount / count) * 100) : 0
        }
      })
    )

    // Get payroll trends for the last 6 months with growth
    const payrollTrends = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        // Current month
        const sum = await prisma.payrollResult.aggregate({
          where: {
            payPeriodStart: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          _sum: {
            grossPay: true
          }
        })

        // Previous month for growth calculation
        const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1)
        const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0)
        
        const prevSum = await prisma.payrollResult.aggregate({
          where: {
            payPeriodStart: {
              gte: prevMonth,
              lte: prevMonthEnd
            }
          },
          _sum: {
            grossPay: true
          }
        })

        const current = Number(sum._sum.grossPay || 0)
        const previous = Number(prevSum._sum.grossPay || 0)
        const growth = previous > 0 ? ((current - previous) / previous * 100) : 0

        return {
          month: startOfMonth.toISOString().split('T')[0].substring(0, 7),
          total: current,
          growth: Math.round(growth * 100) / 100
        }
      })
    )

    // Calculate on-time rate
    const monthRange = await fetchAllPunchAttendance({ startDate: startOfMonth, endDate: new Date() })
    const onTimeCount = monthRange.records.filter(r => !r.isLate && !r.isAbsent).length
    const totalAttendanceRecords = monthRange.records.length

    const onTimeRate = totalAttendanceRecords > 0 
      ? Math.round((onTimeCount / totalAttendanceRecords) * 100)
      : 0

    const attendanceRate = activeEmployees > 0 
      ? Math.round((todayAttendance / activeEmployees) * 100)
      : 0

    // Get upcoming holidays
    const upcomingHolidays = await prisma.holiday.count({
      where: {
        date: {
          gte: new Date()
        }
      }
    })

          // Get pending reports (using leave requests as proxy for reports)
    const pendingReports = await prisma.leaveRequest.count({
      where: {
        status: "PENDING"
      }
    })

    // Get actual payroll status based on current month's PayrollResult records
    const currentMonthPayrollResults = await prisma.payrollResult.findMany({
      where: {
        payPeriodStart: {
          gte: startOfMonth
        }
      },
      select: {
        status: true,
        isPaid: true,
        isApproved: true
      }
    })

    // Determine actual payroll status
    let payrollStatus = "No Payroll Generated"
    if (currentMonthPayrollResults.length > 0) {
      const allPaid = currentMonthPayrollResults.every(p => p.isPaid)
      const allApproved = currentMonthPayrollResults.every(p => p.isApproved)
      const hasGenerated = currentMonthPayrollResults.some(p => p.status === 'GENERATED')
      
      if (allPaid) {
        payrollStatus = "Paid"
      } else if (allApproved) {
        payrollStatus = "Approved & Ready for Payment"
      } else if (hasGenerated) {
        payrollStatus = "Generated & Pending Approval"
      }
    }

    // Get active payroll schedule for timeline calculation
    const activePayrollSchedule = await prisma.payrollSchedule.findFirst({
      where: { isActive: true }
    })

    // Check for missed payroll deadlines
    const payrollDeadlineStatus = await checkPayrollDeadlineStatus()
    
    // Get upcoming payroll deadlines
    const upcomingDeadlines = await getUpcomingPayrollDeadlines(14) // Next 14 days
    
    // Check payroll file status for current month
    const payrollFileStatus = await checkPayrollFileStatus(startOfMonth, new Date())

    // Calculate payroll period based on schedule or default to current month
    let payrollPeriodStart = startOfMonth
    let payrollPeriodEnd = new Date()

    if (activePayrollSchedule && Array.isArray(activePayrollSchedule.days) && activePayrollSchedule.days.length > 0) {
      const today = new Date()
      const currentMonthIndex = today.getMonth()
      const currentYear = today.getFullYear()

      // Build candidate schedule dates across prev, current, and next month
      const sortedDays = [...activePayrollSchedule.days].sort((a: number, b: number) => a - b)
      const candidateDates: Date[] = []

      for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
        for (const day of sortedDays) {
          candidateDates.push(new Date(currentYear, currentMonthIndex + monthOffset, day))
        }
      }

      candidateDates.sort((a, b) => a.getTime() - b.getTime())

      // Find the most recent schedule date <= today for start, and the next > today for end
      let startCandidate: Date | null = null
      let endCandidate: Date | null = null
      for (const date of candidateDates) {
        if (date.getTime() <= today.getTime()) {
          startCandidate = date
        }
        if (!endCandidate && date.getTime() > today.getTime()) {
          endCandidate = date
        }
      }

      // Fallbacks if boundaries are not found (e.g., today is before all candidate dates)
      if (!startCandidate) {
        // Use the latest date from two months back as a conservative start
        const lastDayPrevPrevMonth = sortedDays[sortedDays.length - 1]
        startCandidate = new Date(currentYear, currentMonthIndex - 1, lastDayPrevPrevMonth)
      }
      if (!endCandidate) {
        // Use the earliest date from the month after next as the end
        const firstDayNextMonth = sortedDays[0]
        endCandidate = new Date(currentYear, currentMonthIndex + 1, firstDayNextMonth)
      }

      payrollPeriodStart = startCandidate
      payrollPeriodEnd = endCandidate
    }

    // Calculate payroll on-the-fly for all active employees using stored procedure
    // Get all active employees (exclude INACTIVE)
    const employeesForPayroll = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        status: { not: 'INACTIVE' }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        status: true
      }
    })

    // Calculate payroll for each employee using the stored procedure
    const currentPeriodPayroll = await Promise.all(
      employeesForPayroll.map(async (employee) => {
        try {
          // Call stored procedure to calculate payroll
          const calculation = await prisma.$queryRaw<any[]>`
            SELECT * FROM calculate_payroll_for_period(
              ${employee.id}::text,
              ${payrollPeriodStart}::date,
              ${payrollPeriodEnd}::date
            )
          `

          if (calculation && calculation.length > 0) {
            const calc = calculation[0]
            return {
              id: `calc_${employee.id}`,
              userId: employee.id,
              payPeriodStart: payrollPeriodStart,
              payPeriodEnd: payrollPeriodEnd,
              dailyRate: Number(calc.daily_rate || 0),
              hourlyRate: Number(calc.hourly_rate || 0),
              daysWorked: Number(calc.days_worked || 0),
              hoursWorked: Number(calc.hours_worked || 0),
              overtimeHours: Number(calc.overtime_hours || 0),
              undertimeHours: Number(calc.undertime_hours || 0),
              lateHours: Number(calc.late_hours || 0),
              holidayHours: Number(calc.holiday_hours || 0),
              regularPay: Number(calc.regular_pay || 0),
              overtimePay: Number(calc.overtime_pay || 0),
              holidayPay: Number(calc.holiday_pay || 0),
              nightDifferential: 0,
              allowances: Number(calc.allowances || 0),
              bonuses: Number(calc.bonuses || 0),
              thirteenthMonthPay: Number(calc.thirteenth_month_pay || 0),
              serviceIncentiveLeave: Number(calc.service_incentive_leave || 0),
              otherEarnings: Number(calc.other_earnings || 0),
              totalEarnings: Number(calc.total_earnings || 0),
              grossPay: Number(calc.gross_pay || 0),
              gsisContribution: Number(calc.gsis_contribution || 0),
              philHealthContribution: Number(calc.philhealth_contribution || 0),
              pagibigContribution: Number(calc.pagibig_contribution || 0),
              taxableIncome: Number(calc.taxable_income || 0),
              withholdingTax: Number(calc.withholding_tax || 0),
              lateDeductions: Number(calc.late_deductions || 0),
              undertimeDeductions: Number(calc.undertime_deductions || 0),
              loanDeductions: Number(calc.loan_deductions || 0),
              otherDeductions: Number(calc.other_deductions || 0),
              totalDeductions: Number(calc.total_deductions || 0),
              netPay: Number(calc.net_pay || 0),
              user: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                employeeId: employee.employeeId,
                department: employee.department,
                status: employee.status
              }
            }
          }
          return null
        } catch (error) {
          console.error(`Error calculating payroll for employee ${employee.id}:`, error)
          return null
        }
      })
    )

    // Filter out null results and calculate totals
    const validPayrollRecords = currentPeriodPayroll.filter(record => record !== null)
    const payrollResultTotals = validPayrollRecords.reduce((acc, record: any) => ({
      grossPay: acc.grossPay + Number(record.grossPay || 0),
      netPay: acc.netPay + Number(record.netPay || 0),
      totalDeductions: acc.totalDeductions + Number(record.totalDeductions || 0),
      count: acc.count + 1
    }), { grossPay: 0, netPay: 0, totalDeductions: 0, count: 0 })

    // Ensure consistent data structure even when empty
    // Use PayrollResult data for accurate payroll totals
    const actualMonthlyTotal = payrollResultTotals.grossPay > 0 ? payrollResultTotals.grossPay : Number(monthlyPayrollTotal._sum.grossPay || 0)
    const actualNetTotal = payrollResultTotals.netPay > 0 ? payrollResultTotals.netPay : Number(thisMonthPayroll._sum.netPay || 0)
    const actualPayrollCount = payrollResultTotals.count > 0 ? payrollResultTotals.count : thisMonthPayroll._count.id || 0

    const response = {
      overview: {
        totalEmployees: totalEmployees || 0,
        activeEmployees: activeEmployees || 0,
        newEmployeesThisMonth: newEmployeesThisMonth || 0,
        todayAttendance: todayAttendance || 0,
        thisWeekAttendance: thisWeekAttendance || 0,
        thisMonthPayroll: {
          total: actualMonthlyTotal,
          netTotal: actualNetTotal,
          count: actualPayrollCount
        },
        unpaidPayroll: unpaidPayroll || 0,
        attendanceRate: attendanceRate || 0
      },
      totalEmployees: totalEmployees || 0,
      monthlyPayrollTotal: actualMonthlyTotal,
      unpaidPayrolls: Math.max(0, (totalPayrollRecords || 0) - (paidPayrolls || 0)),
      generatedPayrolls: totalPayrollRecords || 0,
      paidPayrolls: paidPayrolls || 0,
      generatedGroups: payrollGroups?.length || 0,
      pendingApproval: pendingApprovalGroups?.length || 0,
      completedPayrolls: completedGroups?.length || 0,
      totalPayrollFiles: totalPayrollFiles || 0,
      departmentStats: departmentStats || [],
      attendanceTrends: (attendanceTrends || []).reverse(),
      payrollTrends: (payrollTrends || []).reverse(),
      quickStats: {
        onTimeRate: onTimeRate || 0,
        lateEmployees: lateEmployeesToday || 0,
        absentToday: absentToday || 0,
        upcomingHolidays: upcomingHolidays || 0,
        pendingReports: pendingReports || 0
      },
      recentActivity: {
        attendance: recentAttendance || [],
        payroll: recentPayroll || []
      },
      employeePayroll: validPayrollRecords || [],
      payrollDetails: {
        company: "BISU Balilihan Campus",
        period: {
          start: payrollPeriodStart.toISOString().split('T')[0],
          end: payrollPeriodEnd.toISOString().split('T')[0]
        },
        status: payrollStatus,
        total: actualMonthlyTotal,
        breakdown: {
          salary: actualMonthlyTotal * 0.7,
          benefits: actualMonthlyTotal * 0.15,
          incentives: actualMonthlyTotal * 0.1,
          employerContributions: actualMonthlyTotal * 0.05
        },
        schedule: activePayrollSchedule,
        deadlineStatus: payrollDeadlineStatus,
        upcomingDeadlines: upcomingDeadlines,
        fileStatus: payrollFileStatus
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard data",
        // Provide empty data structure as fallback
        overview: {
          totalEmployees: 0,
          activeEmployees: 0,
          newEmployeesThisMonth: 0,
          todayAttendance: 0,
          thisWeekAttendance: 0,
          thisMonthPayroll: { total: 0, netTotal: 0, count: 0 },
          unpaidPayroll: 0,
          attendanceRate: 0
        },
        departmentStats: [],
        attendanceTrends: [],
        payrollTrends: [],
        quickStats: {
          onTimeRate: 0,
          lateEmployees: 0,
          absentToday: 0,
          upcomingHolidays: 0,
          pendingReports: 0
        },
        recentActivity: {
          attendance: [],
          payroll: []
        },
        payrollDetails: {
          company: "BISU Balilihan Campus",
          period: { start: "", end: "" },
          status: "No Data",
          total: 0,
          breakdown: { salary: 0, benefits: 0, incentives: 0, employerContributions: 0 },
          schedule: null
        }
      },
      { status: 500 }
    )
  }
} 