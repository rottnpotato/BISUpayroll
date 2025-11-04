import { prisma } from './database'

export interface PayrollPeriod {
  startDate: Date
  endDate: Date
  scheduleId: string
  scheduleName: string
  scheduleType: string
}

/**
 * Calculate the payroll period based on the schedule type and current date
 */
export function calculatePayrollPeriod(
  currentDate: Date,
  scheduleType: 'monthly' | 'bi-monthly' | 'weekly',
  processingDays?: number[]
): { startDate: Date; endDate: Date } {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const day = currentDate.getDate()

  if (scheduleType === 'monthly') {
    // Monthly: 1st to last day of previous month
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    
    const startDate = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999) // Last day of previous month
    
    return { startDate, endDate }
  }

  if (scheduleType === 'bi-monthly') {
    // Bi-monthly: Two periods per month
    // If today is around the first processing day (e.g., 15th), generate for 1st-15th
    // If today is around the second processing day (e.g., 5th of next month), generate for 16th-end of prev month
    
    const firstProcessingDay = processingDays?.[0] || 20 // Default: 20th for first period (1-15)
    const secondProcessingDay = processingDays?.[1] || 5  // Default: 5th for second period (16-end)

    // Determine which period we should generate based on current day
    if (day >= firstProcessingDay && day <= 25) {
      // Generate for 1st to 15th of current month
      return {
        startDate: new Date(year, month, 1, 0, 0, 0, 0),
        endDate: new Date(year, month, 15, 23, 59, 59, 999)
      }
    } else if (day >= 1 && day <= secondProcessingDay) {
      // Generate for 16th to end of previous month
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const lastDay = new Date(year, month, 0).getDate() // Last day of previous month
      
      return {
        startDate: new Date(prevYear, prevMonth, 16, 0, 0, 0, 0),
        endDate: new Date(prevYear, prevMonth, lastDay, 23, 59, 59, 999)
      }
    } else {
      // Between periods, generate for previous completed period
      if (day > 15 && day < firstProcessingDay) {
        // Generate for 1st to 15th of current month (late)
        return {
          startDate: new Date(year, month, 1, 0, 0, 0, 0),
          endDate: new Date(year, month, 15, 23, 59, 59, 999)
        }
      } else {
        // Generate for 16th to end of previous month (late)
        const prevMonth = month === 0 ? 11 : month - 1
        const prevYear = month === 0 ? year - 1 : year
        const lastDay = new Date(year, month, 0).getDate()
        
        return {
          startDate: new Date(prevYear, prevMonth, 16, 0, 0, 0, 0),
          endDate: new Date(prevYear, prevMonth, lastDay, 23, 59, 59, 999)
        }
      }
    }
  }

  if (scheduleType === 'weekly') {
    // Weekly: Previous 7 days from Sunday to Saturday
    const dayOfWeek = currentDate.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek // If Sunday, go back 7 days, else go back to last Sunday
    
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() - daysToSubtract) // Last Saturday
    endDate.setHours(23, 59, 59, 999)
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 6) // Previous Sunday
    startDate.setHours(0, 0, 0, 0)
    
    return { startDate, endDate }
  }

  // Default to monthly if unknown type
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  
  return {
    startDate: new Date(prevYear, prevMonth, 1, 0, 0, 0, 0),
    endDate: new Date(year, month, 0, 23, 59, 59, 999)
  }
}

/**
 * Check if payroll should be generated today based on the active schedule
 */
export async function shouldGeneratePayrollToday(): Promise<{
  shouldGenerate: boolean
  reason: string
  period?: PayrollPeriod
}> {
  const today = new Date()
  const currentDay = today.getDate()

  // Get active schedule
  const activeSchedule = await prisma.payrollSchedule.findFirst({
    where: { isActive: true }
  })

  if (!activeSchedule) {
    return {
      shouldGenerate: false,
      reason: 'No active payroll schedule found'
    }
  }

  const scheduleType = (activeSchedule.cutoffType || 'monthly') as 'monthly' | 'bi-monthly' | 'weekly'
  
  // Determine if today is a processing day
  let isProcessingDay = false
  
  if (scheduleType === 'monthly') {
    // For monthly, check if today matches the payroll release day
    const releaseDay = activeSchedule.payrollReleaseDay || 1
    isProcessingDay = currentDay === releaseDay
  } else if (scheduleType === 'bi-monthly') {
    // For bi-monthly, check if today matches any processing day
    const processingDays = activeSchedule.processingDays || [20, 5]
    isProcessingDay = processingDays.includes(currentDay)
  } else if (scheduleType === 'weekly') {
    // For weekly, generate every Monday (day 1)
    isProcessingDay = today.getDay() === 1
  }

  if (!isProcessingDay) {
    return {
      shouldGenerate: false,
      reason: `Today is not a processing day for ${scheduleType} schedule`
    }
  }

  // Calculate the payroll period for this processing day
  const { startDate, endDate } = calculatePayrollPeriod(
    today,
    scheduleType,
    activeSchedule.processingDays || undefined
  )

  // Check if payroll has already been generated for this period
  const existingPayroll = await prisma.payrollResult.findFirst({
    where: {
      payPeriodStart: startDate,
      payPeriodEnd: endDate
    }
  })

  if (existingPayroll) {
    return {
      shouldGenerate: false,
      reason: `Payroll already generated for period ${startDate.toDateString()} to ${endDate.toDateString()}`
    }
  }

  return {
    shouldGenerate: true,
    reason: `Scheduled ${scheduleType} payroll generation for period ${startDate.toDateString()} to ${endDate.toDateString()}`,
    period: {
      startDate,
      endDate,
      scheduleId: activeSchedule.id,
      scheduleName: activeSchedule.name,
      scheduleType
    }
  }
}

/**
 * Get the current payroll period based on the active schedule
 */
export async function getCurrentPayrollPeriod(): Promise<PayrollPeriod | null> {
  const activeSchedule = await prisma.payrollSchedule.findFirst({
    where: { isActive: true }
  })

  if (!activeSchedule) {
    return null
  }

  const scheduleType = (activeSchedule.cutoffType || 'monthly') as 'monthly' | 'bi-monthly' | 'weekly'
  const today = new Date()
  
  const { startDate, endDate } = calculatePayrollPeriod(
    today,
    scheduleType,
    activeSchedule.processingDays || undefined
  )

  return {
    startDate,
    endDate,
    scheduleId: activeSchedule.id,
    scheduleName: activeSchedule.name,
    scheduleType
  }
}
