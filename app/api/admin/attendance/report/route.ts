import { NextRequest, NextResponse } from "next/server"
import { format, startOfMonth, endOfMonth, subDays, addDays } from "date-fns"
import { fetchAllPunchAttendance } from "@/lib/attendance-punches"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "monthly"
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const department = searchParams.get("department")
    const employeeId = searchParams.get("employeeId")

    let dateRange: { start: Date; end: Date }

    // Determine date range based on report type
    switch (reportType) {
      case "daily":
        const targetDate = startDate ? new Date(startDate) : new Date()
        dateRange = {
          start: new Date(targetDate.setHours(0, 0, 0, 0)),
          end: new Date(targetDate.setHours(23, 59, 59, 999))
        }
        break
      case "weekly":
        const weekStart = startDate ? new Date(startDate) : subDays(new Date(), 7)
        dateRange = {
          start: weekStart,
          end: addDays(weekStart, 6)
        }
        break
      case "custom":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Start date and end date are required for custom reports" },
            { status: 400 }
          )
        }
        dateRange = {
          start: new Date(startDate),
          end: new Date(endDate)
        }
        break
      default: // monthly
        dateRange = {
          start: startOfMonth(new Date(year, month - 1)),
          end: endOfMonth(new Date(year, month - 1))
        }
    }

    const departmentFilter = department && department !== "all" ? department : undefined

    const { records } = await fetchAllPunchAttendance({
      startDate: dateRange.start,
      endDate: dateRange.end,
      department: departmentFilter,
      userId: employeeId || undefined
    })

    // Calculate analytics
    const analytics = {
      totalRecords: records.length,
  presentCount: records.filter(r => r.timeIn && r.timeOut).length,
  lateCount: records.filter(r => r.isLate).length,
  absentCount: records.filter(r => r.isAbsent).length,
  totalHours: records.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0),
      averageHoursPerDay: 0,
      attendanceRate: 0,
      punctualityRate: 0
    }

    if (analytics.totalRecords > 0) {
      analytics.averageHoursPerDay = analytics.totalHours / analytics.totalRecords
      analytics.attendanceRate = (analytics.presentCount / analytics.totalRecords) * 100
      analytics.punctualityRate = analytics.presentCount > 0 
        ? ((analytics.presentCount - analytics.lateCount) / analytics.presentCount) * 100 
        : 100
    }

    // Department summary
    const departmentSummary = records.reduce((acc, record) => {
      const dept = record.user.department || "Unknown"
      if (!acc[dept]) {
        acc[dept] = {
          totalEmployees: 0,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          totalHours: 0
        }
      }
      
      acc[dept].totalEmployees++
      if (record.timeIn && record.timeOut) acc[dept].presentCount++
      if (record.isLate) acc[dept].lateCount++
      if (record.isAbsent) acc[dept].absentCount++
      if (record.hoursWorked) {
        acc[dept].totalHours += record.hoursWorked
      }
      
      return acc
    }, {} as Record<string, any>)

    // Employee summary
    const employeeSummary = records.reduce((acc, record) => {
      const empId = record.user.employeeId || record.userId
      if (!acc[empId]) {
        acc[empId] = {
          employeeId: record.user.employeeId,
          name: `${record.user.firstName} ${record.user.lastName}`,
          department: record.user.department,
          position: record.user.position,
          totalDays: 0,
          presentDays: 0,
          lateDays: 0,
          absentDays: 0,
          totalHours: 0
        }
      }
      
      acc[empId].totalDays++
      if (record.timeIn && record.timeOut) acc[empId].presentDays++
      if (record.isLate) acc[empId].lateDays++
      if (record.isAbsent) acc[empId].absentDays++
      if (record.hoursWorked) {
        acc[empId].totalHours += record.hoursWorked
      }
      
      return acc
    }, {} as Record<string, any>)

    // Format records for response
    const formattedRecords = records.map(record => ({
      id: record.id,
      date: format(new Date(record.date), 'yyyy-MM-dd'),
      timeIn: record.timeIn ? format(new Date(record.timeIn), 'HH:mm:ss') : null,
      timeOut: record.timeOut ? format(new Date(record.timeOut), 'HH:mm:ss') : null,
      hoursWorked: record.hoursWorked ?? null,
      isLate: record.isLate,
      isAbsent: record.isAbsent,
      employee: {
        id: record.user.id,
        employeeId: record.user.employeeId,
        name: `${record.user.firstName} ${record.user.lastName}`,
        department: record.user.department,
        position: record.user.position
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        dateRange: {
          start: format(dateRange.start, 'yyyy-MM-dd'),
          end: format(dateRange.end, 'yyyy-MM-dd')
        },
        records: formattedRecords,
        analytics,
        departmentSummary: Object.entries(departmentSummary).map(([dept, data]) => ({
          department: dept,
          ...data
        })),
        employeeSummary: Object.values(employeeSummary)
      }
    })

  } catch (error) {
    console.error("Error generating attendance report:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate attendance report" 
      },
      { status: 500 }
    )
  }
} 