import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payPeriodStart, payPeriodEnd, userIds, department, role } = body

    if (!payPeriodStart || !payPeriodEnd) {
      return NextResponse.json(
        { error: "Pay period start and end dates are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(payPeriodStart)
    const endDate = new Date(payPeriodEnd)

    // Get users to generate payroll for
    const whereClause: any = {
      status: "ACTIVE",
      salary: { not: null }
    }

    // Filter by role (default to EMPLOYEE for payroll)
    if (role) {
      whereClause.role = role
    } else {
      whereClause.role = "EMPLOYEE"
    }

    // Filter by department if specified
    if (department && department !== "all") {
      whereClause.department = department
    }

    if (userIds && userIds.length > 0) {
      whereClause.id = { in: userIds }
    }

    console.log("Payroll generation whereClause:", whereClause)

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        attendanceRecords: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    console.log(`Found ${users.length} users for payroll generation`)

    if (users.length === 0) {
      return NextResponse.json(
        { 
          error: "No eligible users found for payroll generation",
          debug: {
            whereClause,
            message: "Check if users have role 'EMPLOYEE', status 'ACTIVE', and salary not null"
          }
        },
        { status: 400 }
      )
    }

    const payrollRecords = []
    const errors = []

    for (const user of users) {
      try {
        // Check if payroll already exists for this period
        const existingPayroll = await prisma.payrollRecord.findFirst({
          where: {
            userId: user.id,
            payPeriodStart: startDate,
            payPeriodEnd: endDate
          }
        })

        if (existingPayroll) {
          errors.push(`Payroll already exists for ${user.firstName} ${user.lastName}`)
          continue
        }

        // Calculate total hours worked
        const totalHours = user.attendanceRecords.reduce((sum, record) => {
          return sum + (Number(record.hoursWorked) || 0)
        }, 0)

        // Calculate regular hours (assuming 8 hours per day)
        const workingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const expectedHours = workingDays * 8
        const regularHours = Math.min(totalHours, expectedHours)
        const overtimeHours = Math.max(0, totalHours - expectedHours)

        // Calculate base salary (assuming monthly salary, convert to period)
        const monthlySalary = Number(user.salary)
        const daysInMonth = 30
        const baseSalary = (monthlySalary / daysInMonth) * workingDays

        // Calculate overtime pay (1.5x regular rate)
        const hourlyRate = monthlySalary / (daysInMonth * 8)
        const overtimePay = overtimeHours * hourlyRate * 1.5

        // Calculate deductions (basic tax and SSS - simplified)
        const taxRate = 0.12 // 12% tax
        const sssRate = 0.045 // 4.5% SSS
        const grossPay = baseSalary + overtimePay
        const taxDeduction = grossPay * taxRate
        const sssDeduction = grossPay * sssRate
        const totalDeductions = taxDeduction + sssDeduction

        const netPay = grossPay - totalDeductions

        const payrollRecord = await prisma.payrollRecord.create({
          data: {
            userId: user.id,
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            baseSalary: baseSalary,
            overtime: overtimePay,
            deductions: totalDeductions,
            bonuses: 0,
            grossPay: grossPay,
            netPay: netPay
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: true,
                position: true,
                salary: true
              }
            }
          }
        })

        payrollRecords.push(payrollRecord)
      } catch (error) {
        console.error(`Error generating payroll for user ${user.id}:`, error)
        errors.push(`Failed to generate payroll for ${user.firstName} ${user.lastName}`)
      }
    }

    return NextResponse.json({
      success: true,
      generated: payrollRecords.length,
      records: payrollRecords,
      errors: errors
    }, { status: 201 })

  } catch (error) {
    console.error("Error generating bulk payroll:", error)
    return NextResponse.json(
      { error: "Failed to generate payroll records" },
      { status: 500 }
    )
  }
} 