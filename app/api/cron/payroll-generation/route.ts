import { NextRequest, NextResponse } from "next/server"

/**
 * Cron job endpoint for automatic payroll generation
 * This should be called by an external cron service (e.g., Vercel Cron, cron-job.org, etc.)
 * at regular intervals (e.g., daily at 8:00 AM)
 * 
 * Security: In production, this should be protected with a secret token
 * Example: Add ?secret=YOUR_SECRET_TOKEN to the URL and validate it
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Validate secret token for security
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Check if secret matches (if CRON_SECRET is set in environment)
    const expectedSecret = process.env.CRON_SECRET
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log('[CRON] Running scheduled payroll generation check...')

    // Call the auto-generate endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     (request.headers.get('host') 
                       ? `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`
                       : 'http://localhost:3000')
    
    const response = await fetch(`${baseUrl}/api/admin/payroll/auto-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to trigger automatic payroll generation')
    }

    const result = await response.json()

    console.log('[CRON] Payroll generation check completed:', result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    })

  } catch (error) {
    console.error("[CRON] Error in scheduled payroll generation:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to run scheduled payroll generation",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint as an alternative to GET for cron services that prefer POST
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
