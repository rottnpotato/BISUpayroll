import { NextRequest, NextResponse } from "next/server"
import { fetchAllPunchAttendance } from "@/lib/attendance-punches"
import { format, subDays } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30days" // 7days, 30days, 90days, year
    const department = searchParams.get("department")

  let startDate: Date
  const endDate: Date = new Date()

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

    const { records } = await fetchAllPunchAttendance({
      startDate,
      endDate,
      department: department && department !== "all" ? department : undefined
    })

    const recordsWithDates = records.map(record => ({
      ...record,
      recordDate: new Date(record.date),
      timeInDate: record.timeIn ? new Date(record.timeIn) : null,
      timeOutDate: record.timeOut ? new Date(record.timeOut) : null
    }))

    const dailyTrendsMap = new Map<string, { date: string; present: number; late: number; absent: number; totalHours: number }>()
    const departmentMap = new Map<string, { department: string; totalRecords: number; presentCount: number; lateCount: number; absentCount: number; totalHours: number }>()
    const weeklyMap = new Map<string, { day: string; totalRecords: number; presentCount: number; lateCount: number; absentCount: number }>()
    const timeAnalysis: Record<string, number> = {}
    const performanceMap = new Map<string, {
      employee: {
        id: string
        name: string
        employeeId: string | null
        department: string | null
      }
      totalDays: number
      presentDays: number
      lateDays: number
    }>()

    recordsWithDates.forEach(record => {
      const dateKey = format(record.recordDate, 'yyyy-MM-dd')
      const departmentKey = record.user.department || "Unknown"
      const weekDayKey = format(record.recordDate, 'EEEE')
      const hasTimeIn = Boolean(record.timeInDate)
      const hoursWorked = record.hoursWorked ?? 0

      if (!dailyTrendsMap.has(dateKey)) {
        dailyTrendsMap.set(dateKey, {
          date: dateKey,
          present: 0,
          late: 0,
          absent: 0,
          totalHours: 0
        })
      }

      if (!departmentMap.has(departmentKey)) {
        departmentMap.set(departmentKey, {
          department: departmentKey,
          totalRecords: 0,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          totalHours: 0
        })
      }

      if (!weeklyMap.has(weekDayKey)) {
        weeklyMap.set(weekDayKey, {
          day: weekDayKey,
          totalRecords: 0,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0
        })
      }

      const daily = dailyTrendsMap.get(dateKey)!
      const deptEntry = departmentMap.get(departmentKey)!
      const weeklyEntry = weeklyMap.get(weekDayKey)!

      daily.absent += record.isAbsent ? 1 : 0
      deptEntry.absentCount += record.isAbsent ? 1 : 0
      weeklyEntry.absentCount += record.isAbsent ? 1 : 0

      if (hasTimeIn) {
        if (record.isLate) {
          daily.late++
          deptEntry.lateCount++
          weeklyEntry.lateCount++
        } else {
          daily.present++
          deptEntry.presentCount++
          weeklyEntry.presentCount++
        }

        daily.totalHours += hoursWorked
        deptEntry.totalHours += hoursWorked
      }

      deptEntry.totalRecords++
      weeklyEntry.totalRecords++

      if (!performanceMap.has(record.userId)) {
        performanceMap.set(record.userId, {
          employee: {
            id: record.userId,
            name: `${record.user.firstName} ${record.user.lastName}`,
            employeeId: record.user.employeeId || null,
            department: record.user.department || null
          },
          totalDays: 0,
          presentDays: 0,
          lateDays: 0
        })
      }

      const performance = performanceMap.get(record.userId)!
      performance.totalDays++

      if (hasTimeIn) {
        if (record.isLate) {
          performance.lateDays++
        } else {
          performance.presentDays++
        }
      }

      if (record.isLate && record.timeInDate) {
        const hour = record.timeInDate.getHours()
        const slot = `${hour}:00-${hour + 1}:00`
        timeAnalysis[slot] = (timeAnalysis[slot] || 0) + 1
      }
    })

    const dailyTrends = Array.from(dailyTrendsMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    const departmentAnalytics = Array.from(departmentMap.values()).map(entry => {
      const attendanceRate = entry.totalRecords > 0 ? (entry.presentCount / entry.totalRecords) * 100 : 0
      const punctualityRate = entry.presentCount > 0 ? ((entry.presentCount - entry.lateCount) / entry.presentCount) * 100 : 100
      return {
        ...entry,
        attendanceRate,
        punctualityRate
      }
    })

    const weeklyPatterns = Array.from(weeklyMap.values())

    const topPerformers = Array.from(performanceMap.values())
      .map(entry => ({
        ...entry,
        attendanceRate: entry.totalDays > 0 ? (entry.presentDays / entry.totalDays) * 100 : 0,
        punctualityRate: entry.presentDays > 0 ? ((entry.presentDays - entry.lateDays) / entry.presentDays) * 100 : 100
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 10)

    const overallStats = {
      totalRecords: recordsWithDates.length,
      totalEmployees: new Set(recordsWithDates.map(r => r.userId)).size,
      averageAttendanceRate: departmentAnalytics.length > 0
        ? departmentAnalytics.reduce((sum, dept) => sum + dept.attendanceRate, 0) / departmentAnalytics.length
        : 0,
      averagePunctualityRate: departmentAnalytics.length > 0
        ? departmentAnalytics.reduce((sum, dept) => sum + dept.punctualityRate, 0) / departmentAnalytics.length
        : 0
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
  dailyTrends,
  departmentAnalytics,
  weeklyPatterns,
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