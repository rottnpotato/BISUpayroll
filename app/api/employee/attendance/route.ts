import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { calculateBaseSalaryFromRules } from '@/lib/payroll-calculations'

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

    // Get attendance records for the specified month
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Calculate summary statistics
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter(record => record.timeIn && record.timeOut).length
    const absentDays = attendanceRecords.filter(record => record.isAbsent).length
    const lateDays = attendanceRecords.filter(record => record.isLate).length
    
    let totalHours = 0
    attendanceRecords.forEach(record => {
      if (record.hoursWorked) {
        totalHours += parseFloat(record.hoursWorked.toString())
      }
    })
    
    const averageHoursPerDay = totalDays > 0 ? parseFloat((totalHours / totalDays).toFixed(2)) : 0

    // Format the records for the response
    const formattedRecords = attendanceRecords.map(record => {
      const date = record.date
      const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
      const timeIn = record.timeIn 
        ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(record.timeIn) 
        : null
      const timeOut = record.timeOut 
        ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(record.timeOut) 
        : null
      
      let status = 'Absent'
      if (record.timeIn) {
        status = record.isLate ? 'Late' : 'On Time'
      }

      return {
        id: record.id,
        date: date.toISOString().split('T')[0],
        dayOfWeek,
        timeIn,
        timeOut,
        status,
        hours: record.hoursWorked ? parseFloat(record.hoursWorked.toString()) : 0,
        approvalStatus: record.status || 'PENDING',
        rejectionReason: (record as any).rejectionReason || null,
        approvedAt: (record as any).approvedAt ? new Date((record as any).approvedAt).toISOString() : null
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

        // Auto-approve time-in if not excessively late (more than 2 hours)
        const shouldAutoApproveTimeIn = (() => {
          if (!isLate) return true // Auto-approve if on time
          
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()
          const actualTimeIn = currentHour * 60 + currentMinute
          const expectedTimeIn = workStartHour * 60 + workStartMinute
          const lateMinutes = actualTimeIn - expectedTimeIn
          
          // Don't auto-approve if more than 2 hours late (120 minutes)
          return lateMinutes <= 120
        })()

        // Create session-based attendance data
        const sessionData: any = {
          userId: user.id,
          date: now,
          sessionType: sessionType,
          isLate: isLate,
          status: shouldAutoApproveTimeIn ? 'APPROVED' : 'PENDING',
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

        return NextResponse.json({
          success: true,
          message: shouldAutoApproveTimeIn 
            ? `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded and automatically approved`
            : `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded - pending approval by supervisor`,
          data: {
            time: formatTime(now),
            sessionType: sessionType,
            isLate: attendanceRecord.isLate,
            expectedWorkHours: dailyHours,
            status: shouldAutoApproveTimeIn ? 'APPROVED' : 'PENDING',
            approvalStatus: shouldAutoApproveTimeIn ? 'Auto-approved' : 'Pending supervisor approval'
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

        // Auto-approve time-in if not excessively late (more than 2 hours)
        const shouldAutoApproveTimeIn = (() => {
          if (!isLate) return true // Auto-approve if on time
          
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()
          const actualTimeIn = currentHour * 60 + currentMinute
          const expectedTimeIn = workStartHour * 60 + workStartMinute
          const lateMinutes = actualTimeIn - expectedTimeIn
          
          // Don't auto-approve if more than 2 hours late (120 minutes)
          return lateMinutes <= 120
        })()

        // Update data for the new session
        const updateData: any = {
          sessionType: 'full_day', // Now both sessions
          totalSessions: attendanceRecord.totalSessions + 1,
          status: shouldAutoApproveTimeIn ? 'APPROVED' : 'PENDING'
        }

        if (sessionType === 'afternoon') {
          updateData.afternoonTimeIn = now
        }

        // Late status not updated on second session

        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: updateData
        })

        return NextResponse.json({
          success: true,
          message: shouldAutoApproveTimeIn 
            ? `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded and automatically approved`
            : `${sessionType?.charAt(0).toUpperCase()}${sessionType?.slice(1)} time-in recorded - pending approval by supervisor`,
          data: {
            time: formatTime(now),
            sessionType: sessionType,
            totalSessions: attendanceRecord.totalSessions,
            isLate: attendanceRecord.isLate,
            expectedWorkHours: dailyHours,
            status: shouldAutoApproveTimeIn ? 'APPROVED' : 'PENDING',
            approvalStatus: shouldAutoApproveTimeIn ? 'Auto-approved' : 'Pending supervisor approval'
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
      
      if (sessionType === 'morning' && hasMorningTimeIn) {
        timeOutSession = 'morning'
      } else if (sessionType === 'afternoon' && hasAfternoonTimeIn) {
        timeOutSession = 'afternoon'
      } else if (hasMorningTimeIn && !hasAfternoonTimeIn) {
        timeOutSession = 'morning'
      } else if (hasAfternoonTimeIn) {
        timeOutSession = 'afternoon'
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
        // Calculate session-specific hours
        let sessionHours = 0
        let timeInForSession: Date | null = null
        
        if (timeOutSession === 'morning' && attendanceRecord.morningTimeIn) {
          timeInForSession = attendanceRecord.morningTimeIn
          sessionHours = parseFloat(((now.getTime() - timeInForSession.getTime()) / (1000 * 60 * 60)).toFixed(2))
        } else if (timeOutSession === 'afternoon' && attendanceRecord.afternoonTimeIn) {
          timeInForSession = attendanceRecord.afternoonTimeIn
          sessionHours = parseFloat(((now.getTime() - timeInForSession.getTime()) / (1000 * 60 * 60)).toFixed(2))
        } else if (attendanceRecord.timeIn) {
          timeInForSession = attendanceRecord.timeIn
          sessionHours = parseFloat(((now.getTime() - timeInForSession.getTime()) / (1000 * 60 * 60)).toFixed(2))
        }
        
        // Calculate total hours worked for the day
        let totalHoursWorked = sessionHours
        
        // Add existing session hours if this is a second session
        if (timeOutSession === 'afternoon' && attendanceRecord.morningTimeIn && attendanceRecord.morningTimeOut) {
          const morningHours = parseFloat(((attendanceRecord.morningTimeOut.getTime() - attendanceRecord.morningTimeIn.getTime()) / (1000 * 60 * 60)).toFixed(2))
          totalHoursWorked += morningHours
        } else if (timeOutSession === 'morning' && attendanceRecord.afternoonTimeIn && attendanceRecord.afternoonTimeOut) {
          const afternoonHours = parseFloat(((attendanceRecord.afternoonTimeOut.getTime() - attendanceRecord.afternoonTimeIn.getTime()) / (1000 * 60 * 60)).toFixed(2))
          totalHoursWorked += afternoonHours
        }
        
        // Check if this constitutes a half-day
        const isHalfDay = totalHoursWorked >= halfDayMinimumHours && totalHoursWorked < dailyHours
        
        // Determine if attendance is complete for the day
        const hasCompletedMorning = attendanceRecord.morningTimeIn && (timeOutSession === 'morning' || attendanceRecord.morningTimeOut)
        const hasCompletedAfternoon = attendanceRecord.afternoonTimeIn && (timeOutSession === 'afternoon' || attendanceRecord.afternoonTimeOut)
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
        // Auto-approve if:
        // 1. Employee worked reasonable hours (between 4-12 hours)
        // 2. Not excessively late (more than 2 hours late)
        // 3. Has both time-in and time-out
        const shouldAutoApprove = (() => {
          // Check reasonable working hours (4-12 hours)
          if (totalHoursWorked < 4 || totalHoursWorked > 12) return false
          
          // Check if excessively late (more than 2 hours)
          if (attendanceRecord.isLate) {
            const timeInHour = attendanceRecord.timeIn?.getHours() || 0
            const timeInMinute = attendanceRecord.timeIn?.getMinutes() || 0
            const actualTimeIn = timeInHour * 60 + timeInMinute
            const expectedTimeIn = workStartHour * 60 + workStartMinute
            const lateMinutes = actualTimeIn - expectedTimeIn
            
            // Don't auto-approve if more than 2 hours late (120 minutes)
            if (lateMinutes > 120) return false
          }
          
          return true
        })()

        // Prepare update data for session-based time-out
        const updateData: any = {
          hoursWorked: totalHoursWorked,
          status: shouldAutoApprove ? 'APPROVED' : 'PENDING',
          isHalfDay: isHalfDay,
          isEarlyOut: isEarlyOut
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
        
        const monthlySalary = calculateBaseSalaryFromRules(payrollRules)
        const dailyRate = monthlySalary / 22 // Standard working days per month
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
            status: shouldAutoApprove ? 'APPROVED' : 'PENDING',
            approvalStatus: shouldAutoApprove ? 'Auto-approved' : 'Pending supervisor approval',
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