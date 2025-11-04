import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { AttendanceStatus } from "@prisma/client"
import { parse } from "csv-parse/sync"
import { verifyToken } from "@/lib/auth"
import crypto from "crypto"
import { AttendancePunchType, Prisma } from "@prisma/client"
import * as XLSX from "xlsx"
import { getManilaHours, getManilaMinutes, isLateInManila } from "@/lib/timezone"
import { getWorkingDayKeysInMonth } from "@/lib/work-calendar"

const MANILA_TIME_ZONE = "Asia/Manila"
const MANILA_TIME_OFFSET_HOURS = 8

function padToTwoDigits(value: number): string {
  return String(value).padStart(2, "0")
}

function createManilaDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  // Create date in Manila time (treat as UTC+8)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  // Adjust to Manila time by subtracting the offset (so when displayed as UTC, it shows Manila time)
  const manilaTime = new Date(date.getTime() - MANILA_TIME_OFFSET_HOURS * 60 * 60 * 1000)
  return manilaTime
}

function getManilaDateKey(date: Date): string {
  // Convert UTC date back to Manila date for grouping
  const manilaTime = new Date(date.getTime() + MANILA_TIME_OFFSET_HOURS * 60 * 60 * 1000)
  const year = manilaTime.getUTCFullYear()
  const month = padToTwoDigits(manilaTime.getUTCMonth() + 1)
  const day = padToTwoDigits(manilaTime.getUTCDate())
  return `${year}-${month}-${day}`
}

function manilaDateKeyToUTC(dateKey: string): Date {
  const [yearStr, monthStr, dayStr] = dateKey.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if ([year, month, day].some(value => Number.isNaN(value))) {
    throw new Error(`Invalid Manila date key: ${dateKey}`)
  }

  // Create start of day in Manila time, then convert to UTC
  return createManilaDate(year, month, day, 0, 0)
}

function parseBiometricTimestamp(dateTimeStr: string): Date | null {
  try {
    // Clean the timestamp string - remove any extra characters after time
    const cleanDateTimeStr = dateTimeStr.replace(/[A-Za-z]\d+[A-Za-z]\d+$/, '').trim()
    const parts = cleanDateTimeStr.split(' ')
    if (parts.length < 2) return null

    const datePart = parts[0]
    const timePart = parts[1]

    const [day, month, year] = datePart.split('/').map(Number)
    if ([day, month, year].some(v => isNaN(v))) {
      console.error('Invalid date parts:', datePart)
      return null
    }

    const [hourStr, minuteStr] = timePart.split(':')
    const hour = parseInt(hourStr)
    const minute = parseInt(minuteStr) || 0

    if (isNaN(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error('Invalid time:', timePart)
      return null
    }

    const timestamp = createManilaDate(year, month, day, hour, minute)
    return isNaN(timestamp.getTime()) ? null : timestamp
  } catch (error) {
    console.error('Error parsing timestamp:', dateTimeStr, error)
    return null
  }
}

function normalizeNameForMatching(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
}

function deriveNameKeys(rawName: string) {
  const trimmed = rawName?.trim() ?? ''
  let firstName = ''
  let lastName = ''

  if (trimmed.includes(',')) {
    const [lastPart, firstMiddlePart] = trimmed.split(',').map(part => part.trim())
    lastName = lastPart ?? ''
    const firstParts = (firstMiddlePart ?? '').split(/\s+/).filter(Boolean)
    firstName = firstParts[0] ?? ''
  } else {
    const tokens = trimmed.split(/\s+/).filter(Boolean)
    if (tokens.length > 1) {
      firstName = tokens[0]
      lastName = tokens[tokens.length - 1]
    } else {
      firstName = tokens[0] ?? ''
    }
  }

  const keys = new Set<string>()
  if (trimmed) {
    keys.add(normalizeNameForMatching(trimmed))
  }
  if (firstName || lastName) {
    const firstLast = normalizeNameForMatching(`${firstName} ${lastName}`)
    const lastFirst = normalizeNameForMatching(`${lastName} ${firstName}`)
    if (firstLast) keys.add(firstLast)
    if (lastFirst) keys.add(lastFirst)
  }

  return {
    firstName,
    lastName,
    keys: Array.from(keys).filter(Boolean)
  }
}

function convertExcelToCSV(buffer: Buffer): string {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    return csv
  } catch (error) {
    console.error('Error converting Excel to CSV:', error)
    throw new Error('Failed to convert Excel file to CSV format')
  }
}

function groupPunchesIntoSequences(punches: Array<{ timestamp: Date; type: 'IN' | 'OUT' }>) {
  const sequences: Array<{ in: Date | null; out: Date | null }> = []
  let currentIn: Date | null = null

  for (const punch of punches) {
    if (punch.type === 'IN') {
      // If we already have an IN without OUT, create sequence with null OUT
      if (currentIn) {
        sequences.push({ in: currentIn, out: null })
      }
      currentIn = punch.timestamp
    } else if (punch.type === 'OUT') {
      if (currentIn) {
        sequences.push({ in: currentIn, out: punch.timestamp })
        currentIn = null
      } else {
        // OUT without previous IN - create sequence with null IN
        sequences.push({ in: null, out: punch.timestamp })
      }
    }
  }

  // Handle dangling IN
  if (currentIn) {
    sequences.push({ in: currentIn, out: null })
  }

  return sequences
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      )
    }

    // Check file extension
    const fileName = file.name.toLowerCase()
    const isCSV = fileName.endsWith('.csv')
    const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx')

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { success: false, message: "Only CSV and Excel files (.csv, .xls, .xlsx) are supported" },
        { status: 400 }
      )
    }

    let csvContent: string

    // Convert Excel to CSV if necessary
    if (isExcel) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      csvContent = convertExcelToCSV(buffer)
    } else {
      csvContent = await file.text()
    }

    const checksum = crypto.createHash('sha256').update(csvContent).digest('hex')
    const importBatch = await prisma.attendanceImportBatch.create({
      data: {
        fileName: file.name,
        fileSize: typeof file.size === 'number' ? file.size : Buffer.byteLength(csvContent, 'utf8'),
        uploadedById: user.id,
        checksum,
      }
    })

    // Parse CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    const results = {
      total: records.length,
      processed: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      warnings: [] as string[]
    }

    type PunchEntry = {
      timestamp: Date
      type: 'IN' | 'OUT'
      rawStatus: string
      locationId?: string
      department?: string
      rawName: string
      empNo?: string
    }

    const attendanceMap = new Map<string, Map<string, PunchEntry[]>>()
    const employeeMeta = new Map<string, { rawName: string; empNo?: string; nameKeys: string[] }>()

    // First pass: Parse and group all records
    for (let i = 0; i < records.length; i++) {
      const row = records[i]

      try {
        // Validate required fields
        if (!row.Name || !row['Date/Time'] || !row.Status) {
          results.errors.push(`Row ${i + 2}: Missing required fields (Name, Date/Time, Status)`)
          continue
        }

        // Parse timestamp
        const timestamp = parseBiometricTimestamp(row['Date/Time'])
        if (!timestamp) {
          results.errors.push(`Row ${i + 2}: Invalid date/time format: ${row['Date/Time']}`)
          continue
        }

        const rawStatus = String(row.Status ?? '').trim()
        const statusUpper = rawStatus.toUpperCase()
        
        let type: 'IN' | 'OUT' | null = null
        if (statusUpper.includes('IN')) {
          type = 'IN'
        } else if (statusUpper.includes('OUT')) {
          type = 'OUT'
        }
        
        if (!type) {
          results.errors.push(`Row ${i + 2}: Invalid status: ${rawStatus}`)
          continue
        }

        const dateKey = getManilaDateKey(timestamp)
        const empNo = row['No.'] ? String(row['No.']).trim() : undefined
        const employeeKey = `${empNo || ''}|${row.Name}`

        if (!attendanceMap.has(employeeKey)) {
          attendanceMap.set(employeeKey, new Map())
        }

        if (!employeeMeta.has(employeeKey)) {
          const derived = deriveNameKeys(row.Name)
          employeeMeta.set(employeeKey, {
            rawName: row.Name,
            empNo,
            nameKeys: derived.keys
          })
        }

        const employeeMap = attendanceMap.get(employeeKey)!
        if (!employeeMap.has(dateKey)) {
          employeeMap.set(dateKey, [])
        }

        employeeMap.get(dateKey)!.push({
          timestamp,
          type,
          rawStatus,
          locationId: row['Location ID'] ? String(row['Location ID']) : undefined,
          department: row.Department,
          rawName: row.Name,
          empNo
        })
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error)
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (!attendanceMap.size) {
      return NextResponse.json({
        success: true,
        message: 'Import completed. No valid rows found to process.',
        results,
        batchId: importBatch.id
      })
    }

    const allUsers = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, biometricNo: true }
    })

    const userByBiometric = new Map<string, typeof allUsers[0]>()
    const userByNameKey = new Map<string, typeof allUsers[0][]>()

    const registerNameKey = (key: string, userRecord: typeof allUsers[0]) => {
      if (!key) return
      const existing = userByNameKey.get(key)
      if (existing) {
        existing.push(userRecord)
      } else {
        userByNameKey.set(key, [userRecord])
      }
    }

    for (const userRecord of allUsers) {
      if (userRecord.biometricNo) {
        userByBiometric.set(userRecord.biometricNo.trim().toLowerCase(), userRecord)
      }

      const nameKeys = deriveNameKeys(`${userRecord.lastName}, ${userRecord.firstName}`).keys
      for (const key of nameKeys) {
        registerNameKey(key, userRecord)
      }
    }

    const resolvedUsers = new Map<string, typeof allUsers[0] | null>()

    for (const [employeeKey, meta] of employeeMeta.entries()) {
      let matchedUser: typeof allUsers[0] | undefined

      if (meta.empNo) {
        matchedUser = userByBiometric.get(meta.empNo.trim().toLowerCase())
      }

      if (!matchedUser) {
        for (const key of meta.nameKeys) {
          const candidates = userByNameKey.get(key)
          if (candidates && candidates.length > 0) {
            matchedUser = candidates[0]
            if (candidates.length > 1) {
              results.warnings.push(`Multiple employees matched name ${meta.rawName}. Using ${candidates[0].firstName} ${candidates[0].lastName}.`)
            }
            break
          }
        }
      }

      resolvedUsers.set(employeeKey, matchedUser ?? null)
    }

    const userIds = new Set<string>()
    let minDate: Date | null = null
    let maxDate: Date | null = null

    for (const [employeeKey, dateMap] of attendanceMap.entries()) {
      const matchedUser = resolvedUsers.get(employeeKey)
      if (!matchedUser) continue

      userIds.add(matchedUser.id)

      for (const dateKey of dateMap.keys()) {
        const date = manilaDateKeyToUTC(dateKey)
        if (!minDate || date < minDate) {
          minDate = date
        }
        if (!maxDate || date > maxDate) {
          maxDate = date
        }
      }
    }

    let existingRecords: Array<{
      id: string
      userId: string
      date: Date
    }> = []

    if (userIds.size && minDate && maxDate) {
      const rangeStart = new Date(minDate.getTime())
      const rangeEnd = new Date(maxDate.getTime() + 24 * 60 * 60 * 1000)
      
      existingRecords = await prisma.attendanceRecord.findMany({
        where: {
          userId: { in: Array.from(userIds) },
          date: {
            gte: rangeStart,
            lt: rangeEnd
          }
        }
      })
    }

    const existingRecordLookup = new Map<string, (typeof existingRecords)[number]>()
    for (const record of existingRecords) {
      const dateKey = getManilaDateKey(record.date)
      existingRecordLookup.set(`${record.userId}|${dateKey}`, record)
    }

    const attendanceCreates: Prisma.AttendanceRecordCreateManyInput[] = []
    const attendanceUpdates: Array<{ id: string; data: Prisma.AttendanceRecordUncheckedUpdateInput }> = []
    const punchPayloads: Prisma.AttendancePunchCreateManyInput[] = []

    for (const [employeeKey, dateMap] of attendanceMap.entries()) {
      const meta = employeeMeta.get(employeeKey)!
      const matchedUser = resolvedUsers.get(employeeKey)

      if (!matchedUser) {
        results.errors.push(`Employee not found: ${meta.rawName}`)
        results.skipped += dateMap.size
        continue
      }

      for (const [dateKey, punches] of dateMap.entries()) {
        try {
          const sortedPunches = punches
            .slice()
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

          // Group punches into IN/OUT sequences
          const sequences = groupPunchesIntoSequences(sortedPunches)
          
          let morningTimeIn: Date | null = null
          let morningTimeOut: Date | null = null
          let afternoonTimeIn: Date | null = null
          let afternoonTimeOut: Date | null = null
          let totalSessions = 0
          let hoursWorked = 0

          // Process sequences for morning and afternoon
          for (let i = 0; i < sequences.length; i++) {
            const sequence = sequences[i]
            
            if (sequence.in && sequence.out) {
              const sessionHours = (sequence.out.getTime() - sequence.in.getTime()) / (1000 * 60 * 60)
              
              // Get Manila hours for both timestamps
              const inHour = getManilaHours(sequence.in)
              const outHour = getManilaHours(sequence.out)
              
              // Define session boundaries: morning is before 12:00, afternoon is 13:00 or later
              const isMorningIn = inHour < 12
              const isAfternoonIn = inHour >= 13
              const isAfternoonOut = outHour >= 13
              
              // Determine session assignment based on time ranges
              if (totalSessions === 0) {
                // First session
                if (isMorningIn && isAfternoonOut) {
                  // Single full-day session: morning IN, afternoon OUT (no morning OUT or afternoon IN)
                  morningTimeIn = sequence.in
                  morningTimeOut = null
                  afternoonTimeIn = null
                  afternoonTimeOut = sequence.out
                  hoursWorked += sessionHours
                  totalSessions = 2 // Count as full day
                } else if (isMorningIn) {
                  // Morning session only
                  morningTimeIn = sequence.in
                  morningTimeOut = sequence.out
                  hoursWorked += sessionHours
                  totalSessions++
                } else if (isAfternoonIn) {
                  // Afternoon session only (e.g., 4:49 PM IN)
                  afternoonTimeIn = sequence.in
                  afternoonTimeOut = sequence.out
                  hoursWorked += sessionHours
                  totalSessions++
                } else {
                  // Lunch time IN (12:00-12:59), treat as afternoon
                  afternoonTimeIn = sequence.in
                  afternoonTimeOut = sequence.out
                  hoursWorked += sessionHours
                  totalSessions++
                }
              } 
              // Second session
              else if (totalSessions === 1) {
                // Assign to whichever session is not yet filled
                if (!afternoonTimeIn && !afternoonTimeOut) {
                  afternoonTimeIn = sequence.in
                  afternoonTimeOut = sequence.out
                  hoursWorked += sessionHours
                  totalSessions++
                } else if (!morningTimeIn && !morningTimeOut) {
                  morningTimeIn = sequence.in
                  morningTimeOut = sequence.out
                  hoursWorked += sessionHours
                  totalSessions++
                }
              }
              // More than 2 sessions - log warning
              else if (totalSessions >= 2) {
                results.warnings.push(
                  `${meta.rawName} on ${dateKey}: More than 2 sessions detected. Only using first 2 sessions.`
                )
              }
            }
          }

          const timeIn = morningTimeIn || afternoonTimeIn || sortedPunches[0]?.timestamp || null
          const timeOut = afternoonTimeOut || morningTimeOut || null

          // Calculate late status based on Manila time for morning time-in
          const isLate = morningTimeIn ? isLateInManila(morningTimeIn, 8, 15) : false

          const isAbsent = !timeOut || !timeIn

          // Determine half-day rules for single-session days based on Manila local time:
          // - If only one IN/OUT pair and OUT is before 1:00 PM, mark half-day
          // - If OUT is 5:00 PM or later, it's a whole day
          // - Between 1:00 PM and before 5:00 PM, treat as half-day and early-out
          let isHalfDay = false
          if (totalSessions <= 1) {
            if (!timeOut) {
              isHalfDay = true
            } else {
              const outH = getManilaHours(timeOut)
              const outM = getManilaMinutes(timeOut)
              if (outH < 13) {
                // Strictly before 1:00 PM counts as half-day
                isHalfDay = true
              } else if (outH >= 17) {
                isHalfDay = false
              } else {
                // 1:01 PM up to 4:59 PM
                isHalfDay = true
              }
            }
          }

          // Early out if final OUT is before 5:00 PM Manila
          const isEarlyOut = timeOut ? (() => {
            const h = getManilaHours(timeOut)
            return h < 17
          })() : false

          const recordDate = manilaDateKeyToUTC(dateKey)
          const hoursWorkedValue = hoursWorked > 0 ? parseFloat(hoursWorked.toFixed(2)) : null
          const recordKey = `${matchedUser.id}|${dateKey}`
          const existingRecord = existingRecordLookup.get(recordKey)

          const createPayload: Prisma.AttendanceRecordCreateManyInput = {
            userId: matchedUser.id,
            date: recordDate,
            timeIn,
            timeOut,
            hoursWorked: hoursWorkedValue,
            isLate,
            isAbsent,
            morningTimeIn,
            morningTimeOut,
            afternoonTimeIn,
            afternoonTimeOut,
            isHalfDay,
            isEarlyOut,
            totalSessions,
            sessionType: isAbsent ? null : (isHalfDay ? 'HALF_DAY' : 'FULL_DAY'),
            status: AttendanceStatus.APPROVED,
            importBatchId: importBatch.id
          }

          if (existingRecord) {
            attendanceUpdates.push({
              id: existingRecord.id,
              data: {
                timeIn,
                timeOut,
                hoursWorked: hoursWorkedValue,
                isLate,
                isAbsent,
                morningTimeIn,
                morningTimeOut,
                afternoonTimeIn,
                afternoonTimeOut,
                isHalfDay,
                isEarlyOut,
                totalSessions,
                sessionType: isAbsent ? null : (isHalfDay ? 'HALF_DAY' : 'FULL_DAY'),
                status: AttendanceStatus.APPROVED,
                importBatchId: importBatch.id
              }
            })
            results.updated++
          } else {
            attendanceCreates.push(createPayload)
            results.imported++
          }

          for (const punch of sortedPunches) {
            punchPayloads.push({
              userId: matchedUser.id,
              timestamp: punch.timestamp,
              type: punch.type === 'IN' ? AttendancePunchType.IN : AttendancePunchType.OUT,
              rawStatus: punch.rawStatus,
              department: punch.department ?? null,
              locationId: punch.locationId ?? null,
              rawName: punch.rawName,
              importBatchId: importBatch.id
            })
          }

          results.processed++
        } catch (error) {
          console.error(`Error processing attendance for ${meta.rawName} on ${dateKey}:`, error)
          results.errors.push(`${meta.rawName} on ${dateKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // After processing all imported attendance, check for missing working days
    // and mark employees absent if they have no entry or only IN without OUT
    if (minDate && maxDate) {
      // Get all unique year-month combinations in the date range
      const monthsToCheck = new Set<string>()
      for (let d = new Date(minDate); d <= maxDate; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
        const manilaTime = new Date(d.getTime() + MANILA_TIME_OFFSET_HOURS * 60 * 60 * 1000)
        const year = manilaTime.getUTCFullYear()
        const month = manilaTime.getUTCMonth() + 1
        monthsToCheck.add(`${year}-${month}`)
      }

      // Load working days for each month
      const workingDaysMap = new Map<string, Set<string>>()
      for (const yearMonth of monthsToCheck) {
        const [yearStr, monthStr] = yearMonth.split('-')
        const year = parseInt(yearStr)
        const month = parseInt(monthStr)
        const workingDays = await getWorkingDayKeysInMonth(year, month)
        
        // Filter working days to only those in the import date range
        const filteredWorkingDays = new Set<string>()
        for (const dateKey of workingDays) {
          const workingDate = manilaDateKeyToUTC(dateKey)
          if (workingDate >= minDate && workingDate <= maxDate) {
            filteredWorkingDays.add(dateKey)
          }
        }
        
        workingDaysMap.set(yearMonth, filteredWorkingDays)
      }

      // Combine all working days across the import range
      const allWorkingDayKeys = new Set<string>()
      for (const workingDays of workingDaysMap.values()) {
        for (const dateKey of workingDays) {
          allWorkingDayKeys.add(dateKey)
        }
      }

      // For each matched employee, check if they have attendance on all working days
      for (const [employeeKey, meta] of employeeMeta.entries()) {
        const matchedUser = resolvedUsers.get(employeeKey)
        if (!matchedUser) continue

        const employeeAttendance = attendanceMap.get(employeeKey) || new Map()
        
        // Check each working day
        for (const workingDayKey of allWorkingDayKeys) {
          const recordKey = `${matchedUser.id}|${workingDayKey}`
          
          // Skip if we already have an attendance record for this day
          if (employeeAttendance.has(workingDayKey)) {
            continue
          }
          
          // Skip if this record already exists in the database (to avoid duplicates)
          if (existingRecordLookup.has(recordKey)) {
            continue
          }
          
          // No attendance data for this working day - mark as absent
          const recordDate = manilaDateKeyToUTC(workingDayKey)
          
          const absencePayload: Prisma.AttendanceRecordCreateManyInput = {
            userId: matchedUser.id,
            date: recordDate,
            timeIn: null,
            timeOut: null,
            hoursWorked: null,
            isLate: false,
            isAbsent: true,
            morningTimeIn: null,
            morningTimeOut: null,
            afternoonTimeIn: null,
            afternoonTimeOut: null,
            isHalfDay: false,
            isEarlyOut: false,
            totalSessions: 0,
            sessionType: null,
            status: AttendanceStatus.APPROVED,
            importBatchId: importBatch.id
          }
          
          attendanceCreates.push(absencePayload)
          results.imported++
          results.processed++
        }
      }
    }

    // Execute database operations in chunks
    const CREATE_CHUNK_SIZE = 500
    for (let i = 0; i < attendanceCreates.length; i += CREATE_CHUNK_SIZE) {
      const chunk = attendanceCreates.slice(i, i + CREATE_CHUNK_SIZE)
      if (chunk.length === 0) continue
      await prisma.attendanceRecord.createMany({ data: chunk })
    }

    const UPDATE_CHUNK_SIZE = 50
    for (let i = 0; i < attendanceUpdates.length; i += UPDATE_CHUNK_SIZE) {
      const chunk = attendanceUpdates.slice(i, i + UPDATE_CHUNK_SIZE)
      if (!chunk.length) continue
      await prisma.$transaction(
        chunk.map(update =>
          prisma.attendanceRecord.update({
            where: { id: update.id },
            data: update.data
          })
        )
      )
    }

    const PUNCH_CHUNK_SIZE = 500
    for (let i = 0; i < punchPayloads.length; i += PUNCH_CHUNK_SIZE) {
      const chunk = punchPayloads.slice(i, i + PUNCH_CHUNK_SIZE)
      if (!chunk.length) continue
      await prisma.attendancePunch.createMany({ data: chunk, skipDuplicates: true })
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. ${results.imported} new records imported, ${results.updated} records updated. Absence records created for employees missing on valid working days.`,
      results,
      batchId: importBatch.id
    })
  } catch (error) {
    console.error("Error importing attendance data:", error)
    return NextResponse.json(
      { success: false, message: "Failed to import attendance data", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}