export interface AttendanceRecord {
  id: string
  date: string
  dayOfWeek: string
  timeIn: string | null
  timeOut: string | null
  status: string
  hours: number
  
  // New fields for improved attendance tracking
  sessionType?: string | null // 'morning', 'afternoon', 'full_day'
  isHalfDay?: boolean
  isEarlyOut?: boolean
  earlyOutReason?: string | null
  morningTimeIn?: string | null
  morningTimeOut?: string | null
  afternoonTimeIn?: string | null
  afternoonTimeOut?: string | null
  totalSessions?: number
  isLate?: boolean
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