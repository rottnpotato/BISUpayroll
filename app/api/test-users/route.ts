import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get all users and their details for debugging
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeId: true,
        department: true,
        position: true,
        salary: true
      }
    })

    // Filter employees specifically
    const employees = allUsers.filter(user => user.role === 'EMPLOYEE')
    const activeEmployees = employees.filter(user => user.status === 'ACTIVE')
    const employeesWithSalary = activeEmployees.filter(user => user.salary !== null)

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      employeesWithSalary: employeesWithSalary.length,
      breakdown: {
        roles: allUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        statuses: allUsers.reduce((acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        withSalary: allUsers.filter(user => user.salary !== null).length,
        withoutSalary: allUsers.filter(user => user.salary === null).length
      },
      sampleEmployees: employeesWithSalary.slice(0, 3),
      allUsers: allUsers
    })
  } catch (error) {
    console.error("Error fetching test users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
} 