import { NextResponse } from "next/server"
import { prisma } from "@/lib/database"

// GET /api/admin/salary-grades/[id] - Get single salary grade
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check when needed

    const salaryGrade = await prisma.salaryGrade.findUnique({
      where: { id: params.id }
    })

    if (!salaryGrade) {
      return NextResponse.json(
        { error: "Salary grade not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(salaryGrade)
  } catch (error) {
    console.error("Error fetching salary grade:", error)
    return NextResponse.json(
      { error: "Failed to fetch salary grade" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/salary-grades/[id] - Update salary grade
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check when needed

    const body = await request.json()
    const { grade, position, rank, monthlyRate, dailyRate, description, isActive, effectiveDate } = body

    // Check if salary grade exists
    const existing = await prisma.salaryGrade.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Salary grade not found" },
        { status: 404 }
      )
    }

    // Check for duplicate grade if changed
    if (grade && grade !== existing.grade) {
      const duplicateGrade = await prisma.salaryGrade.findFirst({
        where: {
          grade: parseInt(grade),
          id: { not: params.id }
        }
      })

      if (duplicateGrade) {
        return NextResponse.json(
          { error: "Salary grade number already exists" },
          { status: 400 }
        )
      }
    }

    // Check for duplicate position/rank if changed
    if ((position || rank) && (position !== existing.position || rank !== existing.rank)) {
      const duplicatePositionRank = await prisma.salaryGrade.findFirst({
        where: {
          position: position || existing.position,
          rank: rank ? parseInt(rank) : existing.rank,
          id: { not: params.id }
        }
      })

      if (duplicatePositionRank) {
        return NextResponse.json(
          { error: "Position with this rank already exists" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (grade !== undefined) updateData.grade = parseInt(grade)
    if (position !== undefined) updateData.position = position
    if (rank !== undefined) updateData.rank = parseInt(rank)
    if (monthlyRate !== undefined) updateData.monthlyRate = parseFloat(monthlyRate)
    if (dailyRate !== undefined) updateData.dailyRate = parseFloat(dailyRate)
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive
    if (effectiveDate !== undefined) updateData.effectiveDate = new Date(effectiveDate)

    const salaryGrade = await prisma.salaryGrade.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(salaryGrade)
  } catch (error) {
    console.error("Error updating salary grade:", error)
    return NextResponse.json(
      { error: "Failed to update salary grade" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/salary-grades/[id] - Delete salary grade
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check when needed

    // Check if salary grade exists
    const existing = await prisma.salaryGrade.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Salary grade not found" },
        { status: 404 }
      )
    }

    // Check if any users are using this salary grade
    const usersWithGrade = await prisma.user.count({
      where: { salaryGrade: existing.grade }
    })

    if (usersWithGrade > 0) {
      return NextResponse.json(
        { error: `Cannot delete salary grade. ${usersWithGrade} user(s) are currently assigned to this grade.` },
        { status: 400 }
      )
    }

    await prisma.salaryGrade.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting salary grade:", error)
    return NextResponse.json(
      { error: "Failed to delete salary grade" },
      { status: 500 }
    )
  }
}
