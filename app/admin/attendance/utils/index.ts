import { format } from "date-fns"
import type { AttendanceRecord, SummaryStats, AttendanceStatus } from "../types"
import { MANILA_TZ_ID, getManilaHours, getManilaMinutes } from "@/lib/timezone"
import { getScheduleInMinutes } from "@/lib/attendance-schedules"

const manilaTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: MANILA_TZ_ID,
})

export const formatTime = (dateString: string | null): string => {
  if (!dateString) return "-"
  return manilaTimeFormatter.format(new Date(dateString))
}

export const formatHours = (hours: number | null): string => {
  if (!hours) return "-"
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

export const calculateUndertime = (record: AttendanceRecord): string => {
  if (record.isAbsent) return "-"
  
  let totalUndertimeMinutes = 0

  // Helper to get minutes from time string using standardized Manila time utilities
  const getMinutes = (dateStr: string): number => {
    const date = new Date(dateStr)
    const hours = getManilaHours(date)
    const minutes = getManilaMinutes(date)
    return hours * 60 + minutes
  }

  // Get employee-specific schedule
  const schedule = getScheduleInMinutes(record.user.employeeType)
  const MORNING_END = schedule.morningEnd
  const AFTERNOON_END = schedule.afternoonEnd

  // UNDERTIME: Only count early departures (leaving before scheduled end time)
  if (record.morningTimeOut) {
    const outMinutes = getMinutes(record.morningTimeOut)
    if (outMinutes < MORNING_END) {
      totalUndertimeMinutes += (MORNING_END - outMinutes)
    }
  }

  if (record.afternoonTimeOut) {
    const outMinutes = getMinutes(record.afternoonTimeOut)
    if (outMinutes < AFTERNOON_END) {
      totalUndertimeMinutes += (AFTERNOON_END - outMinutes)
    }
  }

  // Fallback for single punch records (legacy support)
  if (!record.morningTimeOut && !record.afternoonTimeOut && record.timeOut) {
    const outMinutes = getMinutes(record.timeOut)
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
  if (record.isAbsent) return "-"
  
  let totalLateMinutes = 0

  // Helper to get minutes from time string using standardized Manila time utilities
  const getMinutes = (dateStr: string): number => {
    const date = new Date(dateStr)
    const hours = getManilaHours(date)
    const minutes = getManilaMinutes(date)
    return hours * 60 + minutes
  }

  // Get employee-specific schedule
  const schedule = getScheduleInMinutes(record.user.employeeType)
  const MORNING_START = schedule.morningStart
  const AFTERNOON_START = schedule.afternoonStart

  // LATE: Only count late arrivals (arriving after scheduled start time)
  if (record.morningTimeIn) {
    const inMinutes = getMinutes(record.morningTimeIn)
    if (inMinutes > MORNING_START) {
      totalLateMinutes += (inMinutes - MORNING_START)
    }
  }

  if (record.afternoonTimeIn) {
    const inMinutes = getMinutes(record.afternoonTimeIn)
    if (inMinutes > AFTERNOON_START) {
      totalLateMinutes += (inMinutes - AFTERNOON_START)
    }
  }

  // Fallback for single punch records (legacy support)
  if (!record.morningTimeIn && !record.afternoonTimeIn && record.timeIn) {
    const inMinutes = getMinutes(record.timeIn)
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

export const getRecordStatus = (record: AttendanceRecord): AttendanceStatus => {
  if (record.isAbsent) return "absent"
  if (record.timeIn && record.isLate) return "late"
  if (record.timeIn) return "present"
  return "absent"
}

export const calculateSummaryStats = (
  records: AttendanceRecord[],
  totalEmployees: number
): SummaryStats => {
  return records.reduce(
    (acc, record) => {
      if (record.isAbsent) {
        acc.absent++
      } else if (record.timeIn) {
        if (record.isLate) {
          acc.late++
        } else {
          acc.present++
        }
      }
      return acc
    },
    { present: 0, late: 0, absent: 0, onLeave: 0, totalEmployees }
  )
}

export const filterAttendanceRecords = (
  records: AttendanceRecord[],
  searchTerm: string,
  selectedStatus: string
): AttendanceRecord[] => {
  const filtered = records.filter(record => {
    const matchesSearch =
      `${record.user.firstName} ${record.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.department.toLowerCase().includes(searchTerm.toLowerCase())

    const recordStatus = getRecordStatus(record)
    const matchesStatus = selectedStatus === "all" || recordStatus === selectedStatus

    const result = matchesSearch && matchesStatus

    // Debug logging for first few records
    if (records.indexOf(record) < 3) {
      console.log('Filter debug for record:', {
        name: `${record.user.firstName} ${record.user.lastName}`,
        searchTerm,
        selectedStatus,
        recordStatus,
        matchesSearch,
        matchesStatus,
        result
      })
    }

    return result
  })

  console.log('filterAttendanceRecords:', {
    input: records.length,
    output: filtered.length,
    searchTerm,
    selectedStatus
  })

  return filtered
}

export const buildApiParams = (
  currentPage: number,
  selectedDate: Date | undefined,
  selectedDepartment: string,
  limit: number = 10,
  startDate?: Date | undefined,
  endDate?: Date | undefined,
  searchTerm?: string,
  selectedStatus?: string,
  selectedEmployeeStatus?: string
): URLSearchParams => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: limit.toString()
  })

  // Handle date range filtering
  if (startDate && endDate) {
    // Use date range
    params.append('startDate', format(startDate, 'yyyy-MM-dd'))
    params.append('endDate', format(endDate, 'yyyy-MM-dd'))
  } else if (selectedDate) {
    // Use single date - set both start and end to same date for full day coverage
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    params.append('startDate', dateStr)
    params.append('endDate', dateStr)
  }

  if (selectedDepartment !== "All Departments") {
    params.append('department', selectedDepartment)
  }

  if (searchTerm) {
    params.append('search', searchTerm)
  }

  if (selectedStatus && selectedStatus !== "all") {
    params.append('status', selectedStatus)
  }

  if (selectedEmployeeStatus && selectedEmployeeStatus !== "all") {
    params.append('employeeStatus', selectedEmployeeStatus)
  }

  return params
}

export const exportToJson = (data: any[], filename: string): void => {
  const dataStr = JSON.stringify(data, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', filename)
  linkElement.click()
}