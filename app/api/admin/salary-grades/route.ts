import { NextResponse } from "next/server"
import { prisma } from "@/lib/database"

// GET /api/admin/salary-grades - Get all salary grades
export async function GET() {
  try {
    // TODO: Add authentication check when needed

    const salaryGrades = await prisma.salaryGrade.findMany({
      orderBy: [
        { grade: 'asc' }
      ]
    })

    return NextResponse.json(salaryGrades)
  } catch (error) {
    console.error("Error fetching salary grades:", error)
    return NextResponse.json(
      { error: "Failed to fetch salary grades" },
      { status: 500 }
    )
  }
}

// POST /api/admin/salary-grades - Create new salary grade
export async function POST(request: Request) {
  try {
    // TODO: Add authentication check when needed

    const body = await request.json()
    const { grade, position, rank, monthlyRate, dailyRate, description, isActive, effectiveDate } = body

    // Validate required fields
    if (!grade || !position || !rank || !monthlyRate || !dailyRate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existingGrade = await prisma.salaryGrade.findUnique({
      where: { grade: parseInt(grade) }
    })

    if (existingGrade) {
      return NextResponse.json(
        { error: "Salary grade already exists" },
        { status: 400 }
      )
    }

    const existingPositionRank = await prisma.salaryGrade.findUnique({
      where: { 
        position_rank: {
          position,
          rank: parseInt(rank)
        }
      }
    })

    if (existingPositionRank) {
      return NextResponse.json(
        { error: "Position with this rank already exists" },
        { status: 400 }
      )
    }

    const salaryGrade = await prisma.salaryGrade.create({
      data: {
        grade: parseInt(grade),
        position,
        rank: parseInt(rank),
        monthlyRate: parseFloat(monthlyRate),
        dailyRate: parseFloat(dailyRate),
        description: description || `${position} ${rank} - Salary Grade ${grade}`,
        isActive: isActive !== undefined ? isActive : true,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      }
    })

    return NextResponse.json(salaryGrade, { status: 201 })
  } catch (error) {
    console.error("Error creating salary grade:", error)
    return NextResponse.json(
      { error: "Failed to create salary grade" },
      { status: 500 }
    )
  }
}
