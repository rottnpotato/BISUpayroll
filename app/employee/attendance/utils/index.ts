import { AttendanceRecord } from "../types"
import { getManilaHours, getManilaMinutes } from "@/lib/timezone"
import { getScheduleInMinutes } from "@/lib/attendance-schedules"

export const calculateUndertime = (record: AttendanceRecord): string => {
  if (record.status.toLowerCase() === 'absent') return "-"
  // Note: Unlike late, we now calculate undertime even on weekends

  // Prefer DB-calculated undertimeMinutes when available
  const dbUndertime = (record as any).undertimeMinutes
  if (typeof dbUndertime === 'number' && dbUndertime > 0) {
    const h = Math.floor(dbUndertime / 60)
    const m = dbUndertime % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  let totalUndertimeMinutes = 0

  // Helper to get minutes from time string using standardized Manila time utilities
  const getMinutes = (dateStr: string): number => {
    const date = new Date(dateStr)
    const hours = getManilaHours(date)
    const minutes = getManilaMinutes(date)
    return hours * 60 + minutes
  }

  // Get employee-specific schedule
  const schedule = getScheduleInMinutes((record as any).user?.employeeType || null)
  const MORNING_END = schedule.morningEnd
  const AFTERNOON_END = schedule.afternoonEnd

  // UNDERTIME: Only count early departures (leaving before scheduled end time)
  // Use ISO fields if available, fall back to formatted fields
  const morningTimeOut = record.morningTimeOutISO || record.morningTimeOut
  const afternoonTimeOut = record.afternoonTimeOutISO || record.afternoonTimeOut
  const timeOut = record.timeOutISO || record.timeOut

  if (morningTimeOut) {
    const outMinutes = getMinutes(morningTimeOut)
    if (outMinutes < MORNING_END) {
      totalUndertimeMinutes += (MORNING_END - outMinutes)
    }
  }

  if (afternoonTimeOut) {
    const outMinutes = getMinutes(afternoonTimeOut)
    if (outMinutes < AFTERNOON_END) {
      totalUndertimeMinutes += (AFTERNOON_END - outMinutes)
    }
  }

  // Fallback for single punch records (legacy support)
  if (!morningTimeOut && !afternoonTimeOut && timeOut) {
    const outMinutes = getMinutes(timeOut)
    // Assume afternoon end if after 13:00, else morning end
    if (outMinutes > 13 * 60) {
      if (outMinutes < AFTERNOON_END) {
        totalUndertimeMinutes += (AFTERNOON_END - outMinutes)
      }
    } else {
      if (outMinutes < MORNING_END) {
        totalUndertimeMinutes += (MORNING_END - outMinutes)
      }
    }
  }

  if (totalUndertimeMinutes <= 0) return "-"

  const h = Math.floor(totalUndertimeMinutes / 60)
  const m = totalUndertimeMinutes % 60
  
  if (h > 0) {
    return `${h}h ${m}m`
  }
  return `${m}m`
}

export const calculateLate = (record: AttendanceRecord): string => {
  if (record.status.toLowerCase() === 'absent') return "-"
  // Note: We now calculate late even on weekends

  // Prefer DB-calculated lateMinutes when available
  const dbLate = (record as any).lateMinutes
  if (typeof dbLate === 'number' && dbLate > 0) {
    const h = Math.floor(dbLate / 60)
    const m = dbLate % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  let totalLateMinutes = 0

  // Helper to get minutes from time string using standardized Manila time utilities
  const getMinutes = (dateStr: string): number => {
    const date = new Date(dateStr)
    const hours = getManilaHours(date)
    const minutes = getManilaMinutes(date)
    return hours * 60 + minutes
  }

  // Get employee-specific schedule
  const schedule = getScheduleInMinutes((record as any).user?.employeeType || null)
  const MORNING_START = schedule.morningStart
  const AFTERNOON_START = schedule.afternoonStart

  // LATE: Only count late arrivals (arriving after scheduled start time)
  // Use ISO fields if available, fall back to formatted fields
  const morningTimeIn = record.morningTimeInISO || record.morningTimeIn
  const afternoonTimeIn = record.afternoonTimeInISO || record.afternoonTimeIn
  const timeIn = record.timeInISO || record.timeIn

  if (morningTimeIn) {
    const inMinutes = getMinutes(morningTimeIn)
    if (inMinutes > MORNING_START) {
      totalLateMinutes += (inMinutes - MORNING_START)
    }
  }

  if (afternoonTimeIn) {
    const inMinutes = getMinutes(afternoonTimeIn)
    if (inMinutes > AFTERNOON_START) {
      totalLateMinutes += (inMinutes - AFTERNOON_START)
    }
  }

  // Fallback for single punch records (legacy support)
  if (!morningTimeIn && !afternoonTimeIn && timeIn) {
    const inMinutes = getMinutes(timeIn)
    // Assume morning start if before 12:00, else afternoon start
    if (inMinutes < 12 * 60) {
      if (inMinutes > MORNING_START) {
        totalLateMinutes += (inMinutes - MORNING_START)
      }
    } else {
      if (inMinutes > AFTERNOON_START) {
        totalLateMinutes += (inMinutes - AFTERNOON_START)
      }
    }
  }

  if (totalLateMinutes <= 0) return "-"

  const h = Math.floor(totalLateMinutes / 60)
  const m = totalLateMinutes % 60
  
  if (h > 0) {
    return `${h}h ${m}m`
  }
  return `${m}m`
}
