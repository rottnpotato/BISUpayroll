import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

type Overrides = {
  noWorkDays: number[]
  workingWeekendDays: number[]
}

const getOverrideKey = (year: number, month: number) => `work_calendar_overrides_${year}_${String(month).padStart(2, '0')}`

const startOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month - 1, 1))
const endOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

const isSameUTCDate = (a: Date, b: Date) => a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()

const enumerateMonthDaysUTC = (year: number, month: number): Date[] => {
  const days: Date[] = []
  const first = startOfMonth(year, month)
  const last = endOfMonth(year, month)
  for (let d = new Date(first); d <= last; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
    days.push(new Date(d))
  }
  return days
}

const enumerateYearDaysUTC = (year: number): Date[] => {
  const days: Date[] = []
  const first = new Date(Date.UTC(year, 0, 1))
  const last = new Date(Date.UTC(year, 11, 31))
  for (let d = new Date(first); d <= last; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
    days.push(new Date(d))
  }
  return days
}

const isWeekendUTC = (date: Date) => {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

const toISODate = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString()

async function getHolidaysForMonth(year: number, month: number) {
  const monthStart = startOfMonth(year, month)
  const monthEnd = endOfMonth(year, month)

  const holidays = await prisma.holiday.findMany({})

  const monthHolidays = holidays.filter(h => {
    const date = new Date(h.date)
    if (h.isRecurring) {
      return date.getUTCMonth() + 1 === month
    }
    return date >= monthStart && date <= monthEnd
  })

  const holidayDates = new Set<string>()
  monthHolidays.forEach(h => {
    const date = new Date(h.date)
    const iso = toISODate(new Date(Date.UTC(year, (h.isRecurring ? month - 1 : date.getUTCMonth()), date.getUTCDate())))
    holidayDates.add(iso)
  })

  return { holidays: monthHolidays, holidayDates }
}

async function getHolidaysForYear(year: number) {
  const holidays = await prisma.holiday.findMany({})
  const holidayDates = new Set<string>()

  holidays.forEach(h => {
    const date = new Date(h.date)
    if (h.isRecurring) {
      // add this month/day for every month? recurring holidays are same month/day each year
      const iso = toISODate(new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate())))
      holidayDates.add(iso)
    } else if (date.getUTCFullYear() === year) {
      holidayDates.add(toISODate(date))
    }
  })
  return holidayDates
}

function computeWorkingDaysForMonth(year: number, month: number, holidayDates: Set<string>, overrides: Overrides) {
  const days = enumerateMonthDaysUTC(year, month)
  let workingDays = 0
  const weekends: number[] = []
  const holidaysList: Array<{ date: string; day: number }> = []

  days.forEach(date => {
    const dayNum = date.getUTCDate()
    const iso = toISODate(date)
    const weekend = isWeekendUTC(date)
    const isHoliday = holidayDates.has(iso)
    if (weekend) weekends.push(dayNum)
    if (isHoliday) holidaysList.push({ date: iso, day: dayNum })

    const isNoWorkOverride = overrides.noWorkDays.includes(dayNum)
    const isWorkingWeekendOverride = overrides.workingWeekendDays.includes(dayNum)

    const isWorkingDay = (!weekend && !isHoliday && !isNoWorkOverride) || (weekend && isWorkingWeekendOverride)
    if (isWorkingDay) workingDays += 1
  })

  return { workingDays, weekends, holidaysList }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }
    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = Number(searchParams.get('year') ?? now.getUTCFullYear())
    const month = Number(searchParams.get('month') ?? (now.getUTCMonth() + 1))
    const includeAnnual = searchParams.get('includeAnnual') === 'true'

    const overrideKey = getOverrideKey(year, month)
    const existing = await prisma.systemSettings.findUnique({ where: { key: overrideKey } })
    const overrides: Overrides = existing ? JSON.parse(existing.value) : { noWorkDays: [], workingWeekendDays: [] }

    const { holidays, holidayDates } = await getHolidaysForMonth(year, month)
    const { workingDays, weekends, holidaysList } = computeWorkingDaysForMonth(year, month, holidayDates, overrides)

    let annualWorkingDays: number | undefined
    if (includeAnnual) {
      const yd = enumerateYearDaysUTC(year)
      const yHolidayDates = await getHolidaysForYear(year)
      annualWorkingDays = yd.reduce((acc, date) => {
        const weekend = isWeekendUTC(date)
        const iso = toISODate(date)
        const isHoliday = yHolidayDates.has(iso)
        return acc + (weekend || isHoliday ? 0 : 1)
      }, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        period: { year, month },
        overrides,
        month: {
          totalDays: enumerateMonthDaysUTC(year, month).length,
          weekends,
          holidays: holidays.map(h => ({ id: h.id, name: h.name, type: h.type, date: toISODate(new Date(h.date)), isRecurring: h.isRecurring })),
          workingDays
        },
        annual: includeAnnual ? { year, workingDays: annualWorkingDays } : undefined
      }
    })
  } catch (error) {
    console.error('Error fetching work calendar:', error)
    return NextResponse.json({ success: false, message: 'An error occurred while fetching work calendar' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }
    const user = await verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
    }

    const body = await request.json()
    const year = Number(body.year)
    const month = Number(body.month)
    const overrides: Overrides = {
      noWorkDays: Array.isArray(body.noWorkDays) ? body.noWorkDays : [],
      workingWeekendDays: Array.isArray(body.workingWeekendDays) ? body.workingWeekendDays : []
    }

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ success: false, message: 'Invalid year or month' }, { status: 400 })
    }

    const key = getOverrideKey(year, month)

    await prisma.systemSettings.upsert({
      where: { key },
      update: { value: JSON.stringify(overrides), category: 'payroll', dataType: 'JSON' as any },
      create: {
        key,
        value: JSON.stringify(overrides),
        category: 'payroll',
        dataType: 'JSON' as any,
        description: `Work calendar overrides for ${year}-${String(month).padStart(2, '0')}`
      }
    })

    const { holidayDates } = await getHolidaysForMonth(year, month)
    const computed = computeWorkingDaysForMonth(year, month, holidayDates, overrides)

    return NextResponse.json({ success: true, message: 'Work calendar overrides saved', data: { period: { year, month }, overrides, month: computed } })
  } catch (error) {
    console.error('Error saving work calendar:', error)
    return NextResponse.json({ success: false, message: 'An error occurred while saving work calendar' }, { status: 500 })
  }
}


