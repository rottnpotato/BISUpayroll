import { NextRequest, NextResponse } from "next/server"
import { getSalaryGradeOptions } from "@/lib/salary-grades-server"

// GET /api/admin/salary-grades/options - Get salary grade options for dropdowns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get("position") || undefined

    const options = await getSalaryGradeOptions(position)

    return NextResponse.json(options)
  } catch (error) {
    console.error("Error fetching salary grade options:", error)
    return NextResponse.json(
      { error: "Failed to fetch salary grade options" },
      { status: 500 }
    )
  }
}
