import { PayrollData, ReportTemplate } from '../types'
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

const ENTRIES_PER_PAGE = 15

const getReportTitle = (selectedTemplate: ReportTemplate | null, payrollData: PayrollData[], employmentStatus?: string) => {
  switch (selectedTemplate?.type) {
    case 'department':
      return `DEPARTMENT PAYROLL REPORT - ${payrollData[0]?.user?.department || 'UNKNOWN'} DEPARTMENT`
    case 'tax':
      return 'TAX WITHHOLDING & CONTRIBUTIONS SUMMARY REPORT'
    case 'custom':
      return 'CUSTOM PERIOD PAYROLL REPORT'
    default:
      const statusLabel = employmentStatus && employmentStatus !== 'all'
        ? employmentStatus.toUpperCase()
        : 'ALL STATUS'
      return `PAYROLL - ${statusLabel} EMPLOYEES - OF BISU BALILIHAN CAMPUS`
  }
}

const formatValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return '-'
  return `₱${value.toFixed(2)}`
}

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return '-'
  return value.toFixed(2)
}

interface EmployeeRowData {
  index: number
  employee: PayrollData
  regularPay: number
  overtimePay: number
  holidayPay: number
  allowances: number
  bonuses: number
  thirteenthMonthPay: number
  serviceIncentiveLeave: number
  grossPay: number
  netPay: number
  dailyRate: number
  hourlyRate: number
  daysWorked: number
  hoursWorked: number
  totalEarnings: number
  absences: number
  undertimeHours: number
  lateHours: number
  absenceSalaryDeduction: number
  absencePeraDeduction: number
  withholdingTax: number
  gsisContribution: number
  philHealthContribution: number
  pagibigContribution: number
  lateDeductions: number
  undertimeDeductions: number
  loanDeductions: number
  otherDeductions: number
  totalDeductions: number
  citySavingsLoan: number
  gsisConsoLoan: number
  gsisOptionalPolicyLoan: number
  gsisGfal: number
  coaDisallowance: number
  gsisEmergencyLoan: number
  gsisMpl: number
  gsisMplLite: number
  gsisCpl: number
  sssKaltas: number
  faDeduction: number
  hdmfMp2: number
  hdmfPmlLoan: number
}

const extractEmployeeData = (employee: PayrollData, index: number): EmployeeRowData => {
  const regularPay = parseFloat(employee.earningsBreakdown?.regularPay?.toString() || employee.dailyRate?.toString() || '0')
  const overtimePay = parseFloat(employee.earningsBreakdown?.overtimePay?.toString() || employee.overtime?.toString() || '0')
  const holidayPay = parseFloat(employee.earningsBreakdown?.holidayPay?.toString() || '0')
  const allowances = parseFloat(employee.earningsBreakdown?.allowances?.toString() || '0')
  const bonuses = parseFloat(employee.earningsBreakdown?.bonuses?.toString() || employee.bonuses?.toString() || '0')
  const thirteenthMonthPay = parseFloat(employee.earningsBreakdown?.thirteenthMonthPay?.toString() || '0')
  const serviceIncentiveLeave = parseFloat(employee.earningsBreakdown?.serviceIncentiveLeave?.toString() || '0')
  const grossPay = parseFloat(employee.grossPay?.toString() || '0')
  const netPay = parseFloat(employee.netPay?.toString() || '0')

  const dailyRate = employee.dailyRate ? parseFloat(employee.dailyRate.toString()) : 0
  const hourlyRate = employee.hourlyRate ? parseFloat(employee.hourlyRate.toString()) : 0
  const daysWorked = parseFloat(employee.attendanceData?.daysPresent?.toString() || '0')
  const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')
  const lateHours = parseFloat(employee.attendanceData?.lateHours?.toString() || '0')

  const totalEarnings = regularPay + overtimePay + holidayPay + allowances + bonuses + thirteenthMonthPay + serviceIncentiveLeave

  const gsisContribution = parseFloat(employee.deductionBreakdown?.gsisContribution?.toString() || '0')
  const philHealthContribution = parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
  const pagibigContribution = parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
  const withholdingTax = parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
  const lateDeductions = parseFloat(employee.deductionBreakdown?.lateDeductions?.toString() || '0')
  const loanDeductions = parseFloat(employee.deductionBreakdown?.loanDeductions?.toString() || '0')

  // Calculate custom deductions: use the pre-calculated otherDeductions from deductionBreakdown
  // (This value is computed in usePayrollGeneration.ts as sum of deduction rules not matching specific columns)
  const otherDeductions = parseFloat(employee.deductionBreakdown?.otherDeductions?.toString() || '0')
  const undertimeDeductions = parseFloat((employee as any).deductionBreakdown?.undertimeDeductions?.toString() || '0')
  const citySavingsLoan = parseFloat(employee.deductionBreakdown?.citySavingsLoan?.toString() || '0')

  // Extract specific deduction types from deductionBreakdown (populated from appliedRules)
  const gsisConsoLoan = parseFloat(employee.deductionBreakdown?.gsisConsoLoan?.toString() || '0')
  const gsisOptionalPolicyLoan = parseFloat(employee.deductionBreakdown?.gsisOptionalPolicyLoan?.toString() || '0')
  const gsisGfal = parseFloat(employee.deductionBreakdown?.gsisGfal?.toString() || '0')
  const coaDisallowance = parseFloat(employee.deductionBreakdown?.coaDisallowance?.toString() || '0')
  const gsisEmergencyLoan = parseFloat(employee.deductionBreakdown?.gsisEmergencyLoan?.toString() || '0')
  const gsisMpl = parseFloat(employee.deductionBreakdown?.gsisMpl?.toString() || '0')
  const gsisMplLite = parseFloat(employee.deductionBreakdown?.gsisMplLite?.toString() || '0')
  const gsisCpl = parseFloat(employee.deductionBreakdown?.gsisCpl?.toString() || '0')
  const sssKaltas = parseFloat(employee.deductionBreakdown?.sssKaltas?.toString() || '0')
  const faDeduction = parseFloat(employee.deductionBreakdown?.faDeduction?.toString() || '0')
  const hdmfMp2 = parseFloat(employee.deductionBreakdown?.hdmfMp2?.toString() || '0')
  const hdmfPmlLoan = parseFloat(employee.deductionBreakdown?.hdmfPmlLoan?.toString() || '0')

  const totalDeductions = gsisContribution + philHealthContribution + pagibigContribution +
    withholdingTax + lateDeductions + loanDeductions + otherDeductions + undertimeDeductions

  // Calculate absences (working days - days worked, excluding weekends)
  const absences = 22 - daysWorked > 0 ? 22 - daysWorked : 0
  const undertimeHours = parseFloat((employee as any).attendanceData?.undertimeHours?.toString() || '0')

  // Calculate salary and PERA deductions from absences
  const absenceSalaryDeduction = absences * dailyRate
  const peraAllowanceDaily = allowances / 22
  const absencePeraDeduction = absences * peraAllowanceDaily

  return {
    index,
    employee,
    regularPay,
    overtimePay,
    holidayPay,
    allowances,
    bonuses,
    thirteenthMonthPay,
    serviceIncentiveLeave,
    grossPay,
    netPay,
    dailyRate,
    hourlyRate,
    daysWorked,
    hoursWorked,
    totalEarnings,
    absences,
    undertimeHours: undertimeHours + lateHours,
    lateHours,
    absenceSalaryDeduction,
    absencePeraDeduction,
    withholdingTax,
    gsisContribution,
    philHealthContribution,
    pagibigContribution,
    lateDeductions,
    undertimeDeductions,
    loanDeductions,
    otherDeductions,
    totalDeductions,
    citySavingsLoan,
    gsisConsoLoan,
    gsisOptionalPolicyLoan,
    gsisGfal,
    coaDisallowance,
    gsisEmergencyLoan,
    gsisMpl,
    gsisMplLite,
    gsisCpl,
    sssKaltas,
    faDeduction,
    hdmfMp2,
    hdmfPmlLoan
  }
}

const buildCompensationRow = (data: EmployeeRowData, startIndex: number): string => {
  return `
    <tr style="border-bottom: 1px solid #ccc;">
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${startIndex + data.index + 1}</td>
      <td style="border-right: 1px solid #000; padding: 4px; white-space: nowrap;">${data.employee.user.lastName}, ${data.employee.user.firstName}</td>
      <td style="border-right: 1px solid #000; padding: 4px;">${data.employee.user.position || 'N/A'}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${data.employee.user.employeeId || 'N/A'}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.hourlyRate)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.dailyRate)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${formatNumber(data.daysWorked)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${formatNumber(data.hoursWorked)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.regularPay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.overtimePay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.holidayPay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.allowances)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.bonuses)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.thirteenthMonthPay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.serviceIncentiveLeave)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">${formatValue(data.totalEarnings)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">${formatValue(data.grossPay)}</td>
      <td style="padding: 4px; text-align: right; font-weight: bold;">${formatValue(data.netPay)}</td>
      <td style="padding: 4px;"></td>
    </tr>
  `
}

const buildDeductionRow = (data: EmployeeRowData, startIndex: number): string => {
  return `
    <tr style="border-bottom: 1px solid #ccc;">
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${startIndex + data.index + 1}</td>
      <td style="border-right: 1px solid #000; padding: 4px; white-space: nowrap;">${data.employee.user.lastName}, ${data.employee.user.firstName}</td>
      <td style="border-right: 1px solid #000; padding: 4px;">${data.employee.user.position || 'N/A'}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${data.employee.user.employeeId || 'N/A'}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${data.absences > 0 ? data.absences.toFixed(1) : '-'}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${data.undertimeHours > 0 ? data.undertimeHours.toFixed(2) : '-'}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.absenceSalaryDeduction)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.absencePeraDeduction)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.withholdingTax)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisContribution)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.pagibigContribution)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.philHealthContribution)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.citySavingsLoan)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisConsoLoan)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisOptionalPolicyLoan)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisGfal)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.coaDisallowance)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisEmergencyLoan)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisMpl)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisMplLite)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.gsisCpl)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.sssKaltas)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.faDeduction)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.hdmfMp2)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(data.hdmfPmlLoan)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${data.otherDeductions > 0 ? formatValue(data.otherDeductions) : '-'}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">${formatValue(data.totalDeductions)}</td>
      <td style="padding: 4px;"></td>
    </tr>
  `
}

interface PageTotals {
  totalEarnings: number
  grossPay: number
  regularPay: number
  overtimePay: number
  holidayPay: number
  allowances: number
  bonuses: number
  thirteenthMonthPay: number
  serviceIncentiveLeave: number
  totalDeductions: number
  netPay: number
  absenceSalaryDeduction: number
  absencePeraDeduction: number
  withholdingTax: number
  gsisContribution: number
  philHealthContribution: number
  pagibigContribution: number
}

const calculatePageTotals = (pageData: EmployeeRowData[]): PageTotals => {
  return pageData.reduce((acc, data) => ({
    totalEarnings: acc.totalEarnings + data.totalEarnings,
    grossPay: acc.grossPay + data.grossPay,
    regularPay: acc.regularPay + data.regularPay,
    overtimePay: acc.overtimePay + data.overtimePay,
    holidayPay: acc.holidayPay + data.holidayPay,
    allowances: acc.allowances + data.allowances,
    bonuses: acc.bonuses + data.bonuses,
    thirteenthMonthPay: acc.thirteenthMonthPay + data.thirteenthMonthPay,
    serviceIncentiveLeave: acc.serviceIncentiveLeave + data.serviceIncentiveLeave,
    totalDeductions: acc.totalDeductions + data.totalDeductions,
    netPay: acc.netPay + data.netPay,
    absenceSalaryDeduction: acc.absenceSalaryDeduction + data.absenceSalaryDeduction,
    absencePeraDeduction: acc.absencePeraDeduction + data.absencePeraDeduction,
    withholdingTax: acc.withholdingTax + data.withholdingTax,
    gsisContribution: acc.gsisContribution + data.gsisContribution,
    philHealthContribution: acc.philHealthContribution + data.philHealthContribution,
    pagibigContribution: acc.pagibigContribution + data.pagibigContribution
  }), {
    totalEarnings: 0, grossPay: 0, regularPay: 0, overtimePay: 0, holidayPay: 0,
    allowances: 0, bonuses: 0, thirteenthMonthPay: 0, serviceIncentiveLeave: 0,
    totalDeductions: 0, netPay: 0, absenceSalaryDeduction: 0, absencePeraDeduction: 0,
    withholdingTax: 0, gsisContribution: 0, philHealthContribution: 0, pagibigContribution: 0
  })
}

const buildCompensationSubtotalRow = (totals: PageTotals, label: string): string => {
  return `
    <tr style="border-top: 2px solid #000; background-color: #f0f0f0; font-weight: bold;">
      <td colspan="4" style="border-right: 1px solid #000; padding: 6px; text-align: right;">${label}</td>
      <td style="border-right: 1px solid #000; padding: 4px;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"></td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.regularPay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.overtimePay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.holidayPay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.allowances)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.bonuses)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.thirteenthMonthPay)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.serviceIncentiveLeave)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.totalEarnings)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.grossPay)}</td>
      <td style="padding: 4px; text-align: right; background-color:rgb(255, 255, 255); color:rgb(255, 255, 255);">${formatValue(totals.netPay)}</td>
      <td style="padding: 4px;"></td>
    </tr>
  `
}

const buildDeductionSubtotalRow = (totals: PageTotals, label: string): string => {
  return `
    <tr style="border-top: 2px solid #000; background-color: #f0f0f0; font-weight: bold;">
      <td colspan="4" style="border-right: 1px solid #000; padding: 6px; text-align: right;">${label}</td>
      <td style="border-right: 1px solid #000; padding: 4px;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"></td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.absenceSalaryDeduction)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.absencePeraDeduction)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.withholdingTax)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.gsisContribution)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.pagibigContribution)}</td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.philHealthContribution)}</td>
      <td colspan="14" style="border-right: 1px solid #000; padding: 4px;"></td>
      <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">${formatValue(totals.totalDeductions)}</td>
      <td style="padding: 4px;"></td>
    </tr>
  `
}

const getCompensationTableHead = (): string => `
  <thead>
    <tr style="background-color: #e5e5e5;">
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Serial No.</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Name</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Position</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Employee No.</th>
      <th colspan="14" style="border: 1px solid #000; padding: 4px; text-align: center; background-color:rgb(255, 255, 255);">COMPENSATIONS</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Signature</th>
    </tr>
    <tr style="background-color: #d4edda;">
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Rate/Hour</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Rate/Day</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Days</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Hours</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Regular Pay</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">OT Pay</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Holiday Pay</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Allowances</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Bonuses</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">13th Month</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">SIL</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Total Earnings</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Gross Pay</th>
      <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; background-color:rgb(255, 255, 255); font-weight: bold;">Net Pay</th>
    </tr>
  </thead>
`

const getDeductionTableHead = (): string => `
  <thead>
    <tr style="background-color: #e5e5e5;">
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Serial No.</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Name</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Position</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Employee No.</th>
      <th colspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">Absences/Undertime</th>
      <th colspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">Absences (Days)</th>
      <th colspan="20" style="border: 1px solid #000; padding: 4px; text-align: center; background-color:rgb(255, 255, 255); font-size: 8px;">DEDUCTIONS</th>
      <th rowspan="2" style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center;">Signature</th>
    </tr>
    <tr style="background-color: #f8d7da;">
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">Absences (Days)</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">Undertime (Hours)</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">Sal</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">PERA</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">W/Tax<br/>412w</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">GSIS<br/>413-1</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">Pag-ibig<br/>414-1</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">PHIL<br/>415</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">City Sav<br/>439-5</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">GSIS Conso<br/>413-4</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">GSIS Opt<br/>413-3</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">GSIS GFAL<br/>413-7</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">COA<br/>439-6</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">GSIS Emrg<br/>413-8</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">GSIS MPL<br/>413-6</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">MPL_LITE<br/>413-9</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">GSIS CPL<br/>413-2</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">SSS Kaltas<br/>439-8</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">FA Deductions<br/>439-9</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">HDMF MP2<br/>414-3</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">HDMF PML<br/>414-2</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">Other Ded<br/>(Custom)</th>
      <th style="border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center;">Total Deductions</th>
    </tr>
  </thead>
`

const generatePageHeader = (title: string, dateRange: DateRange, pageType: 'COMPENSATION' | 'DEDUCTION', currentPage: number, totalPages: number): string => `
  <div class="header" style="margin-bottom: 10px; text-align: center;">
    <h1 style="font-size: 16px; margin: 0 0 5px 0;">${title}</h1>
    <h2 style="font-size: 12px; margin: 0 0 10px 0; font-weight: normal;">
      For the Period: ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}
    </h2>
  </div>
  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10px;">
    <div>
      <p style="margin: 2px 0;"><strong>Entity Name:</strong> BISU Balilihan Campus</p>
      <p style="margin: 2px 0;"><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 2px 0;"><strong>Sheet:</strong> ${currentPage} of ${totalPages}</p>
      <p style="margin: 2px 0;"><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
    </div>
  </div>
`

const generateCertSection = (): string => `
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 20px; font-size: 9px;">
    <div style="border: 1px solid #000; padding: 8px; position: relative; min-height: 50px;">
      <div style="position: absolute; top: 2px; right: 3px; width: 12px; height: 12px; border: 1px solid #000; text-align: center; font-size: 8px; font-weight: bold;">A</div>
      <p style="margin: 2px 0;"><strong>Prepared by:</strong></p>
      <p style="margin: 2px 0;"><strong>Maricel R. Tambis</strong></p>
      <p style="margin: 2px 0;">(Administrative Aide 3)</p>
    </div>
    <div style="border: 1px solid #000; padding: 8px; position: relative; min-height: 50px;">
      <div style="position: absolute; top: 2px; right: 3px; width: 12px; height: 12px; border: 1px solid #000; text-align: center; font-size: 8px; font-weight: bold;">B</div>
      <p style="margin: 2px 0;"><strong>Reviewed by:</strong></p>
      <p style="margin: 2px 0;"><strong>Anneli C. Uy</strong></p>
      <p style="margin: 2px 0;">(Administrative Assistant 2 - Disbursing Officer 2)</p>
    </div>
    <div style="border: 1px solid #000; padding: 8px; position: relative; min-height: 50px;">
      <div style="position: absolute; top: 2px; right: 3px; width: 12px; height: 12px; border: 1px solid #000; text-align: center; font-size: 8px; font-weight: bold;">C</div>
      <p style="margin: 2px 0;"><strong>Approved by:</strong></p>
      <p style="margin: 2px 0;"><strong>Jean F. Nebrea</strong></p>
      <p style="margin: 2px 0;">(Associate Professor 5)</p>
    </div>
  </div>
`

// Original buildStandardRows for non-split ledger
const buildStandardRows = (sortedData: PayrollData[]) => {
  return sortedData.map((employee, index) => {
    const data = extractEmployeeData(employee, index)
    return `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.hourlyRate.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.dailyRate.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${data.daysWorked.toFixed(1)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${data.hoursWorked.toFixed(1)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.totalEarnings.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.lateDeductions.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.grossPay.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.withholdingTax.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.gsisContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.philHealthContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.pagibigContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.totalDeductions.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${data.netPay.toFixed(2)}</td>
        <td style="padding: 4px;"></td>
      </tr>
    `
  }).join('')
}

const buildTaxRows = (sortedData: PayrollData[]) => {
  return sortedData.map((employee, index) => {
    const grossPay = parseFloat(employee.grossPay?.toString() || '0')
    const netPay = parseFloat(employee.netPay?.toString() || '0')
    const withholdingTax = employee.taxBreakdown?.withholdingTax || parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
    const pagibigContribution = employee.taxBreakdown?.pagibigContribution || parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
    const sssContribution = employee.taxBreakdown?.sssContribution || parseFloat(employee.deductionBreakdown?.sssContribution?.toString() || '0')
    const philHealthContribution = employee.taxBreakdown?.philHealthContribution || parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
    const totalContributions = employee.taxBreakdown?.totalContributions || (withholdingTax + pagibigContribution + sssContribution + philHealthContribution)

    return `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.department || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${grossPay.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${withholdingTax.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${pagibigContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${sssContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${philHealthContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${totalContributions.toFixed(2)}</td>
        <td style="padding: 4px; text-align: right;">₱${netPay.toFixed(2)}</td>
      </tr>
    `
  }).join('')
}

const buildDepartmentRows = (sortedData: PayrollData[]) => {
  return sortedData.map((employee, index) => {
    const salary = parseFloat(employee.dailyRate?.toString() || '0')
    const grossPay = parseFloat(employee.grossPay?.toString() || '0')
    const deductions = parseFloat(employee.deductions?.toString() || '0')
    const netPay = parseFloat(employee.netPay?.toString() || '0')
    const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')

    return `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${salary.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.attendanceData?.daysPresent || 0}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${hoursWorked.toFixed(1)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${grossPay.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${deductions.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${netPay.toFixed(2)}</td>
        <td style="padding: 4px;"></td>
      </tr>
    `
  }).join('')
}

export const generateSplitLedgerHTML = (data: PayrollData[], dateRange: DateRange, employmentStatus?: string): string => {
  const sortedData = [...data].sort((a, b) =>
    `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`)
  )

  const employeeData = sortedData.map((emp, idx) => extractEmployeeData(emp, idx))

  const compensationPages: EmployeeRowData[][] = []
  const deductionPages: EmployeeRowData[][] = []

  for (let i = 0; i < employeeData.length; i += ENTRIES_PER_PAGE) {
    compensationPages.push(employeeData.slice(i, i + ENTRIES_PER_PAGE))
    deductionPages.push(employeeData.slice(i, i + ENTRIES_PER_PAGE))
  }

  const totalCompPages = compensationPages.length
  const totalDedPages = deductionPages.length
  const totalPages = totalCompPages + totalDedPages

  const statusLabel = employmentStatus && employmentStatus !== 'all'
    ? employmentStatus.toUpperCase()
    : 'ALL'
  const title = `PAYROLL LEDGER - ${statusLabel} EMPLOYEES - BISU BALILIHAN CAMPUS`

  const grandTotals = calculatePageTotals(employeeData)

  let pagesHtml = ''

  // Compensation pages
  compensationPages.forEach((pageData, pageIdx) => {
    const pageTotals = calculatePageTotals(pageData)
    const isLastCompPage = pageIdx === totalCompPages - 1
    const currentPageNum = pageIdx + 1
    const startIndex = pageIdx * ENTRIES_PER_PAGE

    pagesHtml += `
      <div class="page">
        ${generatePageHeader(title, dateRange, 'COMPENSATION', currentPageNum, totalPages)}
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9px;">
          ${getCompensationTableHead()}
          <tbody>
            ${pageData.map((d, i) => buildCompensationRow({ ...d, index: i }, startIndex)).join('')}
            ${buildCompensationSubtotalRow(pageTotals, 'Sub-total')}
            ${isLastCompPage ? buildCompensationSubtotalRow(grandTotals, 'TOTAL') : ''}
          </tbody>
        </table>
        ${isLastCompPage ? generateCertSection() : ''}
      </div>
    `
  })

  // Deduction pages
  deductionPages.forEach((pageData, pageIdx) => {
    const pageTotals = calculatePageTotals(pageData)
    const isLastDedPage = pageIdx === totalDedPages - 1
    const currentPageNum = totalCompPages + pageIdx + 1
    const startIndex = pageIdx * ENTRIES_PER_PAGE

    pagesHtml += `
      <div class="page">
        ${generatePageHeader(title, dateRange, 'DEDUCTION', currentPageNum, totalPages)}
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 8px;">
          ${getDeductionTableHead()}
          <tbody>
            ${pageData.map((d, i) => buildDeductionRow({ ...d, index: i }, startIndex)).join('')}
            ${buildDeductionSubtotalRow(pageTotals, 'Sub-total')}
            ${isLastDedPage ? buildDeductionSubtotalRow(grandTotals, 'TOTAL') : ''}
          </tbody>
        </table>
        ${isLastDedPage ? generateCertSection() : ''}
      </div>
    `
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BISU Split Payroll Ledger</title>
      <style>
        @page { size: landscape; margin: 0.4in; }
        @media print {
          .page { page-break-after: always; }
          .page:last-child { page-break-after: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 0; color: black; }
        .page { padding: 10px; }
        table { border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 3px; }
        th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `
}

export const generatePrintHTML = (data: PayrollData[], dateRange: DateRange, selectedTemplate: ReportTemplate | null, employmentStatus?: string) => {
  const isTax = selectedTemplate?.type === 'tax'
  const isDepartment = selectedTemplate?.type === 'department'

  // Use split ledger for all reports except tax and department
  if (!isTax && !isDepartment) {
    return generateSplitLedgerHTML(data, dateRange, employmentStatus)
  }

  const sortedData = data.sort((a, b) =>
    `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`)
  )

  const reportTitle = getReportTitle(selectedTemplate, data, employmentStatus)

  const tableHead = isTax
    ? `
      <thead>
        <tr>
          <th>Serial No.</th>
          <th>Name</th>
          <th>Position</th>
          <th>Employee No.</th>
          <th>Department</th>
          <th>Gross Pay</th>
          <th>Withholding Tax (12%)</th>
          <th>Pag-IBIG (2%)</th>
          <th>SSS (4.5%)</th>
          <th>PhilHealth (2.75%)</th>
          <th>Total Contributions</th>
          <th>Net Pay</th>
        </tr>
      </thead>
    `
    : isDepartment
      ? `
      <thead>
        <tr>
          <th>Serial No.</th>
          <th>Name</th>
          <th>Position</th>
          <th>Employee No.</th>
          <th>Monthly Salary</th>
          <th>Days Present</th>
          <th>Hours Worked</th>
          <th>Gross Pay</th>
          <th>Total Deductions</th>
          <th>Net Pay</th>
          <th>Signature</th>
        </tr>
      </thead>
    `
      : `
      <thead>
        <tr>
          <th rowspan="2">Serial No.</th>
          <th rowspan="2">Name</th>
          <th rowspan="2">Position</th>
          <th rowspan="2">Employee No.</th>
          <th colspan="7">Compensations</th>
          <th colspan="5">Deductions/Contributions</th>
          <th rowspan="2">Net Amount Due</th>
          <th rowspan="2">Signature</th>
        </tr>
        <tr>
          <th>Rate per Hour</th>
          <th>Rate per Day</th>
          <th>No. of Days</th>
          <th>No. of Hours</th>
          <th>Earned for Period</th>
          <th>Less: Undertime</th>
          <th>Gross Amount Earned</th>
          <th>Withholding Tax</th>
          <th>GSIS Contribution</th>
          <th>PhilHealth Contribution</th>
          <th>Pag-ibig Contribution</th>
          <th>Total Deductions</th>
        </tr>
      </thead>
    `

  const tableBody = data.length === 0
    ? (isTax
      ? `<tr><td colspan="12" style="padding: 16px; text-align: center; color: #6b7280;">No tax withholding data available. Please generate report first.</td></tr>`
      : isDepartment
        ? `<tr><td colspan="11" style="padding: 16px; text-align: center; color: #6b7280;">No department payroll data available. Please generate report first.</td></tr>`
        : `<tr><td colspan="18" style="padding: 16px; text-align: center; color: #6b7280;">No employee data available. Please generate payroll first.</td></tr>`)
    : (isTax ? buildTaxRows(sortedData) : isDepartment ? buildDepartmentRows(sortedData) : buildStandardRows(sortedData))

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BISU Payroll Report</title>
      <style>
        @page { size: landscape; margin: 0.5in; }
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; color: black; }
        .header { text-align: center; margin-bottom: 16px; }
        .header h1 { font-size: 20px; margin: 0 0 10px 0; font-weight: bold; }
        .header h2 { font-size: 16px; margin: 0 0 16px 0; font-weight: normal; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .acknowledgment { margin-bottom: 12px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
        th, td { border: 1px solid #000; padding: 4px; font-size: 10px; }
        th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
        .cert-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
        .cert-box { border: 1px solid #000; padding: 10px; position: relative; min-height: 60px; }
        .cert-letter { position: absolute; top: 2px; right: 5px; width: 15px; height: 15px; border: 1px solid #000; text-align: center; font-weight: bold; font-size: 10px; }
        .cert-content { font-size: 9px; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportTitle}</h1>
        <h2>For the Period: ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}</h2>
      </div>
      <div class="info-section">
        <div>
          <p><strong>Entity Name:</strong> BISU Balilihan Campus</p>
          <p><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
          ${selectedTemplate?.type === 'department' && data?.[0]?.user?.department ? `<p><strong>Department:</strong> ${data[0].user.department}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <p><strong>Report no.:</strong> _________________________</p>
          <p><strong>Sheet no.:</strong> 1 of 1</p>
          <p><strong>Generated:</strong> ${format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
        </div>
      </div>
      ${selectedTemplate?.type !== 'tax' ? `
        <div class="acknowledgment">
          <p>We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}.</p>
        </div>
      ` : ''}
      <table>
        ${tableHead}
        <tbody>
          ${tableBody}
        </tbody>
      </table>
      ${selectedTemplate?.type !== 'tax' ? `
        <div class="cert-section">
          <div class="cert-box">
            <div class="cert-letter">A</div>
            <div class="cert-content">
              <p><strong>Prepared by:</strong></p>
              <p><strong>Maricel R. Tambis</strong></p>
              <p>(Administrative Aide 3)</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">B</div>
            <div class="cert-content">
              <p><strong>Reviewed by:</strong></p>
              <p><strong>Anneli C. Uy</strong></p>
              <p>(Administrative Assistant 2 - Disbursing Officer 2)</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">C</div>
            <div class="cert-content">
              <p><strong>Approved by:</strong></p>
              <p><strong>Jean F. Nebrea</strong></p>
              <p>(Associate Professor 5)</p>
            </div>
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `
}

export const filterReports = (reports: any[], searchTerm: string, selectedReportType: string) => {
  return reports.filter(report => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType =
      selectedReportType === "All Types" ||
      report.type.toLowerCase() === selectedReportType.toLowerCase()

    return matchesSearch && matchesType
  })
}

export const parseSavedLedgerJsonToPayrollData = (
  content: string
): { payrollData: PayrollData[]; dateRange: DateRange; employmentStatus?: string } => {
  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error("Invalid JSON content for saved ledger")
  }

  const from = parsed.payPeriodStart ? new Date(parsed.payPeriodStart) : undefined
  const to = parsed.payPeriodEnd ? new Date(parsed.payPeriodEnd) : undefined

  if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error("Saved ledger is missing a valid pay period range")
  }

  const employees: any[] = Array.isArray(parsed.employees) ? parsed.employees : []
  const employmentStatus = parsed.employmentStatus === 'All Statuses' ? 'all' : parsed.employmentStatus

  const payrollData: PayrollData[] = employees.map((emp: any, index: number) => {
    const name: string = emp.name || "Unknown"
    let firstName = name
    let lastName = ""
    if (name.includes(",")) {
      const parts = name.split(",")
      lastName = (parts[0] || "").trim()
      firstName = (parts.slice(1).join(",") || "").trim()
    } else {
      const parts = name.trim().split(/\s+/)
      if (parts.length > 1) {
        lastName = parts.pop() as string
        firstName = parts.join(" ")
      }
    }

    const deductions = emp.deductions || {}

    return {
      id: String(index + 1),
      userId: emp.employeeId || String(index + 1),
      user: {
        id: emp.employeeId || String(index + 1),
        firstName,
        lastName,
        employeeId: emp.employeeId || null,
        department: emp.department || parsed.department || null,
        position: emp.position || null
      },
      dailyRate: Number(emp.dailyRate || 0),
      hourlyRate: Number(emp.hourlyRate || 0),
      grossPay: Number(emp.grossPay || 0),
      netPay: Number(emp.netPay || 0),
      totalDeductions: Number(emp.totalDeductions || 0),
      totalEarnings: Number(emp.totalEarnings || 0),
      earningsBreakdown: {
        regularPay: Number(emp.regularPay || 0),
        overtimePay: Number(emp.overtimePay || 0),
        holidayPay: Number(emp.holidayPay || 0),
        allowances: Number(emp.allowances || 0),
        bonuses: Number(emp.bonuses || 0),
        thirteenthMonthPay: Number(emp.thirteenthMonthPay || 0),
        serviceIncentiveLeave: Number(emp.serviceIncentiveLeave || 0),
        otherEarnings: Number(emp.otherEarnings || 0)
      },
      deductionBreakdown: {
        withholdingTax: deductions.withholdingTax ?? 0,
        gsisContribution: deductions.gsisContribution ?? 0,
        philHealthContribution: deductions.philHealthContribution ?? 0,
        pagibigContribution: deductions.pagibigContribution ?? 0,
        lateDeductions: deductions.lateDeductions ?? 0,
        loanDeductions: deductions.loanDeductions ?? 0,
        otherDeductions: deductions.otherDeductions ?? 0,
        citySavingsLoan: deductions.citySavingsLoan ?? 0,
        sssContribution: deductions.sssContribution ?? 0
      },
      attendanceData: {
        daysPresent: Number(emp.daysPresent || emp.daysWorked || 0),
        hoursWorked: Number(emp.hoursWorked || 0),
        lateHours: Number(emp.lateHours || 0)
      },
      payPeriodStart: parsed.payPeriodStart,
      payPeriodEnd: parsed.payPeriodEnd
    }
  })

  const dateRange: DateRange = { from, to }

  return { payrollData, dateRange, employmentStatus }
}
