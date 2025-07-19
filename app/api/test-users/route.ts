import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        position: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    const totalCount = await prisma.user.count()

    return NextResponse.json({
      success: true,
      totalCount,
      users
    })
  } catch (error) {
    console.error("Error fetching test users:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch test users",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 