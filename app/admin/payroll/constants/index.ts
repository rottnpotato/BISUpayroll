import { PayrollRule, PayrollSchedule, HolidayType, TaxBracket, Report } from '../types'

export const payrollRules: PayrollRule[] = [
  { 
    id: "1", 
    name: "Basic Salary", 
    type: "base", 
    amount: 25000, 
    isPercentage: false,
    isActive: true,
    description: "Base monthly salary for regular government employees",
    applyToAll: true,
    category: "base_pay"
  },
  { 
    id: "2", 
    name: "Overtime Rate", 
    type: "additional",
    amount: 1.25, 
    isPercentage: true,
    isActive: true,
    description: "Government overtime pay - 125% of regular rate for first 2 hours",
    applyToAll: true,
    category: "overtime"
  },
  { 
    id: "3", 
    name: "Overtime Rate (Beyond 2 Hours)", 
    type: "additional",
    amount: 1.5, 
    isPercentage: true,
    isActive: true,
    description: "Government overtime pay - 150% of regular rate beyond 2 hours",
    applyToAll: true,
    category: "overtime"
  },
  
  { 
    id: "5", 
    name: "Holiday Differential (Regular)", 
    type: "additional",
    amount: 100, 
    isPercentage: true,
    isActive: true,
    description: "100% additional pay for work on regular holidays",
    applyToAll: true,
    category: "holiday_pay"
  },
  { 
    id: "6", 
    name: "Holiday Differential (Special)", 
    type: "additional",
    amount: 30, 
    isPercentage: true,
    isActive: true,
    description: "30% additional pay for work on special non-working holidays",
    applyToAll: true,
    category: "holiday_pay"
  },
  { 
    id: "7", 
    name: "GSIS Contribution", 
    type: "deduction",
    amount: 9, 
    isPercentage: true,
    isActive: true,
    description: "Government Service Insurance System - 9% employee share",
    applyToAll: true,
    category: "mandatory_contribution",
    computationBasis: "basic_salary"
  },
  { 
    id: "8", 
    name: "PhilHealth", 
    type: "deduction",
    amount: 2.75, 
    isPercentage: true,
    isActive: true,
    description: "PhilHealth premium - 2.75% employee share (5.5% total)",
    applyToAll: true,
    category: "mandatory_contribution",
    minAmount: 200,
    maxAmount: 1750
  },
  { 
    id: "9", 
    name: "Pag-IBIG", 
    type: "deduction",
    amount: 2, 
    isPercentage: true,
    isActive: true,
    description: "Pag-IBIG Fund contribution - 2% employee share",
    applyToAll: true,
    category: "mandatory_contribution",
    minAmount: 24,
    maxAmount: 200
  },
  { 
    id: "10", 
    name: "Withholding Tax", 
    type: "deduction",
    amount: 0, 
    isPercentage: true,
    isActive: true,
    description: "Income tax withheld based on BIR tax table (TRAIN Law)",
    applyToAll: true,
    category: "tax",
    computationBasis: "taxable_income"
  },
  { 
    id: "11", 
    name: "13th Month Pay", 
    type: "additional",
    amount: 8.33, 
    isPercentage: true,
    isActive: true,
    description: "Prorated 13th month pay allocation (1/12 of annual salary)",
    applyToAll: true,
    category: "mandatory_benefit"
  },
  { 
    id: "12", 
    name: "Service Incentive Leave", 
    type: "additional",
    amount: 5, 
    isPercentage: false,
    isActive: true,
    description: "5 days paid service incentive leave credit per year",
    applyToAll: true,
    category: "leave_benefit"
  },
  { 
    id: "13", 
    name: "Late Deduction (Per Minute)", 
    type: "deduction",
    amount: 0, 
    isPercentage: false,
    isActive: true,
    description: "Deduction for tardiness - computed per minute basis",
    applyToAll: true,
    category: "attendance",
    computationBasis: "per_minute"
  },
  { 
    id: "14", 
    name: "Sick Leave", 
    type: "additional",
    amount: 7, 
    isPercentage: false,
    isActive: true,
    description: "7 days paid sick leave credit per year",
    applyToAll: true,
    category: "leave_benefit"
  },
  { 
    id: "15", 
    name: "Vacation Leave", 
    type: "additional",
    amount: 15, 
    isPercentage: false,
    isActive: true,
    description: "15 days paid vacation leave credit per year",
    applyToAll: true,
    category: "leave_benefit"
  }
]

export const payrollSchedules: PayrollSchedule[] = [
  { 
    id: "1", 
    name: "Monthly (End of Month)", 
    days: [30], 
    isActive: true, 
    processHour: 9, 
    processMinute: 0,
    cutoffDays: [15],
    paymentMethod: "bank_transfer"
  },
  { 
    id: "2", 
    name: "Semi-Monthly (15th & 30th)", 
    days: [15, 30], 
    isActive: false, 
    processHour: 9, 
    processMinute: 0,
    cutoffDays: [7, 22],
    paymentMethod: "bank_transfer"
  },
  { 
    id: "3", 
    name: "Bi-Weekly", 
    days: [14, 28], 
    isActive: false, 
    processHour: 9, 
    processMinute: 0,
    cutoffDays: [7, 21],
    paymentMethod: "bank_transfer"
  }
]

export const philippineHolidays: HolidayType[] = [
  { id: "1", name: "New Year's Day", date: "2025-01-01", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "2", name: "Maundy Thursday", date: "2025-04-17", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: false },
  { id: "3", name: "Good Friday", date: "2025-04-18", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: false },
  { id: "4", name: "Araw ng Kagitingan", date: "2025-04-09", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "5", name: "Labor Day", date: "2025-05-01", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "6", name: "Independence Day", date: "2025-06-12", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "7", name: "National Heroes Day", date: "2025-08-25", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "8", name: "Bonifacio Day", date: "2025-11-30", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "9", name: "Christmas Day", date: "2025-12-25", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "10", name: "Rizal Day", date: "2025-12-30", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "11", name: "Black Saturday", date: "2025-04-19", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: false },
  { id: "12", name: "EDSA People Power Revolution", date: "2025-02-25", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "13", name: "Ninoy Aquino Day", date: "2025-08-21", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "14", name: "All Saints' Day", date: "2025-11-01", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "15", name: "Christmas Eve", date: "2025-12-24", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "16", name: "New Year's Eve", date: "2025-12-31", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true }
]

export const taxBrackets: TaxBracket[] = [
  { min: 0, max: 20833, rate: 0, description: "₱0 - ₱250,000 annually" },
  { min: 20834, max: 33333, rate: 20, description: "₱250,001 - ₱400,000 annually" },
  { min: 33334, max: 66667, rate: 25, description: "₱400,001 - ₱800,000 annually" },
  { min: 66668, max: 166667, rate: 30, description: "₱800,001 - ₱2,000,000 annually" },
  { min: 166668, max: 666667, rate: 32, description: "₱2,000,001 - ₱8,000,000 annually" },
  { min: 666668, max: Infinity, rate: 35, description: "Above ₱8,000,000 annually" }
]

// Reports constants
export const recentReports: Report[] = [
  { 
    id: "RPT-2023-001", 
    name: "Monthly Payroll Summary - November 2023", 
    type: "payroll", 
    generatedBy: "Admin", 
    generatedOn: "2023-12-05 09:15:22",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-002", 
    name: "Attendance Summary - November 2023", 
    type: "attendance", 
    generatedBy: "HR Manager", 
    generatedOn: "2023-12-04 14:30:45",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-003", 
    name: "Employee Tax Withholdings - Q4 2023", 
    type: "tax", 
    generatedBy: "Admin", 
    generatedOn: "2023-12-02 11:05:30",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-004", 
    name: "Department Expense Report - November 2023", 
    type: "expense", 
    generatedBy: "Finance Director", 
    generatedOn: "2023-12-01 10:22:15",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-005", 
    name: "Annual Leave Balance Report", 
    type: "leave", 
    generatedBy: "System", 
    generatedOn: "2023-11-30 08:45:10",
    status: "ready",
    downloadUrl: "#"
  }
]

export const reportTemplateData = [
  {
    id: "template-001",
    name: "Monthly Payroll Report",
    description: "Generate comprehensive payroll for all employees with attendance-based calculations",
    iconName: "FileText",
    iconColor: "blue-500",
    category: "payroll",
    type: "monthly"
  }
]
