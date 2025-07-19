import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      // Get specific setting
      const setting = await prisma.systemSettings.findUnique({
        where: { key }
      })

      if (!setting) {
        return NextResponse.json(
          { error: "Setting not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ setting })
    } else {
      // Get all settings
      const settings = await prisma.systemSettings.findMany({
        orderBy: { key: "asc" }
      })

      return NextResponse.json({ settings })
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      )
    }

    // Check if setting already exists
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key }
    })

    if (existingSetting) {
      return NextResponse.json(
        { error: "Setting already exists" },
        { status: 409 }
      )
    }

    const setting = await prisma.systemSettings.create({
      data: {
        key,
        value: String(value)
      }
    })

    return NextResponse.json({ setting }, { status: 201 })
  } catch (error) {
    console.error("Error creating setting:", error)
    return NextResponse.json(
      { error: "Failed to create setting" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: "Settings must be an array" },
        { status: 400 }
      )
    }

    // Update multiple settings
    const updatePromises = settings.map(({ key, value }) =>
      prisma.systemSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    )

    const updatedSettings = await Promise.all(updatePromises)

    return NextResponse.json({ settings: updatedSettings })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
} 