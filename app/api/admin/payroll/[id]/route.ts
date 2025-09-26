import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = await prisma.payrollRecord.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
        
          }
        }
      }
    })

    if (!record) {
      return NextResponse.json(
        { error: "Payroll record not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ record })
  } catch (error) {
    console.error("Error fetching payroll record:", error)
    return NextResponse.json(
      { error: "Failed to fetch payroll record" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      payPeriodStart,
      payPeriodEnd,
      baseSalary,
      overtime,
      deductions,
      bonuses,
      isPaid
    } = body

    // Check if record exists
    const existingRecord = await prisma.payrollRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Payroll record not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (payPeriodStart) updateData.payPeriodStart = new Date(payPeriodStart)
    if (payPeriodEnd) updateData.payPeriodEnd = new Date(payPeriodEnd)
    if (baseSalary) updateData.baseSalary = parseFloat(baseSalary)
    if (overtime !== undefined) updateData.overtime = overtime
    if (deductions !== undefined) updateData.deductions = deductions
    if (bonuses !== undefined) updateData.bonuses = bonuses
    if (typeof isPaid === 'boolean') {
      updateData.isPaid = isPaid
      if (isPaid) {
        updateData.paidAt = new Date()
      } else {
        updateData.paidAt = null
      }
    }

    // Recalculate gross and net pay if financial values changed
    if (baseSalary || overtime !== undefined || deductions !== undefined || bonuses !== undefined) {
      const newBaseSalary = baseSalary ? parseFloat(baseSalary) : existingRecord.baseSalary
      const newOvertime = overtime !== undefined ? overtime : existingRecord.overtime
      const newDeductions = deductions !== undefined ? deductions : existingRecord.deductions
      const newBonuses = bonuses !== undefined ? bonuses : existingRecord.bonuses

      updateData.grossPay = Number(newBaseSalary) + Number(newOvertime) + Number(newBonuses)
      updateData.netPay = updateData.grossPay - Number(newDeductions)
    }

    const record = await prisma.payrollRecord.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
      
          }
        }
      }
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error("Error updating payroll record:", error)
    return NextResponse.json(
      { error: "Failed to update payroll record" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if record exists
    const existingRecord = await prisma.payrollRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Payroll record not found" },
        { status: 404 }
      )
    }

    await prisma.payrollRecord.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Payroll record deleted successfully" })
  } catch (error) {
    console.error("Error deleting payroll record:", error)
    return NextResponse.json(
      { error: "Failed to delete payroll record" },
      { status: 500 }
    )
  }
} 