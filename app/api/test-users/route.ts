import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

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
        position: true
      }
    })

    // Filter employees specifically
    const employees = allUsers.filter(user => user.role === 'EMPLOYEE')
    const activeEmployees = employees.filter(user => user.status === 'ACTIVE')

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      breakdown: {
        roles: allUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        statuses: allUsers.reduce((acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      sampleEmployees: activeEmployees.slice(0, 3),
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