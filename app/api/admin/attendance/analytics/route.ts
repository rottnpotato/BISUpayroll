import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30days" // 7days, 30days, 90days, year
    const department = searchParams.get("department")

    let startDate: Date
    let endDate: Date = new Date()

    // Determine date range based on period
    switch (period) {
      case "7days":
        startDate = subDays(endDate, 7)
        break
      case "90days":
        startDate = subDays(endDate, 90)
        break
      case "year":
        startDate = subDays(endDate, 365)
        break
      default: // 30days
        startDate = subDays(endDate, 30)
    }

    // Build where clause
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
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
            department: true,
            position: true
          }
        }
      },
      orderBy: { date: "asc" }
    })

    // Daily attendance trends
    const dailyTrends = records.reduce((acc, record) => {
      const dateKey = format(record.date, 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          present: 0,
          late: 0,
          absent: 0,
          totalHours: 0
        }
      }

      if (record.timeIn) {
        if (record.isLate) {
          acc[dateKey].late++
        } else {
          acc[dateKey].present++
        }
        if (record.hoursWorked) {
          acc[dateKey].totalHours += parseFloat(record.hoursWorked.toString())
        }
      }
      if (record.isAbsent) acc[dateKey].absent++

      return acc
    }, {} as Record<string, any>)

    // Department-wise analytics
    const departmentAnalytics = records.reduce((acc, record) => {
      const dept = record.user.department || "Unknown"
      if (!acc[dept]) {
        acc[dept] = {
          department: dept,
          totalRecords: 0,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          totalHours: 0,
          attendanceRate: 0,
          punctualityRate: 0
        }
      }

      acc[dept].totalRecords++
      if (record.timeIn) {
        if (record.isLate) {
          acc[dept].lateCount++
        } else {
          acc[dept].presentCount++
        }
      }
      if (record.isAbsent) acc[dept].absentCount++
      if (record.hoursWorked) {
        acc[dept].totalHours += parseFloat(record.hoursWorked.toString())
      }

      return acc
    }, {} as Record<string, any>)

    // Calculate rates for departments
    Object.values(departmentAnalytics).forEach((dept: any) => {
      dept.attendanceRate = dept.totalRecords > 0 
        ? (dept.presentCount / dept.totalRecords) * 100 
        : 0
      dept.punctualityRate = dept.presentCount > 0 
        ? ((dept.presentCount - dept.lateCount) / dept.presentCount) * 100 
        : 100
    })

    // Weekly patterns (day of week analysis)
    const weeklyPatterns = records.reduce((acc, record) => {
      const dayOfWeek = format(record.date, 'EEEE')
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = {
          day: dayOfWeek,
          totalRecords: 0,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0
        }
      }

      acc[dayOfWeek].totalRecords++
      if (record.timeIn) {
        if (record.isLate) {
          acc[dayOfWeek].lateCount++
        } else {
          acc[dayOfWeek].presentCount++
        }
      }
      if (record.isAbsent) acc[dayOfWeek].absentCount++

      return acc
    }, {} as Record<string, any>)

    // Time analysis (check common late arrival times)
    const timeAnalysis = records
      .filter(r => r.timeIn && r.isLate)
      .reduce((acc, record) => {
        if (record.timeIn) {
          const hour = record.timeIn.getHours()
          const timeSlot = `${hour}:00-${hour + 1}:00`
          acc[timeSlot] = (acc[timeSlot] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

    // Top performers (employees with best attendance)
    const employeePerformance = await prisma.attendanceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true
          }
        }
      }
    })

    const performanceMap = employeePerformance.reduce((acc, record) => {
      const empId = record.userId
      if (!acc[empId]) {
        acc[empId] = {
          employee: {
            id: record.user.id,
            name: `${record.user.firstName} ${record.user.lastName}`,
            employeeId: record.user.employeeId,
            department: record.user.department
          },
          totalDays: 0,
          presentDays: 0,
          lateDays: 0,
          attendanceRate: 0,
          punctualityRate: 0
        }
      }

      acc[empId].totalDays++
      if (record.timeIn) {
        if (record.isLate) {
          acc[empId].lateDays++
        } else {
          acc[empId].presentDays++
        }
      }

      return acc
    }, {} as Record<string, any>)

    // Calculate rates and sort by performance
    const topPerformers = Object.values(performanceMap)
      .map((emp: any) => {
        emp.attendanceRate = emp.totalDays > 0 ? (emp.presentDays / emp.totalDays) * 100 : 0
        emp.punctualityRate = emp.presentDays > 0 ? ((emp.presentDays - emp.lateDays) / emp.presentDays) * 100 : 100
        return emp
      })
      .sort((a: any, b: any) => b.attendanceRate - a.attendanceRate)
      .slice(0, 10)

    // Overall statistics
    const overallStats = {
      totalRecords: records.length,
      totalEmployees: new Set(records.map(r => r.userId)).size,
      averageAttendanceRate: departmentAnalytics ? 
        Object.values(departmentAnalytics).reduce((sum: number, dept: any) => sum + dept.attendanceRate, 0) / Object.keys(departmentAnalytics).length : 0,
      averagePunctualityRate: departmentAnalytics ?
        Object.values(departmentAnalytics).reduce((sum: number, dept: any) => sum + dept.punctualityRate, 0) / Object.keys(departmentAnalytics).length : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd')
        },
        overallStats,
        dailyTrends: Object.values(dailyTrends).sort((a: any, b: any) => a.date.localeCompare(b.date)),
        departmentAnalytics: Object.values(departmentAnalytics),
        weeklyPatterns: Object.values(weeklyPatterns),
        timeAnalysis,
        topPerformers
      }
    })

  } catch (error) {
    console.error("Error generating attendance analytics:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate attendance analytics" 
      },
      { status: 500 }
    )
  }
} 