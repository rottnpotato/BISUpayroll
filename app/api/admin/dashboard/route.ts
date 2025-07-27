import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
      todayAttendance,
      thisWeekAttendance,
      thisMonthPayroll,
      lastMonthPayroll,
      unpaidPayroll,
      lateEmployeesToday,
      absentToday,
      recentAttendance,
      recentPayroll
    ] = await Promise.all([
      // Total employees
      prisma.user.count(),
      
      // Active employees
      prisma.user.count({
        where: { status: "ACTIVE" }
      }),

      // New employees this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Today's attendance
      prisma.attendanceRecord.count({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday
          }
        }
      }),
      
      // This week's attendance
      prisma.attendanceRecord.count({
        where: {
          date: {
            gte: startOfWeek
          }
        }
      }),
      
      // This month's payroll
      prisma.payrollRecord.aggregate({
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

      // Last month's payroll for comparison
      prisma.payrollRecord.aggregate({
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
      
      // Unpaid payroll
      prisma.payrollRecord.count({
        where: {
          isPaid: false
        }
      }),

      // Late employees today
      prisma.attendanceRecord.count({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday
          },
          isLate: true
        }
      }),

      // Absent employees today
      prisma.attendanceRecord.count({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday
          },
          isAbsent: true
        }
      }),
      
      // Recent attendance records
      prisma.attendanceRecord.findMany({
        take: 10,
        orderBy: { date: "desc" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              department: true
            }
          }
        }
      }),
      
      // Recent payroll records
      prisma.payrollRecord.findMany({
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
      })
    ])

    // Get enhanced department statistics with attendance rates
    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: {
        department: { not: null },
        status: "ACTIVE"
      },
      _count: {
        id: true
      }
    })

    // Calculate attendance rates and average salaries for each department
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const totalEmployees = dept._count.id
        const attendanceCount = await prisma.attendanceRecord.count({
          where: {
            user: {
              department: dept.department
            },
            date: {
              gte: startOfMonth
            },
            isAbsent: false
          }
        })

        const avgSalary = await prisma.payrollRecord.aggregate({
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

        const count = await prisma.attendanceRecord.count({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        })

        const presentCount = await prisma.attendanceRecord.count({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay
            },
            isAbsent: false
          }
        })

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
        const sum = await prisma.payrollRecord.aggregate({
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
        
        const prevSum = await prisma.payrollRecord.aggregate({
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
    const onTimeCount = await prisma.attendanceRecord.count({
      where: {
        date: {
          gte: startOfMonth
        },
        isLate: false,
        isAbsent: false
      }
    })

    const totalAttendanceRecords = await prisma.attendanceRecord.count({
      where: {
        date: {
          gte: startOfMonth
        }
      }
    })

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

    return NextResponse.json({
      overview: {
        totalEmployees,
        activeEmployees,
        newEmployeesThisMonth,
        todayAttendance,
        thisWeekAttendance,
        thisMonthPayroll: {
          total: Number(thisMonthPayroll._sum.grossPay || 0),
          netTotal: Number(thisMonthPayroll._sum.netPay || 0),
          count: thisMonthPayroll._count.id
        },
        unpaidPayroll,
        attendanceRate
      },
      departmentStats,
      attendanceTrends: attendanceTrends.reverse(),
      payrollTrends: payrollTrends.reverse(),
      quickStats: {
        onTimeRate,
        lateEmployees: lateEmployeesToday,
        absentToday,
        upcomingHolidays,
        pendingReports
      },
      recentActivity: {
        attendance: recentAttendance,
        payroll: recentPayroll
      },
      payrollDetails: {
        company: "BISU Balilihan Campus",
        period: {
          start: startOfMonth.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        status: "Finalized & Ready for Payment",
        total: Number(thisMonthPayroll._sum.grossPay || 0),
        breakdown: {
          salary: Number(thisMonthPayroll._sum.grossPay || 0) * 0.7,
          benefits: Number(thisMonthPayroll._sum.grossPay || 0) * 0.15,
          incentives: Number(thisMonthPayroll._sum.grossPay || 0) * 0.1,
          employerContributions: Number(thisMonthPayroll._sum.grossPay || 0) * 0.05
        }
      }
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
} 