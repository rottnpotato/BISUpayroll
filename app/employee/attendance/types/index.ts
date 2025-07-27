export interface AttendanceRecord {
  id: string
  date: string
  dayOfWeek: string
  timeIn: string | null
  timeOut: string | null
  status: string
  hours: number
}

export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  totalHours: number
  averageHoursPerDay: number
}

export interface AttendanceData {
  records: AttendanceRecord[]
  summary: AttendanceSummary
}

export interface TimeActionState {
  isClockingIn: boolean
  isClockingOut: boolean
  isTimeActionDialogOpen: boolean
  pendingAction: 'time-in' | 'time-out' | null
}

export interface AttendanceFilters {
  selectedMonth: number
  selectedYear: number
} 