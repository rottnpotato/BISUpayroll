import { NextRequest, NextResponse } from "next/server"

// Mock external data sources for Philippines government contribution rates
// In a real implementation, these would call actual government APIs

const MOCK_GSIS_RATES = {
  gsis: {
    employeeRate: 9.0,
    employerRate: 12.0,
    minSalary: 5000,
    maxSalary: 100000,
    lastUpdated: new Date().toISOString(),
    source: "GSIS Official"
  }
}

const MOCK_PHILHEALTH_RATES = {
  philHealth: {
    employeeRate: 2.75,
    employerRate: 2.75,
    minContribution: 200,
    maxContribution: 1750,
    minSalary: 8000,
    maxSalary: 70000,
    lastUpdated: new Date().toISOString(),
    source: "PhilHealth Official"
  }
}

const MOCK_PAGIBIG_RATES = {
  pagibig: {
    employeeRate: 2.0,
    employerRate: 2.0,
    minContribution: 24,
    maxContribution: 200,
    minSalary: 1200,
    maxSalary: 10000,
    lastUpdated: new Date().toISOString(),
    source: "Pag-IBIG Official"
  }
}

const MOCK_TAX_BRACKETS = {
  brackets: [
    { min: 0, max: 20833, rate: 0, description: "₱0 - ₱250,000 annually" },
    { min: 20834, max: 33333, rate: 20, description: "₱250,001 - ₱400,000 annually" },
    { min: 33334, max: 66667, rate: 25, description: "₱400,001 - ₱800,000 annually" },
    { min: 66668, max: 166667, rate: 30, description: "₱800,001 - ₱2,000,000 annually" },
    { min: 166668, max: 666667, rate: 32, description: "₱2,000,001 - ₱8,000,000 annually" },
    { min: 666668, max: 999999999, rate: 35, description: "Above ₱8,000,000 annually" }
  ],
  lastUpdated: new Date().toISOString(),
  source: "BIR TRAIN Law 2024"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get("type")

    if (!dataType) {
      return NextResponse.json(
        { error: "Data type parameter is required" },
        { status: 400 }
      )
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    switch (dataType) {
      case 'gsis':
        return NextResponse.json({
          success: true,
          data: MOCK_GSIS_RATES,
          message: "GSIS rates retrieved successfully"
        })

      case 'philhealth':
        return NextResponse.json({
          success: true,
          data: MOCK_PHILHEALTH_RATES,
          message: "PhilHealth rates retrieved successfully"
        })

      case 'pagibig':
        return NextResponse.json({
          success: true,
          data: MOCK_PAGIBIG_RATES,
          message: "Pag-IBIG rates retrieved successfully"
        })

      case 'tax_brackets':
        return NextResponse.json({
          success: true,
          data: MOCK_TAX_BRACKETS,
          message: "Tax brackets retrieved successfully"
        })

      case 'all_contributions':
        return NextResponse.json({
          success: true,
          data: {
            ...MOCK_GSIS_RATES,
            ...MOCK_PHILHEALTH_RATES,
            ...MOCK_PAGIBIG_RATES
          },
          message: "All contribution rates retrieved successfully"
        })

      default:
        return NextResponse.json(
          { error: "Invalid data type" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error fetching external data:", error)
    return NextResponse.json(
      { error: "Failed to fetch external data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, endpoint, apiKey } = body

    if (!type || !endpoint) {
      return NextResponse.json(
        { error: "Type and endpoint are required" },
        { status: 400 }
      )
    }

    // Store API configuration (mock implementation)
    // In a real application, you would store this securely
    const apiConfig = {
      type,
      endpoint,
      apiKey: apiKey ? "***masked***" : null,
      lastConfigured: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: "API configuration saved successfully",
      config: apiConfig
    })
  } catch (error) {
    console.error("Error saving API configuration:", error)
    return NextResponse.json(
      { error: "Failed to save API configuration" },
      { status: 500 }
    )
  }
}