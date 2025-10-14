import { NextRequest, NextResponse } from "next/server"
import { fetchAllPunchAttendance } from "@/lib/attendance-punches"

export async function GET(request: NextRequest) {
  try {
    // Get attendance records derived from punch data
    const { records } = await fetchAllPunchAttendance({})

    const limitedRecords = records.slice(0, 50)

    const totalCount = records.length

    return NextResponse.json({
      success: true,
      totalCount,
      records: limitedRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        date: record.date,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        hoursWorked: record.hoursWorked,
        isLate: record.isLate,
        isAbsent: record.isAbsent,
        user: record.user,
        status: record.status
      }))
    })
  } catch (error) {
    console.error("Error fetching test attendance records:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch test attendance records",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 