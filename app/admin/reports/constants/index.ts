import { Report } from '../types'

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
  },
  {
    id: "template-002",
    name: "Department Payroll Report",
    description: "Generate payroll report filtered by specific department",
    iconName: "Users",
    iconColor: "green-500",
    category: "payroll",
    type: "department"
  },
  {
    id: "template-003",
    name: "Custom Period Payroll",
    description: "Generate payroll for custom date range with detailed calculations",
    iconName: "CalendarRange",
    iconColor: "purple-500",
    category: "payroll",
    type: "custom"
  },
  {
    id: "template-004",
    name: "Tax Withholding Summary",
    description: "Detailed breakdown of tax withholdings and contributions",
    iconName: "BarChart",
    iconColor: "orange-500",
    category: "tax",
    type: "tax"
  }
]
