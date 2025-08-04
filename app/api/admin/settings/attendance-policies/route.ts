import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    // Get attendance policy settings
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
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

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('Error fetching attendance policy settings:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching settings'
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    // Get settings from request body
    const body = await request.json()

    // Validate the settings
    const requiredSettings = [
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

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

    if (!timeRegex.test(body.attendance_morning_start) ||
        !timeRegex.test(body.attendance_morning_end) ||
        !timeRegex.test(body.attendance_afternoon_start) ||
        !timeRegex.test(body.attendance_afternoon_end)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid time format. Please use HH:MM format.'
      }, { status: 400 })
    }

    // Validate logical time order
    const morningStart = body.attendance_morning_start
    const morningEnd = body.attendance_morning_end
    const afternoonStart = body.attendance_afternoon_start
    const afternoonEnd = body.attendance_afternoon_end

    if (morningStart >= morningEnd) {
      return NextResponse.json({
        success: false,
        message: 'Morning start time must be before morning end time.'
      }, { status: 400 })
    }

    if (afternoonStart >= afternoonEnd) {
      return NextResponse.json({
        success: false,
        message: 'Afternoon start time must be before afternoon end time.'
      }, { status: 400 })
    }

    if (morningEnd >= afternoonStart) {
      return NextResponse.json({
        success: false,
        message: 'Morning session must end before afternoon session starts.'
      }, { status: 400 })
    }

    // Validate numeric values
    if (body.attendance_early_out_threshold_minutes < 15 || body.attendance_early_out_threshold_minutes > 240) {
      return NextResponse.json({
        success: false,
        message: 'Early out threshold must be between 15 and 240 minutes.'
      }, { status: 400 })
    }

    if (body.attendance_half_day_minimum_hours < 1 || body.attendance_half_day_minimum_hours > 8) {
      return NextResponse.json({
        success: false,
        message: 'Half-day minimum hours must be between 1 and 8 hours.'
      }, { status: 400 })
    }

    if (body.attendance_duplicate_range_hours < 1 || body.attendance_duplicate_range_hours > 12) {
      return NextResponse.json({
        success: false,
        message: 'Duplicate range hours must be between 1 and 12 hours.'
      }, { status: 400 })
    }

    // Update or create settings
    const settingsToUpdate = requiredSettings.map(key => ({
      key,
      value: String(body[key]),
      description: getSettingDescription(key)
    }))

    // Use upsert to update or create each setting
    for (const setting of settingsToUpdate) {
      await prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: { 
          value: setting.value,
          updatedAt: new Date()
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance policy settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating attendance policy settings:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while updating settings'
    }, { status: 500 })
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'attendance_morning_start': 'Morning session start time',
    'attendance_morning_end': 'Morning session end time',
    'attendance_afternoon_start': 'Afternoon session start time',
    'attendance_afternoon_end': 'Afternoon session end time',
    'attendance_allow_half_day': 'Allow half-day attendance',
    'attendance_allow_early_out': 'Allow early timeout with approval',
    'attendance_early_out_threshold_minutes': 'Minutes before end time to consider early out',
    'attendance_half_day_minimum_hours': 'Minimum hours for half-day attendance',
    'attendance_prevent_duplicate_entries': 'Prevent multiple attendance entries in same time range',
    'attendance_duplicate_range_hours': 'Hours range to check for duplicate entries'
  }
  
  return descriptions[key] || 'Attendance policy setting'
}