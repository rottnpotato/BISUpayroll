import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { AuditLogger, AuditActions, EntityTypes } from "@/lib/audit-logger"

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
    const { name, days, isActive, cutoffDays, payrollReleaseDay, processingDays, cutoffType, description } = body

    if (!name || !Array.isArray(days)) {
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

    const scheduleData: any = {
      name,
      days: daysAsIntegers,
      isActive: isActive || false
    }

    // Add optional fields if provided
    if (cutoffDays && Array.isArray(cutoffDays)) {
      scheduleData.cutoffDays = cutoffDays.map((day: any) => parseInt(day))
    }
    if (payrollReleaseDay) {
      scheduleData.payrollReleaseDay = parseInt(payrollReleaseDay)
    }
    // Add processingDays for bi-monthly schedules
    if (processingDays && Array.isArray(processingDays)) {
      scheduleData.processingDays = processingDays.map((day: any) => parseInt(day))
    }
    if (cutoffType) {
      scheduleData.cutoffType = cutoffType
    }
    if (description) {
      scheduleData.description = description
    }

    const schedule = await prisma.payrollSchedule.create({
      data: scheduleData
    })

    // Log audit event
    await AuditLogger.log({
      action: AuditActions.CREATE,
      entityType: EntityTypes.PAYROLL,
      entityId: schedule.id,
      details: `Created payroll schedule: ${schedule.name}`
    }, request)

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error("Error creating payroll schedule:", error)
    return NextResponse.json(
      { error: "Failed to create payroll schedule" },
      { status: 500 }
    )
  }
} 