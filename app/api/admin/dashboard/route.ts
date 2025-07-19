import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get overview statistics
    const [
      totalEmployees,
      activeEmployees,
      todayAttendance,
      thisWeekAttendance,
      thisMonthPayroll,
      unpaidPayroll,
      recentAttendance,
      recentPayroll
    ] = await Promise.all([
      // Total employees
      prisma.user.count(),
      
      // Active employees
      prisma.user.count({
        where: { status: "ACTIVE" }
      }),
      
      // Today's attendance
      prisma.attendanceRecord.count({
        where: {
          date: {
            gte: startOfToday,
            lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
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
      
      // Unpaid payroll
      prisma.payrollRecord.count({
        where: {
          isPaid: false
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
              department: true
            }
          }
        }
      })
    ])

    // Get department statistics
    const departmentStats = await prisma.user.groupBy({
      by: ['department'],
      where: {
        department: { not: null },
        status: "ACTIVE"
      },
      _count: {
        id: true
      }
    })

    // Get attendance trends for the last 7 days
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

        return {
          date: startOfDay.toISOString().split('T')[0],
          count
        }
      })
    )

    // Get payroll trends for the last 6 months
    const payrollTrends = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

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

        return {
          month: startOfMonth.toISOString().split('T')[0].substring(0, 7),
          total: sum._sum.grossPay || 0
        }
      })
    )

    return NextResponse.json({
      overview: {
        totalEmployees,
        activeEmployees,
        todayAttendance,
        thisWeekAttendance,
        thisMonthPayroll: {
          total: thisMonthPayroll._sum.grossPay || 0,
          netTotal: thisMonthPayroll._sum.netPay || 0,
          count: thisMonthPayroll._count.id
        },
        unpaidPayroll
      },
      departmentStats,
      attendanceTrends: attendanceTrends.reverse(),
      payrollTrends: payrollTrends.reverse(),
      recentActivity: {
        attendance: recentAttendance,
        payroll: recentPayroll
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