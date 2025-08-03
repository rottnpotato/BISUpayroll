export interface PayrollRule {
  id: string
  name: string
  type: string
  amount: number
  isPercentage: boolean
  isActive: boolean
  description: string | null
  applyToAll: boolean
  assignedUsers?: PayrollRuleAssignment[]
  category?: string
  computationBasis?: string
  minAmount?: number
  maxAmount?: number
}

export interface PayrollRuleAssignment {
  id: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
  }
}

export interface User {
  id: string
  firstName: string
  lastName: string
  employeeId: string | null
  department: string | null
  role: string
  status: string
}

export interface PayrollSchedule {
  id: string
  name: string
  days: number[]
  isActive: boolean
  cutoffDays?: number[]
  paymentMethod?: string
  payrollReleaseDay?: number
  processHour?: number
  processMinute?: number
  // New field for multiple processing dates (for bi-monthly schedules)
  processingDays?: number[]
  cutoffType?: 'bi-monthly' | 'monthly' | 'weekly'
  description?: string
}

export interface HolidayType {
  id: string
  name: string
  date: string
  type: 'regular' | 'special'
  payMultiplier: number
  isActive: boolean
  isRecurring: boolean
  description?: string
}

export interface LateDeductionRule {
  id: string
  name: string
  basis: 'per_minute' | 'per_hour' | 'fixed_amount'
  amount: number
  graceMinutes: number
  isActive: boolean
  description?: string
}

export interface WorkingHoursConfig {
  id?: string
  dailyHours: number
  weeklyHours: number
  overtimeThreshold: number
  nightShiftStart: number
  nightShiftEnd: number
  nightShiftEnabled: boolean
  lateGraceMinutes: number
  lateDeductionBasis: 'per_minute' | 'per_hour' | 'fixed_amount'
  lateDeductionAmount: number
  isActive?: boolean
}

export interface RatesConfig {
  id?: string
  overtimeRate1: number
  overtimeRate2: number
  nightDifferential: number
  regularHolidayRate: number
  specialHolidayRate: number
  currency: 'PHP'
  isActive?: boolean
}

export interface LeaveBenefitsConfig {
  id?: string
  vacationLeave: number
  sickLeave: number
  serviceIncentiveLeave: number
  maternityLeave?: number
  paternityLeave?: number
  isActive?: boolean
}

export interface TaxBracket {
  min: number
  max: number
  rate: number
  description: string
}

export interface PayrollFormData {
  name: string
  type: string
  amount: string
  isPercentage: boolean
  description: string
  applyToAll: boolean
  selectedUserIds: string[]
  category: string
  computationBasis: string
  minAmount: string
  maxAmount: string
}

export interface ScheduleFormData {
  name: string
  days: number[]
  cutoffDays: number[]
  payrollReleaseDay: number
  // New field for multiple processing dates (for bi-monthly schedules)
  processingDays: number[]
  cutoffType: 'bi-monthly' | 'monthly' | 'weekly'
  isActive: boolean
  paymentMethod: string
  description: string
}

export interface HolidayFormData {
  name: string
  date: string
  type: 'regular' | 'special'
  payMultiplier: number
  isRecurring: boolean
  description: string
}

// Reports types
export interface Report {
  id: string
  name: string
  type: string
  generatedBy: string
  generatedOn: string
  status: string
  downloadUrl: string
}

export interface PayrollData {
  id?: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
    position: string | null
  }
  
  // Legacy fields for backward compatibility
  baseSalary?: number
  overtime?: number
  deductions?: number
  bonuses?: number
  grossPay: number
  netPay: number
  
  // Detailed earnings breakdown
  earningsBreakdown?: {
    regularPay: number
    overtimePay: number
    holidayPay: number
    nightDifferential: number
    allowances: number
    bonuses: number
    thirteenthMonthPay: number
    serviceIncentiveLeave: number
    otherEarnings: number
  }
  
  // Detailed deduction breakdown  
  deductionBreakdown?: {
    withholdingTax: string | number | null
    gsisContribution?: string | number | null
    philHealthContribution?: string | number | null
    pagibigContribution: string | number | null
    lateDeductions?: string | number | null
    loanDeductions?: string | number | null
    otherDeductions?: string | number | null
    citySavingsLoan?: string | number | null
    sssContribution?: string | number | null
  }
  
  // Tax breakdown for tax reports
  taxBreakdown?: {
    withholdingTax: number
    pagibigContribution: number
    sssContribution: number
    philHealthContribution: number
    totalContributions: number
  }
  
  // Attendance data
  attendanceData?: {
    daysPresent: number
    hoursWorked: number
    lateHours: number
  }
  
  // Applied rules breakdown
  appliedRulesBreakdown?: Array<{
    ruleId: string
    ruleName: string
    ruleType: string
    category: string
    amount: number
    isPercentage: boolean
    rate?: number
  }>
  
  // PayrollResult specific fields
  payPeriodStart?: string | Date
  payPeriodEnd?: string | Date
  status?: string
  isApproved?: boolean
  
  // Additional calculation fields
  dailyRate?: number
  hourlyRate?: number
  totalEarnings?: number
  totalDeductions?: number
  taxableIncome?: number
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  type: string
}

export interface PayrollGenerationState {
  isLoading: boolean
  reports: Report[]
  searchTerm: string
  selectedReportType: string
  selectedTab: string
  isGenerating: boolean
  showPreview: boolean
  payrollData: PayrollData[]
  selectedTemplate: ReportTemplate | null
  selectedDepartment: string
}

export interface FilterState {
  searchTerm: string
  selectedReportType: string
  dateRange: { from?: Date; to?: Date } | undefined
}

export interface ReportError {
  error: string
  details?: string
  timestamp?: string
}

export interface ReportSummary {
  totalEmployees: number
  totalGrossPay: number
  totalNetPay: number
  totalDeductions: number
  department?: string
  periodStart?: Date
  periodEnd?: Date
  totalWithholdingTax?: number
  totalPagibigContribution?: number
  totalSSSContribution?: number
  totalPhilHealthContribution?: number
  totalAllContributions?: number
  departmentBreakdown?: Array<{
    department: string
    employeeCount: number
    totalGrossPay: number
    totalNetPay: number
  }>
}

export interface PayrollFile {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  reportType: string
  payPeriodStart: string | Date
  payPeriodEnd: string | Date
  generatedBy: string
  generatedAt: string | Date
  department?: string
  employeeCount: number
  totalGrossPay: number
  totalNetPay: number
  totalDeductions: number
  status: 'GENERATED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
  isArchived: boolean
  downloadCount: number
  lastDownloadAt?: string | Date
  scheduleId?: string
  scheduleName?: string
  generatedByUser?: {
    firstName: string
    lastName: string
    employeeId: string
  }
}

export interface PayrollGroup {
  id: string
  scheduleId: string
  scheduleName: string
  payPeriodStart: string | Date
  payPeriodEnd: string | Date
  employeeCount: number
  totalGrossPay: number
  totalNetPay: number
  totalDeductions: number
  status: 'GENERATED' | 'PROCESSING' | 'COMPLETED' | 'APPROVED'
  generatedAt: string | Date
  generatedBy?: string
  generatedByUser?: {
    firstName: string
    lastName: string
  }
  departments: string[]
  fileCount: number
}

export interface PayrollOverviewSummary {
  totalEmployees: number
  activeRules: number
  activeSchedules: number
  monthlyPayrollTotal: number
  generatedGroups: number
  pendingApproval: number
  completedPayrolls: number
  upcomingPayDate: string | null
  totalPayrollFiles: number
}
