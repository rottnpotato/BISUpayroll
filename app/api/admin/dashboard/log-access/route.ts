import { NextRequest, NextResponse } from "next/server"
import { AuditLogger } from "@/lib/audit-logger"

export async function POST(request: NextRequest) {
  try {
    const { userId, action, details } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Log the dashboard view
    await AuditLogger.log({
      userId,
      action: action || 'view',
      entityType: 'Dashboard',
      details: details || 'Admin dashboard accessed'
    }, request)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging dashboard access:", error)
    return NextResponse.json(
      { error: "Failed to log access" },
      { status: 500 }
    )
  }
}
