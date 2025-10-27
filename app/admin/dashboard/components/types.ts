export interface DashboardData {
  overview: {
    totalEmployees: number
    activeEmployees: number
    todayAttendance: number
    thisWeekAttendance: number
    thisMonthPayroll: {
      total: number
      netTotal: number
      count: number
    }
    unpaidPayroll: number
    newEmployeesThisMonth: number
    attendanceRate: number
  }
  employeePayroll: Array<{
    id: string
    userId: string
    payPeriodStart: Date
    payPeriodEnd: Date
    dailyRate: number
    overtime: number
    deductions: number
    bonuses: number
    grossPay: number
    netPay: number
    isPaid: boolean
    createdAt: Date
    user: {
      firstName: string
      lastName: string
      employeeId: string | null
      department: string | null
      status?: string
    }
  }>
  departmentStats: Array<{
    department: string
    _count: { id: number }
    attendanceRate: number
    avgSalary: number
  }>
  attendanceTrends: Array<{
    date: string
    count: number
    rate: number
  }>
  payrollTrends: Array<{
    month: string
    total: number
    growth: number
  }>
  quickStats: {
    onTimeRate: number
    lateEmployees: number
    absentToday: number
    upcomingHolidays: number
    pendingReports: number
  }
  recentActivity: {
    attendance: Array<{
      id: string
      date: Date
      timeIn: Date | null
      timeOut: Date | null
      isLate: boolean
      isAbsent: boolean
      user: {
        firstName: string
        lastName: string
        employeeId: string | null
        department: string | null
      }
    }>
    payroll: Array<{
      id: string
      grossPay: number
      netPay: number
      isPaid: boolean
      createdAt: Date
      totalCost?: number
      salary?: number
      benefits?: number
      expenses?: number
      deductions?: number
      other?: number
      user: {
        firstName: string
        lastName: string
        employeeId: string | null
        department: string | null
        avatar?: string
      }
    }>
  }
  
  payrollDetails: {
    company: string
    period: {
      start: string
      end: string
    }
    status: string
    total: number
    breakdown: {
      salary: number
      benefits: number
      incentives: number
      employerContributions: number
    }
    schedule?: {
      id: string
      name: string
      days: number[]
      isActive: boolean
      cutoffDays?: number[]
      payrollReleaseDay?: number
      processingDays?: number[]
      cutoffType?: string
      paymentMethod?: string
      description?: string
    } | null
    deadlineStatus?: {
      isMissed: boolean
      daysOverdue?: number
      expectedGenerationDate?: string
      nextGenerationDate?: string
      scheduleName?: string
      message?: string
    }
    upcomingDeadlines?: Array<{
      date: string
      type: 'generation' | 'cutoff' | 'payment'
      scheduleName: string
      daysUntil: number
      isUrgent: boolean
    }>
    fileStatus?: {
      hasGeneratedFiles: boolean
      fileCount: number
      totalEmployees: number
      encryptedFiles: number
      lastGenerated?: string
    }
  }
}
