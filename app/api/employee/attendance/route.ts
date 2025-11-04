import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { AttendancePunchType } from '@prisma/client'

const ADMIN_APPROVED_STATUS = 'APPROVED'
const ADMIN_REJECTED_STATUS = 'REJECTED'
const ATTENDANCE_PENDING_STATUS = 'PENDING'

const hasAdminLock = (record: any) =>
  Boolean(
    record?.approvedById &&
    record?.status === ADMIN_APPROVED_STATUS &&
    record?.timeIn &&
    record?.timeOut
  )

const hasAdminRejection = (record: any) =>
  Boolean(record?.approvedById && record?.status === ADMIN_REJECTED_STATUS)

const calculateHoursBetween = (start: Date, end: Date): number =>
  Math.max(0, parseFloat(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2)))

const determineStatusAfterAutoDecision = (
  currentStatus: string | null | undefined,
  shouldAutoApprove: boolean
) => {
  if (!shouldAutoApprove) return ATTENDANCE_PENDING_STATUS
  if (!currentStatus || currentStatus === ADMIN_APPROVED_STATUS) return ADMIN_APPROVED_STATUS
  return currentStatus
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Fetch normalized attendance records with session details for the specified month
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        overloadRecords: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        overtimeRequests: {
          include: {
            approvedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Helpers
    const calcHours = (start?: Date | null, end?: Date | null) => {
      if (!start || !end) return 0
      const diff = end.getTime() - start.getTime()
      if (diff <= 0) return 0
      return Math.round((diff / (1000 * 60 * 60)) * 100) / 100
    }

    const toNumber = (val: any): number => {
      if (val == null) return 0
      try {
        if (typeof val === 'object' && typeof val.toNumber === 'function') return val.toNumber()
      } catch {}
      const n = Number(val)
      return isNaN(n) ? 0 : n
    }

    // Calculate summary statistics
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter((r) => {
      const anyCompletedSession = Boolean(
        (r.morningTimeIn && r.morningTimeOut) ||
          (r.afternoonTimeIn && r.afternoonTimeOut) ||
          (r.timeIn && r.timeOut)
      )
      const hours = toNumber((r as any).hoursWorked)
      return anyCompletedSession || hours > 0
    }).length

    const absentDays = attendanceRecords.filter((r) => {
      if (typeof (r as any).isAbsent === 'boolean') return (r as any).isAbsent
      const anyCompletedSession = Boolean(
        (r.morningTimeIn && r.morningTimeOut) ||
          (r.afternoonTimeIn && r.afternoonTimeOut) ||
          (r.timeIn && r.timeOut)
      )
      return !anyCompletedSession
    }).length

    const lateDays = attendanceRecords.filter((r) => (r as any).isLate).length

    let totalHours = attendanceRecords.reduce((sum, r) => {
      const stored = toNumber((r as any).hoursWorked)
      if (stored > 0) return sum + stored
      // Fallback: compute from sessions
      const morning = calcHours((r as any).morningTimeIn, (r as any).morningTimeOut)
      const afternoon = calcHours((r as any).afternoonTimeIn, (r as any).afternoonTimeOut)
      const combined = morning + afternoon
      return sum + combined
    }, 0)

    const averageHoursPerDay = totalDays > 0 ? parseFloat((totalHours / totalDays).toFixed(2)) : 0

    // Format the records for the response
    const formattedRecords = attendanceRecords.map((r) => {
      const dateObj = new Date(r.date)
      const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj)

      const fmt = (d?: Date | null) => (d ? formatTime(d) : null)

      const morningIn = fmt((r as any).morningTimeIn)
      const morningOut = fmt((r as any).morningTimeOut)
      const afternoonIn = fmt((r as any).afternoonTimeIn)
      const afternoonOut = fmt((r as any).afternoonTimeOut)

      // Backward-compat overall time in/out (earliest in, latest out)
      const overallInDate: Date | null = (r as any).timeIn || (r as any).morningTimeIn || (r as any).afternoonTimeIn || null
      const overallOutDate: Date | null = (r as any).timeOut || (r as any).afternoonTimeOut || (r as any).morningTimeOut || null

      const timeIn = fmt(overallInDate)
      const timeOut = fmt(overallOutDate)

      const storedHours = toNumber((r as any).hoursWorked)
      const computedHours = calcHours((r as any).morningTimeIn, (r as any).morningTimeOut) +
        calcHours((r as any).afternoonTimeIn, (r as any).afternoonTimeOut)
      const hours = storedHours > 0 ? storedHours : computedHours

      let status = 'Absent'
      const isHalfDay = Boolean((r as any).isHalfDay)
      const isLate = Boolean((r as any).isLate)
      const hasAnyIn = Boolean((r as any).timeIn || (r as any).morningTimeIn || (r as any).afternoonTimeIn)
      if ((r as any).isAbsent) {
        status = 'Absent'
      } else if (isHalfDay) {
        status = 'Half-Day'
      } else if (hasAnyIn) {
        status = isLate ? 'Late' : 'On Time'
      }

      return {
        id: r.id,
        date: dateObj.toISOString().split('T')[0],
        dayOfWeek,
        timeIn,
        timeOut,
        status,
        hours,
        approvalStatus: (r as any).status || 'APPROVED',
        rejectionReason: (r as any).rejectionReason || null,
        approvedAt: (r as any).approvedAt ? new Date((r as any).approvedAt).toISOString() : null,
        // Session fields for UI
        morningTimeIn: morningIn,
        morningTimeOut: morningOut,
        afternoonTimeIn: afternoonIn,
        afternoonTimeOut: afternoonOut,
        isHalfDay,
        isEarlyOut: Boolean((r as any).isEarlyOut),
        earlyOutReason: (r as any).earlyOutReason || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        records: formattedRecords,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          totalHours,
          averageHoursPerDay
        }
      }
    })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching attendance records'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user || user.role !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    // Get action from request body
    const body = await request.json()
    const action = body.action // 'time-in' or 'time-out'
    const skipTimeRestrictions = body.skipTimeRestrictions || false // Testing mode flag

    if (!action || (action !== 'time-in' && action !== 'time-out')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Must be "time-in" or "time-out"' 
      }, { status: 400 })
    }

    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // Get system configurations for working hours and attendance policies
    let systemConfigs: Array<{key: string, value: string}> = []
    try {
      systemConfigs = await prisma.systemSettings.findMany({
        where: {
          key: {
            in: [
              'working_hours_dailyHours',
              'working_hours_lateGraceMinutes',
              'attendance_morning_start',
              'attendance_morning_end',
              'attendance_afternoon_start',
              'attendance_afternoon_end',
              'attendance_allow_half_day',
              'attendance_allow_early_out',
              'attendance_early_out_threshold_minutes',
              'attendance_half_day_minimum_hours',
              'attendance_prevent_duplicate_entries',
              'attendance_duplicate_range_hours'
            ]
          }
        }
      })
    } catch (configError) {
      console.error('Error fetching system configurations:', configError)
      // Use default values if system settings table doesn't exist or has issues
      systemConfigs = []
    }

    const configs = systemConfigs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, string>)

    const dailyHours = parseFloat(configs['working_hours_dailyHours'] || '8')
    const lateGraceMinutes = parseInt(configs['working_hours_lateGraceMinutes'] || '15')
    
    // New attendance policy configurations
    const morningStart = configs['attendance_morning_start'] || '08:00'
    const morningEnd = configs['attendance_morning_end'] || '12:00'
    const afternoonStart = configs['attendance_afternoon_start'] || '13:00'
    const afternoonEnd = configs['attendance_afternoon_end'] || '17:00'
    const allowHalfDay = configs['attendance_allow_half_day'] === 'true'
    const allowEarlyOut = configs['attendance_allow_early_out'] === 'true'
    const earlyOutThresholdMinutes = parseInt(configs['attendance_early_out_threshold_minutes'] || '60')
    const halfDayMinimumHours = parseFloat(configs['attendance_half_day_minimum_hours'] || '4')
    const preventDuplicateEntries = configs['attendance_prevent_duplicate_entries'] === 'true'
    const duplicateRangeHours = parseInt(configs['attendance_duplicate_range_hours'] || '2')
    
    // Helper function to parse time string (HH:MM) to minutes from midnight
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    // Helper function to get current session type based on time
    const getCurrentSessionType = (currentTimeMinutes: number): 'morning' | 'afternoon' | null => {
      const morningStartMinutes = timeToMinutes(morningStart)
      const morningEndMinutes = timeToMinutes(morningEnd)
      const afternoonStartMinutes = timeToMinutes(afternoonStart)
      const afternoonEndMinutes = timeToMinutes(afternoonEnd)
      
      if (currentTimeMinutes >= morningStartMinutes && currentTimeMinutes <= morningEndMinutes) {
        return 'morning'
      } else if (currentTimeMinutes >= afternoonStartMinutes && currentTimeMinutes <= afternoonEndMinutes) {
        return 'afternoon'
      }
      return null
    }

    // Define standard work hours (8:00 AM)
    const workStartHour = 8
    const workStartMinute = 0

    // Find today's attendance record
    let attendanceRecord
    try {
      attendanceRecord = await prisma.attendanceRecord.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
    } catch (attendanceError) {
      console.error('Error fetching attendance record:', attendanceError)
      throw new Error('Failed to fetch attendance record from database')
    }

    if (attendanceRecord) {
      if (hasAdminRejection(attendanceRecord)) {
        return NextResponse.json({
          success: false,
          message: 'This attendance was rejected by a supervisor and cannot be modified. Please contact your supervisor for further assistance.'
        }, { status: 403 })
      }

      // Only lock records that have completed punches and were explicitly approved
      if (hasAdminLock(attendanceRecord)) {
        return NextResponse.json({
          success: false,
          message: 'This attendance was already approved by a supervisor and can no longer be changed. Please coordinate with your supervisor for adjustments.'
        }, { status: 403 })
      }
    }

    // Check for duplicate entries within acceptable range if prevention is enabled
    if (preventDuplicateEntries && action === 'time-in') {
      const rangeStart = new Date(now.getTime() - (duplicateRangeHours * 60 * 60 * 1000))
      const rangeEnd = new Date(now.getTime() + (duplicateRangeHours * 60 * 60 * 1000))
      
      const duplicateEntries = await prisma.attendanceRecord.findMany({
        where: {
          userId: user.id,
          timeIn: {
            gte: rangeStart,
            lte: rangeEnd
          },
          NOT: {
            id: attendanceRecord?.id || ''
          }
        }
      })
      
      if (duplicateEntries.length > 0) {
        const existingEntry = duplicateEntries[0]
        return NextResponse.json({
          success: false,
          message: `You already have an attendance entry within the last ${duplicateRangeHours} hours at ${formatTime(existingEntry.timeIn!)}. Multiple entries in a short time range are not allowed.`,
          data: {
            existingTimeIn: formatTime(existingEntry.timeIn!),
            rangeHours: duplicateRangeHours
          }
        }, { status: 400 })
      }
    }

    // Handle time-in action
    if (action === 'time-in') {
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute // Convert to minutes for easier comparison
      
      // Determine current session type
      const sessionType = getCurrentSessionType(currentTime)
      
      // Time restrictions: Allow time-in during morning or afternoon sessions
      // Skip restrictions if testing mode is enabled
      if (!skipTimeRestrictions) {
        if (!sessionType) {
          const morningStartMinutes = timeToMinutes(morningStart)
          const morningEndMinutes = timeToMinutes(morningEnd)
          const afternoonStartMinutes = timeToMinutes(afternoonStart)
          const afternoonEndMinutes = timeToMinutes(afternoonEnd)
          
          return NextResponse.json({
            success: false,
            message: `Time-in is only allowed during work sessions: ${morningStart}-${morningEnd} (Morning) or ${afternoonStart}-${afternoonEnd} (Afternoon)`
          }, { status: 400 })
        }
        
        // Check if trying to time-in for a session that already has an entry
        if (attendanceRecord) {
          if (sessionType === 'morning' && attendanceRecord.morningTimeIn) {
            return NextResponse.json({
              success: false,
              message: `Already timed in for morning session at ${formatTime(attendanceRecord.morningTimeIn)}`
            }, { status: 400 })
          }
          if (sessionType === 'afternoon' && attendanceRecord.afternoonTimeIn) {
            return NextResponse.json({
              success: false,
              message: `Already timed in for afternoon session at ${formatTime(attendanceRecord.afternoonTimeIn)}`
            }, { status: 400 })
          }
        }
      }

      // If no record exists for today, create one
      if (!attendanceRecord) {
        // Check if the employee is late (only for morning session)
        const isLate = sessionType === 'morning' && (now.getHours() > workStartHour || 
          (now.getHours() === workStartHour && now.getMinutes() > (workStartMinute + lateGraceMinutes)))

        // Auto-approve time-in for regular attendance
        // Time-in records are always auto-approved since final determination
        // depends on total hours worked (checked at time-out)
        const shouldAutoApproveTimeIn = true

        // Create session-based attendance data
        const sessionData: any = {
          userId: user.id,
          date: now,
          // sessionType represents classification (HALF_DAY/FULL_DAY), decide at timeout or when both sessions complete
          sessionType: null,
          isLate: isLate,
          status: determineStatusAfterAutoDecision(null, shouldAutoApproveTimeIn),
          totalSessions: 1
        }

        // Set session-specific time fields
        if (sessionType === 'morning') {
          sessionData.morningTimeIn = now
          sessionData.timeIn = now // Keep backward compatibility
        } else if (sessionType === 'afternoon') {
          sessionData.afternoonTimeIn = now
          sessionData.timeIn = now // Keep backward compatibility
        }

        attendanceRecord = await prisma.attendanceRecord.create({
          data: sessionData
        })

        // Also record a punch for this time-in
        try {
          await prisma.attendancePunch.createMany({
            data: [{ userId: user.id, timestamp: now, type: AttendancePunchType.IN }],
            skipDuplicates: true
          })
        } catch {}

        const wasAutoApproved = sessionData.status === ADMIN_APPROVED_STATUS

        return NextResponse.json({
          success: true,
          message: wasAutoApproved
            ? `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded and automatically approved`
            : `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded - pending approval by supervisor`,
          data: {
            time: formatTime(now),
            sessionType: sessionType,
            isLate: attendanceRecord.isLate,
            expectedWorkHours: dailyHours,
            status: sessionData.status,
            approvalStatus: wasAutoApproved ? 'Auto-approved' : 'Pending supervisor approval'
          }
        })
      } 
      // If record exists, update it for the new session
      else {
        // Check if this is a new session for an existing record
        const canAddSession = sessionType === 'afternoon' && !attendanceRecord.afternoonTimeIn
        
        if (!canAddSession) {
          // This means they're trying to time-in for a session they already have
          return NextResponse.json({
            success: false,
            message: sessionType === 'morning' 
              ? `Already timed in for morning session at ${formatTime(attendanceRecord.morningTimeIn!)}`
              : `Already timed in for afternoon session at ${formatTime(attendanceRecord.afternoonTimeIn!)}`
          }, { status: 400 })
        }

        // For additional sessions (afternoon), late flag does not apply
        const isLate = false

        // Auto-approve time-in for regular attendance
        // Time-in records are always auto-approved since final determination
        // depends on total hours worked (checked at time-out)
        const shouldAutoApproveTimeIn = true

        // Update data for the new session
        const updateData: any = {
          sessionType: 'FULL_DAY', // Now both sessions
          totalSessions: attendanceRecord.totalSessions + 1,
          status: determineStatusAfterAutoDecision(attendanceRecord.status, shouldAutoApproveTimeIn)
        }

        if (sessionType === 'afternoon') {
          updateData.afternoonTimeIn = now
        }

        // Late status not updated on second session

        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: updateData
        })

        // Record a punch for this afternoon time-in
        try {
          await prisma.attendancePunch.createMany({
            data: [{ userId: user.id, timestamp: now, type: AttendancePunchType.IN }],
            skipDuplicates: true
          })
        } catch {}

        const wasAutoApproved = updateData.status === ADMIN_APPROVED_STATUS

        return NextResponse.json({
          success: true,
          message: wasAutoApproved
            ? `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded and automatically approved`
            : `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded - pending approval by supervisor`,
          data: {
            time: formatTime(now),
            sessionType: sessionType,
            totalSessions: attendanceRecord.totalSessions,
            isLate: attendanceRecord.isLate,
            expectedWorkHours: dailyHours,
            status: updateData.status,
            approvalStatus: wasAutoApproved ? 'Auto-approved' : 'Pending supervisor approval'
          }
        })
      }
    } 
    // Handle time-out action
    else if (action === 'time-out') {
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const sessionType = getCurrentSessionType(currentTime)
      
      // Check if there's any active session to time-out from
      const hasMorningTimeIn = attendanceRecord?.morningTimeIn && !attendanceRecord?.morningTimeOut
      const hasAfternoonTimeIn = attendanceRecord?.afternoonTimeIn && !attendanceRecord?.afternoonTimeOut
      const hasTimeIn = attendanceRecord?.timeIn && !attendanceRecord?.timeOut
      
      if (!attendanceRecord || (!hasMorningTimeIn && !hasAfternoonTimeIn && !hasTimeIn)) {
        return NextResponse.json({
          success: false,
          message: 'Cannot time-out without first timing in'
        }, { status: 400 })
      }
      
      // Determine which session to time-out from
      let timeOutSession: 'morning' | 'afternoon' | 'general' = 'general'
      
      // Use the current time's session type to determine which session to timeout
      // Priority: Current session type (morning/afternoon) determines where to record timeout
      if (sessionType === 'afternoon') {
        // Currently in afternoon session
        if (hasAfternoonTimeIn && !hasAfternoonTimeOut) {
          // Has afternoon time-in, use it
          timeOutSession = 'afternoon'
        } else if (hasMorningTimeIn && !hasMorningTimeOut) {
          // Only has morning time-in, this is afternoon timeout for full-day work
          timeOutSession = 'afternoon'
        }
      } else if (sessionType === 'morning') {
        // Currently in morning session
        if (hasMorningTimeIn && !hasMorningTimeOut) {
          timeOutSession = 'morning'
        }
      } else {
        // Outside session times, fallback logic
        if (hasMorningTimeIn && !hasMorningTimeOut) {
          timeOutSession = 'morning'
        } else if (hasAfternoonTimeIn && !hasAfternoonTimeOut) {
          timeOutSession = 'afternoon'
        }
      }
      
      // Check for early timeout
      let isEarlyOut = false
      let earlyOutMessage = ''
      
      if (timeOutSession === 'morning') {
        const morningEndMinutes = timeToMinutes(morningEnd)
        if (currentTime < (morningEndMinutes - earlyOutThresholdMinutes)) {
          isEarlyOut = true
          earlyOutMessage = `Early timeout detected. Morning session typically ends at ${morningEnd}. `
        }
      } else if (timeOutSession === 'afternoon') {
        const afternoonEndMinutes = timeToMinutes(afternoonEnd)
        if (currentTime < (afternoonEndMinutes - earlyOutThresholdMinutes)) {
          isEarlyOut = true
          earlyOutMessage = `Early timeout detected. Afternoon session typically ends at ${afternoonEnd}. `
        }
      }
      
      // If early out is not allowed and this is an early timeout
      if (isEarlyOut && !allowEarlyOut) {
        return NextResponse.json({
          success: false,
          message: `${earlyOutMessage}Early timeout is not allowed by company policy. Please contact your supervisor for approval.`,
          data: {
            isEarlyOut: true,
            expectedEndTime: timeOutSession === 'morning' ? morningEnd : afternoonEnd
          }
        }, { status: 400 })
      } 
      // Record time-out and calculate hours worked
      else {
        // Determine reference time-in for this session
        let timeInForSession: Date | null = null

        if (timeOutSession === 'morning') {
          timeInForSession = attendanceRecord.morningTimeIn ?? null
        } else if (timeOutSession === 'afternoon') {
          // For afternoon timeout, prefer afternoon time-in, but fall back to morning time-in
          // (for full-day workers who only timed in once in the morning)
          timeInForSession = attendanceRecord.afternoonTimeIn ?? attendanceRecord.morningTimeIn ?? null
        } else {
          timeInForSession = attendanceRecord.timeIn ?? attendanceRecord.morningTimeIn ?? attendanceRecord.afternoonTimeIn ?? null
        }

        if (!timeInForSession) {
          return NextResponse.json({
            success: false,
            message: 'No corresponding time-in record found for this session. Please contact your supervisor.'
          }, { status: 400 })
        }

        if (now.getTime() <= timeInForSession.getTime()) {
          return NextResponse.json({
            success: false,
            message: 'Time-out must be later than the recorded time-in. Please verify the time and try again.'
          }, { status: 400 })
        }

        const sessionHours = calculateHoursBetween(timeInForSession, now)

        // Calculate total hours worked for the day
        let totalHoursWorked = sessionHours
        
        // Add existing session hours if this is a second session
        if (timeOutSession === 'afternoon' && attendanceRecord.morningTimeIn && attendanceRecord.morningTimeOut) {
          totalHoursWorked += calculateHoursBetween(attendanceRecord.morningTimeIn, attendanceRecord.morningTimeOut)
        } else if (timeOutSession === 'morning' && attendanceRecord.afternoonTimeIn && attendanceRecord.afternoonTimeOut) {
          totalHoursWorked += calculateHoursBetween(attendanceRecord.afternoonTimeIn, attendanceRecord.afternoonTimeOut)
        }
        
        // Check if this constitutes a half-day
        const hasMorningCompletion = Boolean(attendanceRecord.morningTimeIn && (timeOutSession === 'morning' || attendanceRecord.morningTimeOut))
        const hasAfternoonCompletion = Boolean(attendanceRecord.afternoonTimeIn && (timeOutSession === 'afternoon' || attendanceRecord.afternoonTimeOut))

        const isHalfDay = allowHalfDay
          ? totalHoursWorked >= halfDayMinimumHours && totalHoursWorked < dailyHours
          : false
        
        // Determine if attendance is complete for the day
        const hasCompletedMorning = hasMorningCompletion
        const hasCompletedAfternoon = hasAfternoonCompletion
        const isAttendanceComplete = hasCompletedMorning && hasCompletedAfternoon

        // Check if it's a holiday (simplified - you can enhance this with a holidays table)
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)
        const endOfToday = new Date(now)
        endOfToday.setHours(23, 59, 59, 999)
        
        let todayHoliday = null
        try {
          todayHoliday = await prisma.holiday.findFirst({
            where: {
              date: {
                gte: today,
                lte: endOfToday
              }
            }
          })
        } catch (holidayError) {
          console.error('Error fetching holiday data:', holidayError)
          // Continue without holiday data if table doesn't exist
          todayHoliday = null
        }
        
        const isHoliday = !!todayHoliday
        const holidayType = todayHoliday?.type || null
        const isWeekend = now.getDay() === 0 || now.getDay() === 6

        // Get overtime rate for calculation
        const overtimeRate = parseFloat(configs['rates_overtimeRate1'] || '1.25')
        const holidayRate = todayHoliday?.type === 'REGULAR' 
          ? parseFloat(configs['rates_regularHolidayRate'] || '2.0')
          : todayHoliday?.type === 'SPECIAL'
          ? parseFloat(configs['rates_specialHolidayRate'] || '1.3')
          : 1.0

        // Determine if this attendance should be auto-approved
        // Auto-approve ALL regular attendance automatically
        // Note: Hours beyond 8 are only counted if employee requests overtime/overload
        // If no overtime/overload request is made, attendance is capped at 8 hours for payroll
        // Only require approval for early-out cases requiring supervisor review
        const shouldAutoApprove = (() => {
          // Don't auto-approve if early-out (requires supervisor review)
          if (isEarlyOut) return false

          // Auto-approve all regular attendance (even if >8 hours)
          // Overtime/overload requires separate explicit request by employee
          return true
        })()

        // Prepare update data for session-based time-out
        const updateData: any = {
          hoursWorked: totalHoursWorked,
          status: determineStatusAfterAutoDecision(attendanceRecord.status, shouldAutoApprove),
          isHalfDay: isHalfDay,
          isEarlyOut: isEarlyOut,
          sessionType: isHalfDay ? 'HALF_DAY' : 'FULL_DAY'
        }

        // Set session-specific time-out fields
        if (timeOutSession === 'morning') {
          updateData.morningTimeOut = now
        } else if (timeOutSession === 'afternoon') {
          updateData.afternoonTimeOut = now
        }

        // Update general timeOut for backward compatibility
        updateData.timeOut = now

        // Add early out reason if applicable
        if (isEarlyOut) {
          updateData.earlyOutReason = earlyOutMessage.trim()
        }

        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: updateData
        })

        // Also record a punch for this time-out
        try {
          await prisma.attendancePunch.createMany({
            data: [{ userId: user.id, timestamp: now, type: AttendancePunchType.OUT }],
            skipDuplicates: true
          })
        } catch {}

        // Calculate earnings for the day
        const regularHours = Math.min(totalHoursWorked, dailyHours)
        const overtimeHours = Math.max(0, totalHoursWorked - dailyHours)
        
        // Get payroll rules to calculate rates
        const payrollRules = await prisma.payrollRule.findMany({
          where: {
            OR: [
              { applyToAll: true },
              {
                assignedUsers: {
                  some: {
                    userId: user.id
                  }
                }
              }
            ],
            isActive: true
          }
        })
        
        // Get daily rate from payroll rules (type=daily_rate)
        const dailyRateRule = payrollRules.find((rule: any) => rule.type === 'daily_rate')
        const dailyRate = dailyRateRule ? Number(dailyRateRule.amount) : 0
        const hourlyRate = dailyRate / dailyHours
        
        // Calculate base pay for regular hours
        let regularPay = regularHours * hourlyRate
        
        // Calculate overtime pay (first 2 hours at rate1, beyond at rate2)
        let overtimePay = 0
        if (overtimeHours > 0) {
          const overtimeRate2 = parseFloat(configs['rates_overtimeRate2'] || '1.5')
          const firstOvertimeHours = Math.min(overtimeHours, 2)
          const secondOvertimeHours = Math.max(0, overtimeHours - 2)
          
          overtimePay = (firstOvertimeHours * hourlyRate * overtimeRate) + 
                       (secondOvertimeHours * hourlyRate * overtimeRate2)
        }
        
        // Calculate holiday pay if applicable
        let holidayPay = 0
        if (isHoliday) {
          if (todayHoliday?.type === 'REGULAR') {
            // Regular holiday: 200% of regular rate (100% additional)
            holidayPay = totalHoursWorked * hourlyRate * (holidayRate - 1)
          } else if (todayHoliday?.type === 'SPECIAL') {
            // Special holiday: 130% of regular rate (30% additional)
            holidayPay = totalHoursWorked * hourlyRate * (holidayRate - 1)
          }
        }
        
        // Calculate weekend differential if applicable
        let weekendPay = 0
        if (isWeekend && !isHoliday) {
          // Weekend work gets 130% rate (30% additional)
          weekendPay = totalHoursWorked * hourlyRate * 0.3
        }
        
        // Night differential removed from calculations
        const totalEarnings = regularPay + overtimePay + holidayPay + weekendPay

        // Compose response message
        let responseMessage = shouldAutoApprove 
          ? `${timeOutSession?.charAt(0).toUpperCase()}${timeOutSession?.slice(1)} time-out recorded and automatically approved`
          : `${timeOutSession?.charAt(0).toUpperCase()}${timeOutSession?.slice(1)} time-out recorded - pending approval by supervisor`
        
        if (isEarlyOut) {
          responseMessage += `. ${earlyOutMessage}`
        }
        
        if (isHalfDay && !isAttendanceComplete) {
          responseMessage += ` This is a half-day attendance (${totalHoursWorked.toFixed(2)} hours). ${hasCompletedMorning && !hasCompletedAfternoon ? 'Afternoon session still needed for full day.' : 'Morning session still needed for full day.'}`
        }

        const wasAutoApproved = updateData.status === ADMIN_APPROVED_STATUS

        return NextResponse.json({
          success: true,
          message: responseMessage,
          data: {
            time: formatTime(now),
            sessionType: timeOutSession,
            sessionHours: sessionHours,
            totalHoursWorked: totalHoursWorked,
            regularHours,
            overtimeHours,
            isHalfDay,
            isEarlyOut,
            isAttendanceComplete,
            hasCompletedMorning,
            hasCompletedAfternoon,
            isHoliday,
            holidayType,
            holidayName: todayHoliday?.name || null,
            holidayMultiplier: isHoliday ? holidayRate : 1.0,
            isWeekend,
            expectedDailyHours: dailyHours,
            status: updateData.status,
            approvalStatus: wasAutoApproved ? 'Auto-approved' : 'Pending supervisor approval',
            earnings: {
              dailyRate,
              hourlyRate,
              regularPay,
              overtimePay,
              holidayPay,
              weekendPay,
              totalEarnings,
              breakdown: {
                regularHours: { hours: regularHours, rate: hourlyRate, amount: regularPay },
                overtime: { hours: overtimeHours, rate: hourlyRate * overtimeRate, amount: overtimePay },
                holiday: isHoliday ? { multiplier: holidayRate, amount: holidayPay, type: todayHoliday?.type } : null,
                weekend: isWeekend && !isHoliday ? { multiplier: 1.3, amount: weekendPay } : null
              }
            }
          }
        })
      }
    }

  } catch (error) {
    console.error('Error processing attendance action:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({
      success: false,
      message: 'An error occurred while processing your request'
    }, { status: 500 })
  }
}

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
} 