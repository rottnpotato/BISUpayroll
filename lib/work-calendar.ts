import { prisma } from "./database"

export type WorkCalendarOverrides = {
  noWorkDays: number[]
  workingWeekendDays: number[]
}

const getOverrideKey = (year: number, month: number) => `work_calendar_overrides_${year}_${String(month).padStart(2, '0')}`

const startOfMonthUTC = (year: number, month: number) => new Date(Date.UTC(year, month - 1, 1))
const endOfMonthUTC = (year: number, month: number) => new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
const toISODateUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString()
const isWeekendUTC = (date: Date) => { const day = date.getUTCDay(); return day === 0 || day === 6 }

async function loadOverrides(year: number, month: number): Promise<WorkCalendarOverrides> {
  const key = getOverrideKey(year, month)
  const setting = await prisma.systemSettings.findUnique({ where: { key } })
  if (!setting) return { noWorkDays: [], workingWeekendDays: [] }
  try { return JSON.parse(setting.value) as WorkCalendarOverrides } catch { return { noWorkDays: [], workingWeekendDays: [] } }
}

async function loadHolidayDateSetForMonth(year: number, month: number): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany({})
  const monthStart = startOfMonthUTC(year, month)
  const monthEnd = endOfMonthUTC(year, month)
  const dates = new Set<string>()
  holidays.forEach(h => {
    const d = new Date(h.date)
    if (h.isRecurring) {
      if ((d.getUTCMonth() + 1) === month) {
        dates.add(toISODateUTC(new Date(Date.UTC(year, month - 1, d.getUTCDate()))))
      }
    } else if (d >= monthStart && d <= monthEnd) {
      dates.add(toISODateUTC(d))
    }
  })
  return dates
}

async function loadHolidayDateSetForYear(year: number): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany({})
  const dates = new Set<string>()
  holidays.forEach(h => {
    const d = new Date(h.date)
    if (h.isRecurring) {
      dates.add(toISODateUTC(new Date(Date.UTC(year, d.getUTCMonth(), d.getUTCDate()))))
    } else if (d.getUTCFullYear() === year) {
      dates.add(toISODateUTC(d))
    }
  })
  return dates
}

export async function getWorkingDaysInMonth(year: number, month: number): Promise<number> {
  const overrides = await loadOverrides(year, month)
  const holidayDates = await loadHolidayDateSetForMonth(year, month)
  const monthStart = startOfMonthUTC(year, month)
  const monthEnd = endOfMonthUTC(year, month)
  let working = 0
  for (let d = new Date(monthStart); d <= monthEnd; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
    const dayNum = d.getUTCDate()
    const weekend = isWeekendUTC(d)
    const isHoliday = holidayDates.has(toISODateUTC(d))
    const isNoWork = overrides.noWorkDays.includes(dayNum)
    const isWorkingWeekend = overrides.workingWeekendDays.includes(dayNum)
    const isWorkingDay = (!weekend && !isHoliday && !isNoWork) || (weekend && isWorkingWeekend)
    if (isWorkingDay) working += 1
  }
  return working
}

export async function getWorkingDaysInYear(year: number): Promise<number> {
  const holidayDates = await loadHolidayDateSetForYear(year)
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  let working = 0
  for (let d = new Date(start); d <= end; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
    const weekend = isWeekendUTC(d)
    const isHoliday = holidayDates.has(toISODateUTC(d))
    if (!weekend && !isHoliday) working += 1
  }
  return working
}


