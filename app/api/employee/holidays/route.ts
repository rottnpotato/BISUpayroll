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

    if (!user || user.role !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Calculate date range for the month or year
    let startDate: Date
    let endDate: Date

    if (month) {
      // Get holidays for specific month
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59, 999)
    } else {
      // Get holidays for entire year
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    // Get holidays within the date range
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Format the holidays for the response
    const formattedHolidays = holidays.map(holiday => ({
      id: holiday.id,
      name: holiday.name,
      date: holiday.date.toISOString().split('T')[0],
      type: holiday.type,
      isRecurring: holiday.isRecurring,
      payMultiplier: holiday.type === 'REGULAR' ? 2.0 : holiday.type === 'SPECIAL' ? 1.3 : 1.0
    }))

    return NextResponse.json({
      success: true,
      data: {
        holidays: formattedHolidays,
        totalCount: formattedHolidays.length,
        period: month ? `${year}-${month.toString().padStart(2, '0')}` : year.toString()
      }
    })

  } catch (error) {
    console.error('Error fetching holidays:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred while fetching holidays'
    }, { status: 500 })
  }
}
