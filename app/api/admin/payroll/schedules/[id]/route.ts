import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { AuditLogger, AuditActions, EntityTypes } from "@/lib/audit-logger"

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
    const { name, days, isActive, cutoffDays, payrollReleaseDay, processingDays, cutoffType, paymentMethod, description } = body

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

    const updateData: any = {
      name,
      days: daysAsIntegers,
      isActive: isActive || false
    }

    // Add optional fields if provided
    if (cutoffDays && Array.isArray(cutoffDays)) {
      updateData.cutoffDays = cutoffDays.map((day: any) => parseInt(day))
    }
    if (payrollReleaseDay) {
      updateData.payrollReleaseDay = parseInt(payrollReleaseDay)
    }
    // Add processingDays for bi-monthly schedules
    if (processingDays && Array.isArray(processingDays)) {
      updateData.processingDays = processingDays.map((day: any) => parseInt(day))
    }
    if (cutoffType) {
      updateData.cutoffType = cutoffType
    }
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }
    if (description) {
      updateData.description = description
    }

      const schedule = await prisma.payrollSchedule.update({
    where: { id },
    data: updateData
  })

  // Log audit event
  await AuditLogger.log({
    action: AuditActions.UPDATE,
    entityType: EntityTypes.PAYROLL,
    entityId: id,
    details: `Updated payroll schedule: ${schedule.name}`
  }, request)

  return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error updating payroll schedule:", error)
    return NextResponse.json(
      { error: "Failed to update payroll schedule" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id
    const body = await request.json()
    const { isActive } = body

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

      const schedule = await prisma.payrollSchedule.update({
    where: { id },
    data: { isActive }
  })

  // Log audit event
  await AuditLogger.log({
    action: AuditActions.UPDATE,
    entityType: EntityTypes.PAYROLL,
    entityId: id,
    details: `${isActive ? 'Activated' : 'Deactivated'} payroll schedule: ${schedule.name}`
  }, request)

  return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error updating payroll schedule status:", error)
    return NextResponse.json(
      { error: "Failed to update payroll schedule status" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id

    // Get schedule name before deletion for audit log
    const schedule = await prisma.payrollSchedule.findUnique({
      where: { id }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: "Payroll schedule not found" },
        { status: 404 }
      )
    }

    await prisma.payrollSchedule.delete({
      where: { id }
    })

    // Log audit event
    await AuditLogger.log({
      action: AuditActions.DELETE,
      entityType: EntityTypes.PAYROLL,
      entityId: id,
      details: `Deleted payroll schedule: ${schedule.name}`
    }, request)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting payroll schedule:", error)
    return NextResponse.json(
      { error: "Failed to delete payroll schedule" },
      { status: 500 }
    )
  }
} 