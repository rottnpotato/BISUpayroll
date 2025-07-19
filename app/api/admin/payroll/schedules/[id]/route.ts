import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id

    const schedule = await prisma.payrollSchedule.findUnique({
      where: { id }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: "Payroll schedule not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error fetching payroll schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll schedule" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id
    const body = await request.json()
    const { name, days, isActive, processHour, processMinute } = body

    if (!name || !days || !Array.isArray(days)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Convert days to integers if they're not already
    const daysAsIntegers = days.map((day) => parseInt(day))

    // Make sure only one schedule is active at a time
    if (isActive) {
      await prisma.payrollSchedule.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      })
    }

    const updateData = {
      name,
      days: daysAsIntegers,
      isActive: isActive || false,
      processHour: processHour !== undefined ? parseInt(String(processHour)) : 9,
      processMinute: processMinute !== undefined ? parseInt(String(processMinute)) : 0
    } as any; // Type assertion to bypass type checking

    const schedule = await prisma.payrollSchedule.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error updating payroll schedule:", error)
    return NextResponse.json(
      { error: "Failed to update payroll schedule" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id

    await prisma.payrollSchedule.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting payroll schedule:", error)
    return NextResponse.json(
      { error: "Failed to delete payroll schedule" },
      { status: 500 }
    )
  }
} 