import { AttendanceRecord } from "../types"
import { getManilaHours, getManilaMinutes } from "@/lib/timezone"
import { getScheduleInMinutes } from "@/lib/attendance-schedules"

export const calculateUndertime = (record: AttendanceRecord): string => {
  if (record.status.toLowerCase() === 'absent') return "-"

  let totalUndertimeMinutes = 0

  // Helper to get minutes from time string using standardized Manila time utilities
  const getMinutes = (timeStr: string): number => {
    if (!timeStr) return 0
    
    // Check if it's already a formatted time string (e.g., "08:00 AM")
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [time, period] = timeStr.split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      
      return hours * 60 + minutes
    }
    
    // Otherwise, assume it's an ISO date string
    const date = new Date(timeStr)
    const hours = getManilaHours(date)
    const minutes = getManilaMinutes(date)
    return hours * 60 + minutes
  }

  // Get employee-specific schedule (fallback to default if no employeeType)
  const schedule = getScheduleInMinutes((record as any).user?.employeeType || null)
  const MORNING_START = schedule.morningStart
  const MORNING_END = schedule.morningEnd
  const AFTERNOON_START = schedule.afternoonStart
  const AFTERNOON_END = schedule.afternoonEnd

  if (record.morningTimeIn) {
    const inMinutes = getMinutes(record.morningTimeIn)
    if (inMinutes > MORNING_START) {
      totalUndertimeMinutes += (inMinutes - MORNING_START)
    }
  }

  if (record.morningTimeOut) {
    const outMinutes = getMinutes(record.morningTimeOut)
    if (outMinutes < MORNING_END) {
      totalUndertimeMinutes += (MORNING_END - outMinutes)
    }
  }

  if (record.afternoonTimeIn) {
    const inMinutes = getMinutes(record.afternoonTimeIn)
    if (inMinutes > AFTERNOON_START) {
      totalUndertimeMinutes += (inMinutes - AFTERNOON_START)
    }
  }

  if (record.afternoonTimeOut) {
    const outMinutes = getMinutes(record.afternoonTimeOut)
    if (outMinutes < AFTERNOON_END) {
      totalUndertimeMinutes += (AFTERNOON_END - outMinutes)
    }
  }

  // Fallback for single punch records
  if (!record.morningTimeIn && !record.afternoonTimeIn && record.timeIn) {
     const inMinutes = getMinutes(record.timeIn)
     if (inMinutes < 12 * 60) {
        if (inMinutes > MORNING_START) {
           totalUndertimeMinutes += (inMinutes - MORNING_START)
        }
     } else {
        if (inMinutes > AFTERNOON_START) {
           totalUndertimeMinutes += (inMinutes - AFTERNOON_START)
        }
     }
  }
  
  if (!record.morningTimeOut && !record.afternoonTimeOut && record.timeOut) {
      const outMinutes = getMinutes(record.timeOut)
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
