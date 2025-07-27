export interface User {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
  position: string
}

export interface AttendanceRecord {
  id: string
  userId: string
  date: string
  timeIn: string | null
  timeOut: string | null
  hoursWorked: number | null
  isLate: boolean
  isAbsent: boolean
  status: AttendanceApprovalStatus
  rejectionReason?: string | null
  approvedById?: string | null
  approvedAt?: string | null
  user: User
  approvedBy: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export interface AttendanceResponse {
  records: AttendanceRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SummaryStats {
  present: number
  late: number
  absent: number
  onLeave: number
  totalEmployees: number
}

export interface AttendanceFormData {
  userId: string
  date: string
  timeIn: string
  timeOut: string
  isLate: boolean
  isAbsent: boolean
}

export interface AttendanceFilters {
  searchTerm: string
  selectedDepartment: string
  selectedStatus: string
  selectedDate: Date | undefined
  currentPage: number
}

export type AttendanceStatus = "all" | "present" | "late" | "absent" 

export type AttendanceApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface AttendanceApprovalAction {
  action: "approve" | "reject"
  reason?: string
} 