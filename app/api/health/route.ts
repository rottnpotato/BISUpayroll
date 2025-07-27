import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    const auditLogCount = await prisma.auditLog.count()
    
    return NextResponse.json({
      status: "healthy",
      database: {
        connected: true,
        userCount,
        auditLogCount
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      { 
        status: "unhealthy",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
