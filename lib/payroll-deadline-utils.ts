import { prisma } from "@/lib/database"

export interface PayrollDeadlineStatus {
  isMissed: boolean
  daysOverdue?: number
  expectedGenerationDate?: Date
  nextGenerationDate?: Date
  scheduleName?: string
  message?: string
}

export interface PayrollScheduleInfo {
  id: string
  name: string
  days: number[]
  cutoffDays?: number[]
  payrollReleaseDay?: number
  processingDays?: number[]
  cutoffType?: string
  isActive: boolean
}

/**
 * Checks if payroll generation deadline has been missed for the current period
 */
export async function checkPayrollDeadlineStatus(): Promise<PayrollDeadlineStatus> {
  try {
    // Get active payroll schedule
    const activeSchedule = await prisma.payrollSchedule.findFirst({
      where: { isActive: true }
    })

    if (!activeSchedule) {
      return {
        isMissed: false,
        message: "No active payroll schedule configured"
      }
    }

    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const currentDay = today.getDate()

    // Calculate expected generation date based on schedule
    let expectedGenerationDate: Date | null = null
    let nextGenerationDate: Date | undefined = undefined

    if (activeSchedule.days && activeSchedule.days.length > 0) {
      // Find the most recent payroll day that should have been processed
      const payrollDays = activeSchedule.days.sort((a, b) => a - b)
      
      for (const day of payrollDays) {
        const payrollDate = new Date(currentYear, currentMonth, day)
        
        if (payrollDate <= today) {
          expectedGenerationDate = payrollDate
        } else if (!nextGenerationDate) {
          nextGenerationDate = payrollDate
        }
      }

      // If no payroll date found in current month, check previous month
      if (!expectedGenerationDate) {
        const lastDayOfPrevMonth = payrollDays[payrollDays.length - 1]
        expectedGenerationDate = new Date(currentYear, currentMonth - 1, lastDayOfPrevMonth)
      }

      // If no next date found, use first day of next month
      if (!nextGenerationDate) {
        const firstDayOfNextMonth = payrollDays[0]
        nextGenerationDate = new Date(currentYear, currentMonth + 1, firstDayOfNextMonth)
      }
    }

    if (!expectedGenerationDate) {
      return {
        isMissed: false,
        message: "Unable to determine payroll generation date"
      }
    }

    // Check if payroll has been generated for the expected period
    const startOfPeriod = new Date(expectedGenerationDate.getFullYear(), expectedGenerationDate.getMonth(), 1)
    const endOfPeriod = new Date(expectedGenerationDate.getFullYear(), expectedGenerationDate.getMonth() + 1, 0)

    const existingPayroll = await prisma.payrollResult.findFirst({
      where: {
        payPeriodStart: {
          gte: startOfPeriod
        },
        payPeriodEnd: {
          lte: endOfPeriod
        }
      }
    })

    // Calculate days overdue
    const timeDiff = today.getTime() - expectedGenerationDate.getTime()
    const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

    const isMissed = !existingPayroll && daysOverdue > 0

    let message = ""
    if (isMissed) {
      if (daysOverdue === 1) {
        message = `Payroll generation is 1 day overdue. It was scheduled for ${expectedGenerationDate.toLocaleDateString()}.`
      } else {
        message = `Payroll generation is ${daysOverdue} days overdue. It was scheduled for ${expectedGenerationDate.toLocaleDateString()}.`
      }
    } else if (existingPayroll) {
      message = "Payroll has been generated for the current period."
    } else {
      const daysUntilNext = Math.ceil((nextGenerationDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      message = `Next payroll generation is scheduled for ${nextGenerationDate!.toLocaleDateString()} (${daysUntilNext} days).`
    }

    return {
      isMissed,
      daysOverdue: isMissed ? daysOverdue : undefined,
      expectedGenerationDate,
      nextGenerationDate,
      scheduleName: activeSchedule.name,
      message
    }
  } catch (error) {
    console.error('Error checking payroll deadline status:', error)
    return {
      isMissed: false,
      message: "Error checking payroll deadline status"
    }
  }
}

/**
 * Gets detailed information about missed payroll deadlines for a specific period
 */
export async function getMissedPayrollDetails(
  startDate: Date,
  endDate: Date
): Promise<{
  missedDeadlines: Array<{
    expectedDate: Date
    daysOverdue: number
    scheduleName: string
    hasCatchupGeneration: boolean
  }>
  totalMissed: number
}> {
  try {
    const activeSchedule = await prisma.payrollSchedule.findFirst({
      where: { isActive: true }
    })

    if (!activeSchedule || !activeSchedule.days || activeSchedule.days.length === 0) {
      return { missedDeadlines: [], totalMissed: 0 }
    }

    const missedDeadlines: Array<{
      expectedDate: Date
      daysOverdue: number
      scheduleName: string
      hasCatchupGeneration: boolean
    }> = []

    const today = new Date()
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      for (const day of activeSchedule.days) {
        const expectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        
        if (expectedDate <= today) {
          // Check if payroll was generated for this period
          const periodStart = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), 1)
          const periodEnd = new Date(expectedDate.getFullYear(), expectedDate.getMonth() + 1, 0)

          const existingPayroll = await prisma.payrollResult.findFirst({
            where: {
              payPeriodStart: {
                gte: periodStart
              },
              payPeriodEnd: {
                lte: periodEnd
              }
            }
          })

          if (!existingPayroll) {
            const daysOverdue = Math.floor((today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysOverdue > 0) {
              missedDeadlines.push({
                expectedDate,
                daysOverdue,
                scheduleName: activeSchedule.name,
                hasCatchupGeneration: false // Could be enhanced to check for late generation
              })
            }
          }
        }
      }
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    }

    return {
      missedDeadlines,
      totalMissed: missedDeadlines.length
    }
  } catch (error) {
    console.error('Error getting missed payroll details:', error)
    return { missedDeadlines: [], totalMissed: 0 }
  }
}

/**
 * Checks if payroll files have been generated and stored properly
 */
export async function checkPayrollFileStatus(
  payPeriodStart: Date,
  payPeriodEnd: Date
): Promise<{
  hasGeneratedFiles: boolean
  fileCount: number
  totalEmployees: number
  encryptedFiles: number
  lastGenerated?: Date
}> {
  try {
    const payrollFiles = await prisma.payrollFile.findMany({
      where: {
        payPeriodStart: {
          gte: payPeriodStart
        },
        payPeriodEnd: {
          lte: payPeriodEnd
        },
        isArchived: false
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    const totalEmployees = payrollFiles.reduce((sum, file) => sum + file.employeeCount, 0)
    const encryptedFiles = payrollFiles.filter(file => file.filePath.endsWith('.enc')).length

    return {
      hasGeneratedFiles: payrollFiles.length > 0,
      fileCount: payrollFiles.length,
      totalEmployees,
      encryptedFiles,
      lastGenerated: payrollFiles.length > 0 ? payrollFiles[0].generatedAt : undefined
    }
  } catch (error) {
    console.error('Error checking payroll file status:', error)
    return {
      hasGeneratedFiles: false,
      fileCount: 0,
      totalEmployees: 0,
      encryptedFiles: 0
    }
  }
}

/**
 * Gets upcoming payroll deadlines for dashboard display
 */
export async function getUpcomingPayrollDeadlines(daysAhead: number = 30): Promise<Array<{
  date: Date
  type: 'generation' | 'cutoff' | 'payment'
  scheduleName: string
  daysUntil: number
  isUrgent: boolean
}>> {
  try {
    const activeSchedule = await prisma.payrollSchedule.findFirst({
      where: { isActive: true }
    })

    if (!activeSchedule) {
      return []
    }

    const today = new Date()
    const endDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)
    const deadlines: Array<{
      date: Date
      type: 'generation' | 'cutoff' | 'payment'
      scheduleName: string
      daysUntil: number
      isUrgent: boolean
    }> = []

    let currentDate = new Date(today)
    while (currentDate <= endDate) {
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()

      // Add generation deadlines
      if (activeSchedule.days) {
        for (const day of activeSchedule.days) {
          const deadline = new Date(currentYear, currentMonth, day)
          if (deadline >= today && deadline <= endDate) {
            const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            deadlines.push({
              date: deadline,
              type: 'generation',
              scheduleName: activeSchedule.name,
              daysUntil,
              isUrgent: daysUntil <= 3
            })
          }
        }
      }

      // Add cutoff deadlines
      if (activeSchedule.cutoffDays) {
        for (const day of activeSchedule.cutoffDays) {
          const deadline = new Date(currentYear, currentMonth, day)
          if (deadline >= today && deadline <= endDate) {
            const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            deadlines.push({
              date: deadline,
              type: 'cutoff',
              scheduleName: activeSchedule.name,
              daysUntil,
              isUrgent: daysUntil <= 2
            })
          }
        }
      }

      // Add payment deadlines
      if (activeSchedule.payrollReleaseDay) {
        const deadline = new Date(currentYear, currentMonth, activeSchedule.payrollReleaseDay)
        if (deadline >= today && deadline <= endDate) {
          const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          deadlines.push({
            date: deadline,
            type: 'payment',
            scheduleName: activeSchedule.name,
            daysUntil,
            isUrgent: daysUntil <= 1
          })
        }
      }

      // Move to next month
      currentDate = new Date(currentYear, currentMonth + 1, 1)
    }

    return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime())
  } catch (error) {
    console.error('Error getting upcoming payroll deadlines:', error)
    return []
  }
}