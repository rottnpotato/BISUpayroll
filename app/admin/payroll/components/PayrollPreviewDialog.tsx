"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Printer } from "lucide-react"
import { format } from "date-fns"
import { PayrollData, ReportTemplate } from '../types'
import { DateRange } from "react-day-picker"

interface PayrollPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  payrollData: PayrollData[]
  templateDateRange: DateRange | undefined
  selectedTemplate: ReportTemplate | null
  onPrint: () => void
  employmentStatus?: string
}

export const PayrollPreviewDialog = ({
  isOpen,
  onClose,
  payrollData,
  templateDateRange,
  selectedTemplate,
  onPrint,
  employmentStatus
}: PayrollPreviewDialogProps) => {
  const getReportTitle = () => {
    switch (selectedTemplate?.type) {
      case "department":
        return `DEPARTMENT PAYROLL REPORT - ${payrollData[0]?.user?.department || 'UNKNOWN'} DEPARTMENT`
      case "tax":
        return "TAX WITHHOLDING & CONTRIBUTIONS SUMMARY REPORT"
      case "custom":
        return "CUSTOM PERIOD PAYROLL REPORT"
      default:
        // Dynamic header based on employment status
        const statusLabel = employmentStatus && employmentStatus !== 'all' 
          ? employmentStatus.toUpperCase()
          : 'ALL STATUS'
        return `PAYROLL - ${statusLabel} EMPLOYEES - OF BISU BALILIHAN CAMPUS`
    }
  }

  const renderStandardPayrollTable = () => (
    <table className="w-full border-collapse text-xs print:text-[10px]">
      <thead>
        <tr className="border-b border-black">
          <th rowSpan={2} className="border-r border-black p-1 w-8">Serial No.</th>
          <th rowSpan={2} className="border-r border-black p-1 w-32">Name</th>
          <th rowSpan={2} className="border-r border-black p-1 w-24">Position</th>
          <th rowSpan={2} className="border-r border-black p-1 w-20">Employee No.</th>
          <th colSpan={7} className="border-r border-black p-1 text-center">Compensations</th>
          <th colSpan={5} className="border-r border-black p-1 text-center">Deductions/Contributions</th>
          <th rowSpan={2} className="border-r border-black p-1 w-20">Net Amount Due</th>
          <th rowSpan={2} className="p-1 w-24">Signature</th>
        </tr>
        <tr className="border-b border-black text-[10px] print:text-[8px]">
          <th className="border-r border-black p-1 w-16">Rate per Hour</th>
          <th className="border-r border-black p-1 w-16">Rate per Day</th>
          <th className="border-r border-black p-1 w-12">No. of Days</th>
          <th className="border-r border-black p-1 w-12">No. of Hours</th>
          <th className="border-r border-black p-1 w-20">Earned for Period</th>
          <th className="border-r border-black p-1 w-16">Less: Undertime</th>
          <th className="border-r border-black p-1 w-20">Gross Amount Earned</th>
          <th className="border-r border-black p-1 w-16">Withholding Tax</th>
          <th className="border-r border-black p-1 w-16">GSIS Contribution</th>
          <th className="border-r border-black p-1 w-16">PhilHealth Contribution</th>
          <th className="border-r border-black p-1 w-16">Pag-ibig Contribution</th>
          <th className="border-r border-black p-1 w-16">Total Deductions</th>
        </tr>
      </thead>
      <tbody>
        {renderStandardPayrollRows()}
      </tbody>
    </table>
  )

  const renderTaxWithholdingTable = () => (
    <table className="w-full border-collapse text-xs print:text-[10px]">
      <thead>
        <tr className="border-b border-black">
          <th className="border-r border-black p-1 w-8">Serial No.</th>
          <th className="border-r border-black p-1 w-32">Name</th>
          <th className="border-r border-black p-1 w-24">Position</th>
          <th className="border-r border-black p-1 w-20">Employee No.</th>
          <th className="border-r border-black p-1 w-20">Department</th>
          <th className="border-r border-black p-1 w-20">Gross Pay</th>
          <th className="border-r border-black p-1 w-18">Withholding Tax (12%)</th>
          <th className="border-r border-black p-1 w-18">Pag-IBIG (2%)</th>
          <th className="border-r border-black p-1 w-18">SSS (4.5%)</th>
          <th className="border-r border-black p-1 w-18">PhilHealth (2.75%)</th>
          <th className="border-r border-black p-1 w-20">Total Contributions</th>
          <th className="p-1 w-20">Net Pay</th>
        </tr>
      </thead>
      <tbody>
        {renderTaxWithholdingRows()}
      </tbody>
    </table>
  )

  const renderDepartmentPayrollTable = () => (
    <table className="w-full border-collapse text-xs print:text-[10px]">
      <thead>
        <tr className="border-b border-black">
          <th className="border-r border-black p-1 w-8">Serial No.</th>
          <th className="border-r border-black p-1 w-32">Name</th>
          <th className="border-r border-black p-1 w-24">Position</th>
          <th className="border-r border-black p-1 w-20">Employee No.</th>
          <th className="border-r border-black p-1 w-20">Monthly Salary</th>
          <th className="border-r border-black p-1 w-16">Days Present</th>
          <th className="border-r border-black p-1 w-16">Hours Worked</th>
          <th className="border-r border-black p-1 w-20">Gross Pay</th>
          <th className="border-r border-black p-1 w-20">Total Deductions</th>
          <th className="border-r border-black p-1 w-20">Net Pay</th>
          <th className="p-1 w-24">Signature</th>
        </tr>
      </thead>
      <tbody>
        {renderDepartmentPayrollRows()}
      </tbody>
    </table>
  )

  const renderStandardPayrollRows = () => (
    payrollData && payrollData.length > 0 ? (
      payrollData
        .sort((a, b) => `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`))
        .map((employee, index) => {
          console.log(employee)
          const salary = parseFloat(employee.dailyRate?.toString() || '0')
          
          // Use the detailed data from PayrollResult if available
          const regularPay = parseFloat(employee.earningsBreakdown?.regularPay?.toString() || employee.dailyRate?.toString() || '0')
          const overtimePay = parseFloat(employee.earningsBreakdown?.overtimePay?.toString() || employee.overtime?.toString() || '0')
          const holidayPay = parseFloat(employee.earningsBreakdown?.holidayPay?.toString() || '0')
          const allowances = parseFloat(employee.earningsBreakdown?.allowances?.toString() || '0')
          const bonuses = parseFloat(employee.earningsBreakdown?.bonuses?.toString() || employee.bonuses?.toString() || '0')
          const thirteenthMonthPay = parseFloat(employee.earningsBreakdown?.thirteenthMonthPay?.toString() || '0')
          const serviceIncentiveLeave = parseFloat(employee.earningsBreakdown?.serviceIncentiveLeave?.toString() || '0')
          
          const grossPay = parseFloat(employee.grossPay?.toString() || '0')
          const netPay = parseFloat(employee.netPay?.toString() || '0')
          
          // Use detailed deduction breakdown
          const gsisContribution = parseFloat(employee.deductionBreakdown?.gsisContribution?.toString() || '0')
          const philHealthContribution = parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
          const pagibigContribution = parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
          const withholdingTax = parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
          const lateDeductions = parseFloat(employee.deductionBreakdown?.lateDeductions?.toString() || '0')
          const loanDeductions = parseFloat(employee.deductionBreakdown?.loanDeductions?.toString() || '0')
          const otherDeductions = parseFloat(employee.deductionBreakdown?.otherDeductions?.toString() || '0')
          
          // Attendance data
          const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')
          const daysWorked = parseFloat(employee.attendanceData?.daysPresent?.toString() || '0')
          const lateHours = parseFloat(employee.attendanceData?.lateHours?.toString() || '0')
          
          // Calculate rates for display
          const dailyRate = employee.dailyRate ? parseFloat(employee.dailyRate.toString()) : (salary > 0 ? salary / 22 : 0)
          const hourlyRate = employee.hourlyRate ? parseFloat(employee.hourlyRate.toString()) : (salary > 0 ? salary / (22 * 8) : 0)
          
          // Total earnings and deductions
          const totalEarnings = regularPay + overtimePay + holidayPay + 
                               allowances + bonuses + thirteenthMonthPay + serviceIncentiveLeave
          const totalDeductions = gsisContribution + philHealthContribution + pagibigContribution + 
                                 withholdingTax + lateDeductions + loanDeductions + otherDeductions

          return (
            <tr key={employee.id} className="border-b border-gray-300">
              <td className="border-r border-black p-1 text-center">{index + 1}</td>
              <td className="border-r border-black p-1">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
              <td className="border-r border-black p-1">{employee.user.position || 'N/A'}</td>
              <td className="border-r border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
              <td className="border-r border-black p-1 text-right">₱{hourlyRate.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{dailyRate.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-center">{daysWorked.toFixed(1)}</td>
              <td className="border-r border-black p-1 text-center">{hoursWorked.toFixed(1)}</td>
              <td className="border-r border-black p-1 text-right">₱{totalEarnings.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{lateDeductions.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{grossPay.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{withholdingTax.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{gsisContribution.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{philHealthContribution.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{pagibigContribution.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{totalDeductions.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{netPay.toFixed(2)}</td>
              <td className="p-1"></td>
            </tr>
          )
        })
    ) : (
      <tr>
        <td colSpan={17} className="border-r border-black p-4 text-center text-gray-500">
          No employee data available. Please generate payroll first.
        </td>
      </tr>
    )
  )

  const renderTaxWithholdingRows = () => (
    payrollData && payrollData.length > 0 ? (
      payrollData
        .sort((a, b) => `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`))
        .map((employee, index) => {
          const grossPay = parseFloat(employee.grossPay?.toString() || '0')
          const netPay = parseFloat(employee.netPay?.toString() || '0')
          
          // Use tax breakdown if available, otherwise calculate
          const withholdingTax = employee.taxBreakdown?.withholdingTax || parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
          const pagibigContribution = employee.taxBreakdown?.pagibigContribution || parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
          const sssContribution = employee.taxBreakdown?.sssContribution || parseFloat(employee.deductionBreakdown?.sssContribution?.toString() || '0')
          const philHealthContribution = employee.taxBreakdown?.philHealthContribution || parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
          const totalContributions = employee.taxBreakdown?.totalContributions || (withholdingTax + pagibigContribution + sssContribution + philHealthContribution)

          return (
            <tr key={employee.id} className="border-b border-gray-300">
              <td className="border-r border-black p-1 text-center">{index + 1}</td>
              <td className="border-r border-black p-1">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
              <td className="border-r border-black p-1">{employee.user.position || 'N/A'}</td>
              <td className="border-r border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
              <td className="border-r border-black p-1 text-center">{employee.user.department || 'N/A'}</td>
              <td className="border-r border-black p-1 text-right">₱{grossPay.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{withholdingTax.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{pagibigContribution.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{sssContribution.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{philHealthContribution.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{totalContributions.toFixed(2)}</td>
              <td className="p-1 text-right">₱{netPay.toFixed(2)}</td>
            </tr>
          )
        })
    ) : (
      <tr>
        <td colSpan={12} className="border-r border-black p-4 text-center text-gray-500">
          No tax withholding data available. Please generate report first.
        </td>
      </tr>
    )
  )

  const renderDepartmentPayrollRows = () => (
    payrollData && payrollData.length > 0 ? (
      payrollData
        .sort((a, b) => `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`))
        .map((employee, index) => {
          const salary = parseFloat(employee.dailyRate?.toString() || '0')
          const grossPay = parseFloat(employee.grossPay?.toString() || '0')
          const deductions = parseFloat(employee.deductions?.toString() || '0')
          const netPay = parseFloat(employee.netPay?.toString() || '0')
          const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')

          return (
            <tr key={employee.id} className="border-b border-gray-300">
              <td className="border-r border-black p-1 text-center">{index + 1}</td>
              <td className="border-r border-black p-1">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
              <td className="border-r border-black p-1">{employee.user.position || 'N/A'}</td>
              <td className="border-r border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
              <td className="border-r border-black p-1 text-right">₱{salary.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-center">{employee.attendanceData?.daysPresent || 0}</td>
              <td className="border-r border-black p-1 text-center">{hoursWorked.toFixed(1)}</td>
              <td className="border-r border-black p-1 text-right">₱{grossPay.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{deductions.toFixed(2)}</td>
              <td className="border-r border-black p-1 text-right">₱{netPay.toFixed(2)}</td>
              <td className="p-1"></td>
            </tr>
          )
        })
    ) : (
      <tr>
        <td colSpan={11} className="border-r border-black p-4 text-center text-gray-500">
          No department payroll data available. Please generate report first.
        </td>
      </tr>
    )
  )

  const renderReportSummary = () => {
    if (!payrollData || payrollData.length === 0) return null

    const totals = payrollData.reduce((acc, employee) => {
      const grossPay = parseFloat(employee.grossPay?.toString() || '0')
      const netPay = parseFloat(employee.netPay?.toString() || '0')
      const deductions = parseFloat(employee.deductions?.toString() || '0')
      
      return {
        totalEmployees: acc.totalEmployees + 1,
        totalGrossPay: acc.totalGrossPay + grossPay,
        totalNetPay: acc.totalNetPay + netPay,
        totalDeductions: acc.totalDeductions + deductions
      }
    }, { totalEmployees: 0, totalGrossPay: 0, totalNetPay: 0, totalDeductions: 0 })

    return (
      <div className="mt-6 p-4 border border-black bg-gray-50">
        <h3 className="font-bold text-sm mb-3">Report Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold">Total Employees:</span>
            <p className="text-lg font-bold">{totals.totalEmployees}</p>
          </div>
          <div>
            <span className="font-semibold">Total Gross Pay:</span>
            <p className="text-lg font-bold text-green-600">₱{totals.totalGrossPay.toFixed(2)}</p>
          </div>
          <div>
            <span className="font-semibold">Total Deductions:</span>
            <p className="text-lg font-bold text-red-600">₱{totals.totalDeductions.toFixed(2)}</p>
          </div>
          <div>
            <span className="font-semibold">Total Net Pay:</span>
            <p className="text-lg font-bold text-blue-600">₱{totals.totalNetPay.toFixed(2)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold text-bisu-purple-deep mb-4">
            {selectedTemplate?.name || 'Payroll Report'} Preview
          </DialogTitle>
          <div className="flex items-center justify-end gap-6 pr-8">
            <Button variant="outline" onClick={onClose}>
              <Eye className="mr-2 h-4 w-4" />
              Close Preview
            </Button>
            <Button onClick={onPrint} className="bg-bisu-purple-deep hover:bg-bisu-purple-medium">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </DialogHeader>
        <div className="payroll-report">
          <style jsx>{`
            .payroll-report {
              font-size: 12px;
              color: black;
              background: white;
              padding: 20px;
            }
          `}</style>
          
          <div className="text-center mb-8 print:mb-4">
            <h1 className="text-2xl font-bold mb-2 print:text-lg">
              {getReportTitle()}
            </h1>
            <h2 className="text-lg font-semibold print:text-base">
              For the Period: {templateDateRange?.from && templateDateRange?.to && 
                `${format(templateDateRange.from, 'MMMM dd, yyyy')} - ${format(templateDateRange.to, 'MMMM dd, yyyy')}`
              }
            </h2>
          </div>

          <div className="mb-6 print:mb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p><strong>Entity Name:</strong> BISU Balilihan Campus</p>
                <p><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
                {selectedTemplate?.type === "department" && payrollData?.[0]?.user?.department && (
                  <p><strong>Department:</strong> {payrollData[0].user.department}</p>
                )}
              </div>
              <div className="space-y-1 text-right">
                <p><strong>Report no.:</strong> _________________________</p>
                <p><strong>Sheet no.:</strong> 1 of 1</p>
                <p><strong>Generated:</strong> {format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
              </div>
            </div>
          </div>

          {selectedTemplate?.type !== "tax" && (
            <div className="mb-4 print:mb-2">
              <p className="text-sm">
                We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered {templateDateRange?.from && templateDateRange?.to && 
                  `${format(templateDateRange.from, 'MMMM dd, yyyy')} - ${format(templateDateRange.to, 'MMMM dd, yyyy')}`}.
              </p>
            </div>
          )}

          <div className="border border-black mb-6">
            {selectedTemplate?.type === "tax" && renderTaxWithholdingTable()}
            {selectedTemplate?.type === "department" && renderDepartmentPayrollTable()}
            {(selectedTemplate?.type === "monthly" || selectedTemplate?.type === "custom" || !selectedTemplate?.type) && renderStandardPayrollTable()}
          </div>

          {/* {renderReportSummary()} */}

          {selectedTemplate?.type !== "tax" && (
            <div className="grid grid-cols-2 gap-4 mt-8 print:mt-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-black p-2 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">A</div>
                  <p className="text-xs font-semibold mb-1">Prepared by:</p>
                  <p className="text-xs font-bold">Maricel R. Tambis</p>
                  <p className="text-xs">(Administrative Aide 3)</p>
                </div>
                <div className="border border-black p-2 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">B</div>
                  <p className="text-xs font-semibold mb-1">Reviewed by:</p>
                  <p className="text-xs font-bold">Anneli C. Uy</p>
                  <p className="text-xs">(Administrative Assistant 2 - Disbursing Officer 2)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-black p-2 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">C</div>
                  <p className="text-xs font-semibold mb-1">Approved by:</p>
                  <p className="text-xs font-bold">Jean F. Nebrea</p>
                  <p className="text-xs">(Associate Professor 5)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 