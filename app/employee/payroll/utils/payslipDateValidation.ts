type EmploymentStatus = 'PERMANENT' | 'TEMPORARY' | 'CONTRACTUAL' | 'INACTIVE'

interface PayslipGenerationConfig {
  allowedDays: number[]
  cutoffPeriods: { label: string; dayRange: [number, number] }[]
}

const PAYSLIP_GENERATION_CONFIG: Record<string, PayslipGenerationConfig> = {
  PERMANENT: {
    allowedDays: [15, 30],
    cutoffPeriods: [
      { label: '1st - 15th', dayRange: [1, 15] },
      { label: '16th - End of Month', dayRange: [16, 31] },
    ],
  },
  CONTRACTUAL: {
    allowedDays: [5,10, 20],
    cutoffPeriods: [
      { label: '1st - 5th', dayRange: [1, 5] },
      { label: '6th - 20th', dayRange: [6, 20] },
    ],
  },
  TEMPORARY: {
    allowedDays: [5, 20],
    cutoffPeriods: [
      { label: '1st - 5th', dayRange: [1, 5] },
      { label: '6th - 20th', dayRange: [6, 20] },
    ],
  },
}

export function getPayslipConfig(status: EmploymentStatus): PayslipGenerationConfig {
  return PAYSLIP_GENERATION_CONFIG[status] || PAYSLIP_GENERATION_CONFIG.CONTRACTUAL
}

export function canGeneratePayslip(status: EmploymentStatus, date: Date = new Date()): boolean {
  const config = getPayslipConfig(status)
  const dayOfMonth = date.getDate()
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  
  // Handle 30th for months with fewer days (use last day of month)
  return config.allowedDays.some(day => {
    if (day === 30 && lastDayOfMonth < 30) {
      return dayOfMonth === lastDayOfMonth
    }
    return dayOfMonth === day
  })
}

export function getNextPayslipDate(status: EmploymentStatus, fromDate: Date = new Date()): Date {
  const config = getPayslipConfig(status)
  const currentDay = fromDate.getDate()
  const currentMonth = fromDate.getMonth()
  const currentYear = fromDate.getFullYear()
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  // Find the next allowed day
  const sortedDays = [...config.allowedDays].sort((a, b) => a - b)
  
  for (const day of sortedDays) {
    const effectiveDay = day === 30 && lastDayOfMonth < 30 ? lastDayOfMonth : day
    if (effectiveDay > currentDay) {
      return new Date(currentYear, currentMonth, effectiveDay)
    }
  }
  
  // If no day found in current month, get first day of next month
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
  const firstDay = sortedDays[0]
  
  return new Date(nextYear, nextMonth, firstDay)
}

export function formatAllowedDays(status: EmploymentStatus): string {
  const config = getPayslipConfig(status)
  return config.allowedDays.map(d => `${d}${getOrdinalSuffix(d)}`).join(' and ')
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export function getCurrentCutoffPeriod(status: EmploymentStatus, date: Date = new Date()) {
  const config = getPayslipConfig(status)
  const day = date.getDate()
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()

  if (status === 'PERMANENT' || status === 'INACTIVE') {
    if (day <= 15) {
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month, 15, 23, 59, 59, 999),
        label: '1st - 15th',
        payoutDay: 15,
      }
    } else {
      return {
        start: new Date(year, month, 16),
        end: new Date(year, month, lastDay, 23, 59, 59, 999),
        label: `16th - ${lastDay}${getOrdinalSuffix(lastDay)}`,
        payoutDay: lastDay >= 30 ? 30 : lastDay,
      }
    }
  } else {
    // CONTRACTUAL / TEMPORARY
    if (day <= 5) {
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month, 5, 23, 59, 59, 999),
        label: '1st - 5th',
        payoutDay: 5,
      }
    } else if (day <= 20) {
      return {
        start: new Date(year, month, 6),
        end: new Date(year, month, 20, 23, 59, 59, 999),
        label: '6th - 20th',
        payoutDay: 20,
      }
    } else {
      // After 20th, next cutoff is 1st-5th of next month
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      return {
        start: new Date(nextYear, nextMonth, 1),
        end: new Date(nextYear, nextMonth, 5, 23, 59, 59, 999),
        label: '1st - 5th',
        payoutDay: 5,
      }
    }
  }
}

export function getCutoffPeriodsForMonth(status: EmploymentStatus, year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate()

  if (status === 'PERMANENT' || status === 'INACTIVE') {
    return [
      {
        value: 'first',
        label: '1st - 15th (Payout: 15th)',
        start: new Date(year, month, 1),
        end: new Date(year, month, 15, 23, 59, 59, 999),
        payoutDay: 15,
      },
      {
        value: 'second',
        label: `16th - ${lastDay}${getOrdinalSuffix(lastDay)} (Payout: ${lastDay >= 30 ? '30th' : lastDay + getOrdinalSuffix(lastDay)})`,
        start: new Date(year, month, 16),
        end: new Date(year, month, lastDay, 23, 59, 59, 999),
        payoutDay: lastDay >= 30 ? 30 : lastDay,
      },
    ]
  } else {
    // CONTRACTUAL / TEMPORARY
    return [
      {
        value: 'first',
        label: '1st - 5th (Payout: 5th)',
        start: new Date(year, month, 1),
        end: new Date(year, month, 5, 23, 59, 59, 999),
        payoutDay: 5,
      },
      {
        value: 'second',
        label: '6th - 20th (Payout: 20th)',
        start: new Date(year, month, 6),
        end: new Date(year, month, 20, 23, 59, 59, 999),
        payoutDay: 20,
      },
    ]
  }
}

