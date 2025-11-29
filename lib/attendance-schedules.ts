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
