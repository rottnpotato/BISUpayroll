import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      )
    }

    const csvContent = await file.text()
    
    // Parse CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    const results = {
      total: records.length,
      imported: 0,
      updated: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      
      try {
        // Validate required fields
        if (!row.employeeId || !row.date) {
          results.errors.push(`Row ${i + 1}: Missing required fields (employeeId, date)`)
          continue
        }

        // Find user by employee ID
        const user = await prisma.user.findFirst({
          where: { employeeId: row.employeeId }
        })

        if (!user) {
          results.errors.push(`Row ${i + 1}: Employee ${row.employeeId} not found`)
          continue
        }

        // Parse date
        const date = new Date(row.date)
        if (isNaN(date.getTime())) {
          results.errors.push(`Row ${i + 1}: Invalid date format`)
          continue
        }

        // Parse times if provided
        let timeIn: Date | null = null
        let timeOut: Date | null = null
        
        if (row.timeIn) {
          timeIn = new Date(`${row.date}T${row.timeIn}`)
          if (isNaN(timeIn.getTime())) {
            results.errors.push(`Row ${i + 1}: Invalid timeIn format`)
            continue
          }
        }

        if (row.timeOut) {
          timeOut = new Date(`${row.date}T${row.timeOut}`)
          if (isNaN(timeOut.getTime())) {
            results.errors.push(`Row ${i + 1}: Invalid timeOut format`)
            continue
          }
        }

        // Calculate hours worked
        let hoursWorked: number | null = null
        if (timeIn && timeOut) {
          hoursWorked = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60)
        }

        // Determine if late (assuming work starts at 8:00 AM)
        const isLate = timeIn ? (timeIn.getHours() > 8 || (timeIn.getHours() === 8 && timeIn.getMinutes() > 0)) : false
        const isAbsent = !timeIn && !timeOut

        // Check if record already exists
        const existingRecord = await prisma.attendanceRecord.findFirst({
          where: {
            userId: user.id,
            date: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lt: new Date(date.setHours(24, 0, 0, 0))
            }
          }
        })

        const attendanceData = {
          userId: user.id,
          date: new Date(row.date),
          timeIn,
          timeOut,
          hoursWorked,
          isLate,
          isAbsent
        }

        if (existingRecord) {
          // Update existing record
          await prisma.attendanceRecord.update({
            where: { id: existingRecord.id },
            data: attendanceData
          })
          results.updated++
        } else {
          // Create new record
          await prisma.attendanceRecord.create({
            data: attendanceData
          })
          results.imported++
        }

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. ${results.imported} new records imported, ${results.updated} records updated.`,
      results
    })

  } catch (error) {
    console.error("Error importing attendance data:", error)
    return NextResponse.json(
      { error: "Failed to import attendance data" },
      { status: 500 }
    )
  }
} 