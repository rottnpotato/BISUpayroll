import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const schedules = await prisma.payrollSchedule.findMany({
      where,
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching payroll schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll schedules" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    const schedule = await prisma.payrollSchedule.create({
      data: {
        name,
        days: daysAsIntegers,
        isActive: isActive || false,
        processHour: processHour !== undefined ? parseInt(processHour) : 9,
        processMinute: processMinute !== undefined ? parseInt(processMinute) : 0
      }
    })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error("Error creating payroll schedule:", error)
    return NextResponse.json(
      { error: "Failed to create payroll schedule" },
      { status: 500 }
    )
  }
} 