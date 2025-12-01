export interface AttendanceRecord {
  id: string
  date: string
  dayOfWeek: string
  timeIn: string | null
  timeOut: string | null
  status: string
  hours: number
  lateMinutes?: number
  undertimeMinutes?: number
  
  // New fields for improved attendance tracking
  sessionType?: string | null // 'morning', 'afternoon', 'full_day'
  isHalfDay?: boolean
  isEarlyOut?: boolean
  earlyOutReason?: string | null
  morningTimeIn?: string | null
  morningTimeOut?: string | null
  afternoonTimeIn?: string | null
  afternoonTimeOut?: string | null
  morningTimeInISO?: string | null
  morningTimeOutISO?: string | null
  afternoonTimeInISO?: string | null
  afternoonTimeOutISO?: string | null
  timeInISO?: string | null
  timeOutISO?: string | null
  totalSessions?: number
  isLate?: boolean
  approvalStatus?: string
  rejectionReason?: string | null
  approvedAt?: string | null
  overloadRecords?: OverloadRecord[]
  overtimeRequests?: OvertimeRequest[]
  user?: {
    employeeType?: string | null
  } | null
}

export interface OvertimeRequest {
  id: string
  attendanceId: string
  userId: string
  startTime: string
  endTime: string
  hoursWorked: number
  hourlyRate: number
  totalAmount: number
  description?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt?: string | null
  approvedById?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface OverloadRecord {
  id: string
  attendanceId: string
  userId: string
  startTime: string
  endTime: string
  hoursWorked: number
  hourlyRate: number
  totalAmount: number
  description?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt?: string | null
  approvedById?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface OverloadFormData {
  startTime: string
  endTime: string
  description?: string
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