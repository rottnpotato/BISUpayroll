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
  id: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
    department: string
    position: string
    salary: number | string | null
  }
  payPeriodStart: string
  payPeriodEnd: string
  baseSalary: number | string | null
  overtime: number | string | null
  deductions: number | string | null
  bonuses: number | string | null
  grossPay: number | string | null
  netPay: number | string | null
  attendanceData: {
    daysPresent: number | null
    hoursWorked: number | string | null
    lateHours: number | string | null
  }
  deductionBreakdown: {
    withholdingTax: number | string | null
    citySavingsLoan: number | string | null
    pagibigContribution: number | string | null
  }
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
