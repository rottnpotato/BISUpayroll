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

    // Get system configurations for working hours
    let systemConfigs: Array<{key: string, value: string}> = []
    try {
      systemConfigs = await prisma.systemSettings.findMany({
        where: {
          key: {
            in: [
              'working_hours_dailyHours',
              'working_hours_lateGraceMinutes'
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

    // Handle time-in action
    if (action === 'time-in') {
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute // Convert to minutes for easier comparison
      
      // Time restrictions: Allow time-in only between 6:00 AM and 12:59 PM (PHT)
      // Skip restrictions if testing mode is enabled
      if (!skipTimeRestrictions) {
        const morningStartTime = 6 * 60 // 6:00 AM in minutes
        const morningEndTime = 12 * 60 + 59 // 12:59 PM in minutes
        
        if (currentTime < morningStartTime || currentTime > morningEndTime) {
          return NextResponse.json({
            success: false,
            message: 'Time-in is only allowed between 6:00 AM and 12:59 PM (PHT)'
          }, { status: 400 })
        }
      }

      // If no record exists for today, create one
      if (!attendanceRecord) {
        // Check if the employee is late
        const isLate = now.getHours() > workStartHour || 
          (now.getHours() === workStartHour && now.getMinutes() > (workStartMinute + lateGraceMinutes))

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

        attendanceRecord = await prisma.attendanceRecord.create({
          data: {
            userId: user.id,
            date: now,
            timeIn: now,
            isLate: isLate,
            status: shouldAutoApproveTimeIn ? 'APPROVED' : 'PENDING'
          } as any
        })

        return NextResponse.json({
          success: true,
          message: shouldAutoApproveTimeIn 
            ? 'Time-in recorded and automatically approved'
            : 'Time-in recorded - pending approval by supervisor',
          data: {
            time: formatTime(now),
            isLate: attendanceRecord.isLate,
            expectedWorkHours: dailyHours,
            status: shouldAutoApproveTimeIn ? 'APPROVED' : 'PENDING',
            approvalStatus: shouldAutoApproveTimeIn ? 'Auto-approved' : 'Pending supervisor approval'
          }
        })
      } 
      // If record exists but already timed in
      else if (attendanceRecord.timeIn) {
        return NextResponse.json({
          success: false,
          message: 'Already timed in for today',
          data: {
            time: formatTime(attendanceRecord.timeIn)
          }
        }, { status: 400 })
      } 
      // If record exists but no time-in (unlikely scenario but handled for completeness)
      else {
        const isLate = now.getHours() > workStartHour || 
          (now.getHours() === workStartHour && now.getMinutes() > (workStartMinute + lateGraceMinutes))

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

        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: {
            timeIn: now,
            isLate: isLate,
            status: shouldAutoApproveTimeIn ? 'APPROVED' : 'PENDING'
          } as any
        })

        return NextResponse.json({
          success: true,
          message: shouldAutoApproveTimeIn 
            ? 'Time-in recorded and automatically approved'
            : 'Time-in recorded - pending approval by supervisor',
          data: {
            time: formatTime(now),
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
      // If no record exists for today or no time-in
      if (!attendanceRecord || !attendanceRecord.timeIn) {
        return NextResponse.json({
          success: false,
          message: 'Cannot time-out without first timing in'
        }, { status: 400 })
      } 
      // If already timed out
      else if (attendanceRecord.timeOut) {
        return NextResponse.json({
          success: false,
          message: 'Already timed out for today',
          data: {
            time: formatTime(attendanceRecord.timeOut)
          }
        }, { status: 400 })
      } 
      // Record time-out and calculate hours worked
      else {
        const timeIn = attendanceRecord.timeIn.getTime()
        const timeOut = now.getTime()
        const hoursWorked = parseFloat(((timeOut - timeIn) / (1000 * 60 * 60)).toFixed(2))

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
          if (hoursWorked < 4 || hoursWorked > 12) return false
          
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

        attendanceRecord = await prisma.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: {
            timeOut: now,
            hoursWorked,
            status: shouldAutoApprove ? 'APPROVED' : 'PENDING'
          }
        })

        // Calculate earnings for the day
        const regularHours = Math.min(hoursWorked, dailyHours)
        const overtimeHours = Math.max(0, hoursWorked - dailyHours)
        
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
            holidayPay = hoursWorked * hourlyRate * (holidayRate - 1)
          } else if (todayHoliday?.type === 'SPECIAL') {
            // Special holiday: 130% of regular rate (30% additional)
            holidayPay = hoursWorked * hourlyRate * (holidayRate - 1)
          }
        }
        
        // Calculate weekend differential if applicable
        let weekendPay = 0
        if (isWeekend && !isHoliday) {
          // Weekend work gets 130% rate (30% additional)
          weekendPay = hoursWorked * hourlyRate * 0.3
        }
        
        // Calculate night differential (assuming 10PM-6AM shift detection would be needed)
        const nightDifferentialRate = parseFloat(configs['rates_nightDifferential'] || '0.10')
        let nightDifferentialPay = 0
        // For simplicity, we'll calculate this if time-out is after 10PM or time-in is before 6AM
        const timeInHour = attendanceRecord.timeIn?.getHours() || 0
        const timeOutHour = now.getHours()
        if (timeInHour < 6 || timeOutHour >= 22) {
          nightDifferentialPay = hoursWorked * hourlyRate * nightDifferentialRate
        }
        
        const totalEarnings = regularPay + overtimePay + holidayPay + weekendPay + nightDifferentialPay

        return NextResponse.json({
          success: true,
          message: shouldAutoApprove 
            ? 'Time-out recorded and automatically approved'
            : 'Time-out recorded - pending approval by supervisor',
          data: {
            time: formatTime(now),
            hoursWorked,
            regularHours,
            overtimeHours,
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
              nightDifferentialPay,
              totalEarnings,
              breakdown: {
                regularHours: { hours: regularHours, rate: hourlyRate, amount: regularPay },
                overtime: { hours: overtimeHours, rate: hourlyRate * overtimeRate, amount: overtimePay },
                holiday: isHoliday ? { multiplier: holidayRate, amount: holidayPay, type: todayHoliday?.type } : null,
                weekend: isWeekend && !isHoliday ? { multiplier: 1.3, amount: weekendPay } : null,
                nightDifferential: nightDifferentialPay > 0 ? { rate: nightDifferentialRate, amount: nightDifferentialPay } : null
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