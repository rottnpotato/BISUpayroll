import { format } from "date-fns"
import type { AttendanceRecord, SummaryStats, AttendanceStatus } from "../types"

export const formatTime = (dateString: string | null): string => {
  if (!dateString) return "-"
  return format(new Date(dateString), 'h:mm a')
}

export const formatHours = (hours: number | null): string => {
  if (!hours) return "-"
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
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
  return records.filter(record => {
    const matchesSearch = 
      `${record.user.firstName} ${record.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const recordStatus = getRecordStatus(record)
    const matchesStatus = selectedStatus === "all" || recordStatus === selectedStatus
    
    return matchesSearch && matchesStatus
  })
}

export const buildApiParams = (
  currentPage: number,
  selectedDate: Date | undefined,
  selectedDepartment: string,
  limit: number = 10
): URLSearchParams => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: limit.toString()
  })

  if (selectedDate) {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    params.append('startDate', dateStr)
    params.append('endDate', dateStr)
  }

  if (selectedDepartment !== "All Departments") {
    params.append('department', selectedDepartment)
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