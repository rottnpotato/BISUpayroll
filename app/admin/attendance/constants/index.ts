export const DEPARTMENTS = [
  "All Departments",
  "IT Department", 
  "HR",
  "Accounting",
  "Faculty",
  "Maintenance",
  "Admin Office"
] as const

export const ATTENDANCE_STATUSES = [
  { value: "all", label: "All" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" }
] as const

export const APPROVAL_STATUSES = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" }
] as const

export const PAGINATION_LIMITS = {
  DEFAULT: 10,
  EXPORT: 1000
} as const

export const INITIAL_FORM_DATA = {
  userId: "",
  date: "",
  timeIn: "",
  timeOut: "",
  isLate: false,
  isAbsent: false
} as const

export const INITIAL_SUMMARY_STATS = {
  present: 0,
  late: 0,
  absent: 0,
  onLeave: 0,
  totalEmployees: 0
} as const 