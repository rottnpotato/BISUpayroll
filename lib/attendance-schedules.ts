/**
 * Attendance Schedule Configuration
 * Defines different work schedules for different employee types
 */

export interface AttendanceSchedule {
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
}

export const TEACHING_SCHEDULE: AttendanceSchedule = {
  morningStart: '07:30',
  morningEnd: '11:30',
  afternoonStart: '12:30',
  afternoonEnd: '16:30'
}

export const NON_TEACHING_SCHEDULE: AttendanceSchedule = {
  morningStart: '08:00',
  morningEnd: '12:00',
  afternoonStart: '13:00',
  afternoonEnd: '17:00'
}

// Default schedule (for backward compatibility and unknown types)
export const DEFAULT_SCHEDULE: AttendanceSchedule = NON_TEACHING_SCHEDULE

/**
 * Get the attendance schedule based on employee type
 * @param employeeType The employee type (TEACHING_PERSONNEL, NON_TEACHING_PERSONNEL, etc.)
 * @returns The corresponding schedule
 */
export function getScheduleForEmployeeType(employeeType: string | null | undefined): AttendanceSchedule {
  if (!employeeType) return DEFAULT_SCHEDULE
  
  const type = employeeType.toUpperCase()
  
  if (type === 'TEACHING_PERSONNEL') {
    return TEACHING_SCHEDULE
  } else if (type === 'NON_TEACHING_PERSONNEL' || type === 'CASUAL_PLANTILLA') {
    return NON_TEACHING_SCHEDULE
  }
  
  return DEFAULT_SCHEDULE
}

/**
 * Convert time string (HH:MM) to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes from midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Get schedule in minutes format
 */
export function getScheduleInMinutes(employeeType: string | null | undefined) {
  const schedule = getScheduleForEmployeeType(employeeType)
  return {
    morningStart: timeToMinutes(schedule.morningStart),
    morningEnd: timeToMinutes(schedule.morningEnd),
    afternoonStart: timeToMinutes(schedule.afternoonStart),
    afternoonEnd: timeToMinutes(schedule.afternoonEnd)
  }
}

/**
 * Calculate late minutes and undertime minutes based on actual clock in/out times
 * @param morningTimeIn Morning clock in time
 * @param morningTimeOut Morning clock out time  
 * @param afternoonTimeIn Afternoon clock in time
 * @param afternoonTimeOut Afternoon clock out time
 * @param employeeType Employee type to determine schedule
 * @returns Object with lateMinutes and undertimeMinutes
 */
export function calculateLateAndUndertime(
  morningTimeIn: Date | null,
  morningTimeOut: Date | null,
  afternoonTimeIn: Date | null,
  afternoonTimeOut: Date | null,
  employeeType: string | null | undefined
): { lateMinutes: number; undertimeMinutes: number } {
  const schedule = getScheduleInMinutes(employeeType)
  let lateMinutes = 0
  let undertimeMinutes = 0

  // Helper to get minutes from midnight in Manila time
  const getManilaMinutesFromMidnight = (date: Date): number => {
    const manilaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
    return manilaDate.getUTCHours() * 60 + manilaDate.getUTCMinutes()
  }

  // Calculate late minutes (morning session)
  if (morningTimeIn) {
    const actualMorningInMinutes = getManilaMinutesFromMidnight(morningTimeIn)
    if (actualMorningInMinutes > schedule.morningStart) {
      lateMinutes = actualMorningInMinutes - schedule.morningStart
    }
  } else if (afternoonTimeIn && !morningTimeIn && !morningTimeOut) {
    // No morning session at all - late for entire morning
    const actualAfternoonInMinutes = getManilaMinutesFromMidnight(afternoonTimeIn)
    if (actualAfternoonInMinutes > schedule.morningStart) {
      // Consider late from morning start until afternoon start
      lateMinutes = schedule.afternoonStart - schedule.morningStart
    }
  }

  // Calculate afternoon late minutes if applicable
  if (afternoonTimeIn && morningTimeOut) {
    const actualAfternoonInMinutes = getManilaMinutesFromMidnight(afternoonTimeIn)
    if (actualAfternoonInMinutes > schedule.afternoonStart) {
      const afternoonLate = actualAfternoonInMinutes - schedule.afternoonStart
      lateMinutes += afternoonLate
    }
  }

  // Calculate undertime minutes
  // Morning undertime
  if (morningTimeIn && morningTimeOut) {
    const actualMorningOutMinutes = getManilaMinutesFromMidnight(morningTimeOut)
    if (actualMorningOutMinutes < schedule.morningEnd) {
      undertimeMinutes = schedule.morningEnd - actualMorningOutMinutes
    }
  }

  // Afternoon undertime
  if (afternoonTimeIn && afternoonTimeOut) {
    const actualAfternoonOutMinutes = getManilaMinutesFromMidnight(afternoonTimeOut)
    if (actualAfternoonOutMinutes < schedule.afternoonEnd) {
      const afternoonUndertime = schedule.afternoonEnd - actualAfternoonOutMinutes
      undertimeMinutes += afternoonUndertime
    }
  } else if ((morningTimeIn || morningTimeOut) && !afternoonTimeIn && !afternoonTimeOut) {
    // Had morning session but no afternoon session - entire afternoon is undertime
    const afternoonDuration = schedule.afternoonEnd - schedule.afternoonStart
    undertimeMinutes += afternoonDuration
  }

  // If only afternoon session exists and it ended before scheduled end
  if (!morningTimeIn && !morningTimeOut && afternoonTimeOut) {
    const actualAfternoonOutMinutes = getManilaMinutesFromMidnight(afternoonTimeOut)
    if (actualAfternoonOutMinutes < schedule.afternoonEnd) {
      // Already calculated above, but also need to account for missing morning
      const morningDuration = schedule.morningEnd - schedule.morningStart
      undertimeMinutes += morningDuration
    } else {
      // Afternoon ended on time but missing morning
      const morningDuration = schedule.morningEnd - schedule.morningStart
      undertimeMinutes += morningDuration
    }
  }

  return {
    lateMinutes: Math.max(0, lateMinutes),
    undertimeMinutes: Math.max(0, undertimeMinutes)
  }
}
