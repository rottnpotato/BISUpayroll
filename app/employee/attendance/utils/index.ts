import { AttendanceRecord } from "../types"

export const calculateUndertime = (record: AttendanceRecord): string => {
  if (record.status.toLowerCase() === 'absent') return "-"

  let totalUndertimeMinutes = 0

  // Helper to get minutes from time string (e.g. "08:00 AM")
  const getMinutes = (timeStr: string) => {
    if (!timeStr) return 0
    const [time, period] = timeStr.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    
    return hours * 60 + minutes
  }

  // Morning Schedule: 8:00 - 12:00
  const MORNING_START = 8 * 60 // 8:00
  const MORNING_END = 12 * 60 // 12:00
  
  // Afternoon Schedule: 13:00 - 17:00
  const AFTERNOON_START = 13 * 60 // 13:00
  const AFTERNOON_END = 17 * 60 // 17:00

  // Grace period
  const GRACE_PERIOD = 15

  if (record.morningTimeIn) {
    const inMinutes = getMinutes(record.morningTimeIn)
    if (inMinutes > MORNING_START + GRACE_PERIOD) {
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
    if (inMinutes > AFTERNOON_START + GRACE_PERIOD) {
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
        if (inMinutes > MORNING_START + GRACE_PERIOD) {
           totalUndertimeMinutes += (inMinutes - MORNING_START)
        }
     } else {
        if (inMinutes > AFTERNOON_START + GRACE_PERIOD) {
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
