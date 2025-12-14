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
        const statusLabel = employmentStatus && employmentStatus !== 'all' 
          ? employmentStatus.toUpperCase()
          : 'ALL STATUS'
        return `PAYROLL LEDGER - ${statusLabel} EMPLOYEES - BISU BALILIHAN CAMPUS`
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

  const sortedData = payrollData?.sort((a, b) => 
    `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`)
  ) || []

  const renderCompensationTable = () => (
    <div className="mb-8">
      <h3 className="text-sm font-bold mb-2 text-center bg-green-100 py-1 border border-black">COMPENSATIONS</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-center">No.</th>
              <th className="border border-black p-1 text-center">Name</th>
              <th className="border border-black p-1 text-center">Position</th>
              <th className="border border-black p-1 text-center">Emp No.</th>
              <th className="border border-black p-1 text-center">Rate/Hour</th>
              <th className="border border-black p-1 text-center">Rate/Day</th>
              <th className="border border-black p-1 text-center">Days</th>
              <th className="border border-black p-1 text-center">Hours</th>
              <th className="border border-black p-1 text-center">Regular Pay</th>
              <th className="border border-black p-1 text-center">OT Pay</th>
              <th className="border border-black p-1 text-center">Holiday</th>
              <th className="border border-black p-1 text-center">Allowances</th>
              <th className="border border-black p-1 text-center">Bonuses</th>
              <th className="border border-black p-1 text-center">13th Month</th>
              <th className="border border-black p-1 text-center">SIL</th>
              <th className="border border-black p-1 text-center font-bold">Total Earnings</th>
              <th className="border border-black p-1 text-center font-bold">Gross Pay</th>
              <th className="border border-black p-1 text-center font-bold">Net Pay</th>
              <th className="border border-black p-1 text-center">Signature</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length > 0 ? sortedData.map((employee, index) => {
              const regularPay = parseFloat(employee.earningsBreakdown?.regularPay?.toString() || '0')
              const overtimePay = parseFloat(employee.earningsBreakdown?.overtimePay?.toString() || '0')
              const holidayPay = parseFloat(employee.earningsBreakdown?.holidayPay?.toString() || '0')
              const allowances = parseFloat(employee.earningsBreakdown?.allowances?.toString() || '0')
              const bonuses = parseFloat(employee.earningsBreakdown?.bonuses?.toString() || '0')
              const thirteenthMonthPay = parseFloat(employee.earningsBreakdown?.thirteenthMonthPay?.toString() || '0')
              const serviceIncentiveLeave = parseFloat(employee.earningsBreakdown?.serviceIncentiveLeave?.toString() || '0')
              const grossPay = parseFloat(employee.grossPay?.toString() || '0')
              const netPay = parseFloat(employee.netPay?.toString() || '0')
              const dailyRate = employee.dailyRate ? parseFloat(employee.dailyRate.toString()) : 0
              const hourlyRate = employee.hourlyRate ? parseFloat(employee.hourlyRate.toString()) : 0
              const daysWorked = parseFloat(employee.attendanceData?.daysPresent?.toString() || '0')
              const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')
              const totalEarnings = regularPay + overtimePay + holidayPay + allowances + bonuses + thirteenthMonthPay + serviceIncentiveLeave

              return (
                <tr key={`comp-${employee.userId}`} className="border-b">
                  <td className="border border-black p-1 text-center">{index + 1}</td>
                  <td className="border border-black p-1 whitespace-nowrap">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
                  <td className="border border-black p-1">{employee.user.position || 'N/A'}</td>
                  <td className="border border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
                  <td className="border border-black p-1 text-right">{formatValue(hourlyRate)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(dailyRate)}</td>
                  <td className="border border-black p-1 text-center">{formatNumber(daysWorked)}</td>
                  <td className="border border-black p-1 text-center">{formatNumber(hoursWorked)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(regularPay)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(overtimePay)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(holidayPay)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(allowances)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(bonuses)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(thirteenthMonthPay)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(serviceIncentiveLeave)}</td>
                  <td className="border border-black p-1 text-right font-bold">{formatValue(totalEarnings)}</td>
                  <td className="border border-black p-1 text-right font-bold">{formatValue(grossPay)}</td>
                  <td className="border border-black p-1 text-right font-bold text-green-700">{formatValue(netPay)}</td>
                  <td className="border border-black p-1"></td>
                </tr>
              )
            }) : (
              <tr><td colSpan={19} className="border border-black p-4 text-center text-gray-500">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderDeductionTable = () => (
    <div className="mb-8">
      <h3 className="text-sm font-bold mb-2 text-center bg-red-100 py-1 border border-black">DEDUCTIONS</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-center">No.</th>
              <th className="border border-black p-1 text-center">Name</th>
              <th className="border border-black p-1 text-center">Position</th>
              <th className="border border-black p-1 text-center">Emp No.</th>
              <th className="border border-black p-1 text-center">Absences</th>
              <th className="border border-black p-1 text-center">Undertime</th>
              <th className="border border-black p-1 text-center">Sal Ded</th>
              <th className="border border-black p-1 text-center">PERA Ded</th>
              <th className="border border-black p-1 text-center">W/Tax</th>
              <th className="border border-black p-1 text-center">GSIS</th>
              <th className="border border-black p-1 text-center">Pag-ibig</th>
              <th className="border border-black p-1 text-center">PHIL</th>
              <th className="border border-black p-1 text-center">City Sav</th>
              <th className="border border-black p-1 text-center">GSIS Conso</th>
              <th className="border border-black p-1 text-center">GSIS Opt</th>
              <th className="border border-black p-1 text-center">GSIS GFAL</th>
              <th className="border border-black p-1 text-center">COA</th>
              <th className="border border-black p-1 text-center">GSIS Emrg</th>
              <th className="border border-black p-1 text-center">GSIS MPL</th>
              <th className="border border-black p-1 text-center">MPL_LITE</th>
              <th className="border border-black p-1 text-center">GSIS CPL</th>
              <th className="border border-black p-1 text-center">SSS Kaltas</th>
              <th className="border border-black p-1 text-center">FA Ded</th>
              <th className="border border-black p-1 text-center">HDMF MP2</th>
              <th className="border border-black p-1 text-center">HDMF PML</th>
              <th className="border border-black p-1 text-center">Other Ded<br/>(Custom)</th>
              <th className="border border-black p-1 text-center font-bold">Total Ded</th>
              <th className="border border-black p-1 text-center">Signature</th>
            </tr>
          </thead>
          <tbody>
          {sortedData.length > 0 ? sortedData.map((employee, index) => {
              const dailyRate = employee.dailyRate ? parseFloat(employee.dailyRate.toString()) : 0
              const allowances = parseFloat(employee.earningsBreakdown?.allowances?.toString() || '0')
              const daysWorked = parseFloat(employee.attendanceData?.daysPresent?.toString() || '0')
              const lateHours = parseFloat(employee.attendanceData?.lateHours?.toString() || '0')
              const undertimeHours = parseFloat(employee.attendanceData?.undertimeHours?.toString() || '0')
              
              const absences = 22 - daysWorked > 0 ? 22 - daysWorked : 0
              const absenceSalaryDeduction = absences * dailyRate
              const peraDaily = allowances / 22
              const absencePeraDeduction = absences * peraDaily
              const combinedUndertimeLate = undertimeHours + lateHours

              const withholdingTax = parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
              const gsisContribution = parseFloat(employee.deductionBreakdown?.gsisContribution?.toString() || '0')
              const philHealthContribution = parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
              const pagibigContribution = parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
              const citySavingsLoan = parseFloat(employee.deductionBreakdown?.citySavingsLoan?.toString() || '0')
              
              // Calculate custom deductions: employee-defined otherDeductions + admin-defined deduction rules (stored in loanDeductions by SP)
              const employeeOtherDeductions = parseFloat(employee.deductionBreakdown?.otherDeductions?.toString() || '0')
              const adminDefinedDeductions = parseFloat(employee.deductionBreakdown?.loanDeductions?.toString() || '0')
              const rulesBreakdownDeductions = (employee.appliedRulesBreakdown || [])
                .filter(rule => rule.ruleType?.toLowerCase() === 'deduction')
                .reduce((sum, rule) => sum + (parseFloat(rule.amount?.toString() || '0')), 0)
              const otherDeductions = employeeOtherDeductions + adminDefinedDeductions + rulesBreakdownDeductions
              
              const totalDeductions = parseFloat(employee.deductions?.toString() || '0')

              return (
                <tr key={`ded-${employee.userId}`} className="border-b">
                  <td className="border border-black p-1 text-center">{index + 1}</td>
                  <td className="border border-black p-1 whitespace-nowrap">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
                  <td className="border border-black p-1">{employee.user.position || 'N/A'}</td>
                  <td className="border border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
                  <td className="border border-black p-1 text-center">{absences > 0 ? absences.toFixed(1) : '-'}</td>
                  <td className="border border-black p-1 text-center">{combinedUndertimeLate > 0 ? combinedUndertimeLate.toFixed(2) : '-'}</td>
                  <td className="border border-black p-1 text-right">{formatValue(absenceSalaryDeduction)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(absencePeraDeduction)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(withholdingTax)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(gsisContribution)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(pagibigContribution)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(philHealthContribution)}</td>
                  <td className="border border-black p-1 text-right">{formatValue(citySavingsLoan)}</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-center">-</td>
                  <td className="border border-black p-1 text-right">{otherDeductions > 0 ? formatValue(otherDeductions) : '-'}</td>
                  <td className="border border-black p-1 text-right font-bold">{formatValue(totalDeductions)}</td>
                  <td className="border border-black p-1"></td>
                </tr>
              )
            }) : (
              <tr><td colSpan={28} className="border border-black p-4 text-center text-gray-500">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderTaxWithholdingTable = () => (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-black bg-gray-100">
          <th className="border border-black p-1 text-center">No.</th>
          <th className="border border-black p-1 text-center">Name</th>
          <th className="border border-black p-1 text-center">Position</th>
          <th className="border border-black p-1 text-center">Emp No.</th>
          <th className="border border-black p-1 text-center">Department</th>
          <th className="border border-black p-1 text-center">Gross Pay</th>
          <th className="border border-black p-1 text-center">W/Tax (12%)</th>
          <th className="border border-black p-1 text-center">Pag-IBIG (2%)</th>
          <th className="border border-black p-1 text-center">SSS (4.5%)</th>
          <th className="border border-black p-1 text-center">PhilHealth (2.75%)</th>
          <th className="border border-black p-1 text-center">Total Contributions</th>
          <th className="border border-black p-1 text-center">Net Pay</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.length > 0 ? sortedData.map((employee, index) => {
          const grossPay = parseFloat(employee.grossPay?.toString() || '0')
          const netPay = parseFloat(employee.netPay?.toString() || '0')
          const withholdingTax = employee.taxBreakdown?.withholdingTax || parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
          const pagibigContribution = employee.taxBreakdown?.pagibigContribution || parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
          const sssContribution = employee.taxBreakdown?.sssContribution || parseFloat(employee.deductionBreakdown?.sssContribution?.toString() || '0')
          const philHealthContribution = employee.taxBreakdown?.philHealthContribution || parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
          const totalContributions = employee.taxBreakdown?.totalContributions || (withholdingTax + pagibigContribution + sssContribution + philHealthContribution)

          return (
            <tr key={employee.userId} className="border-b">
              <td className="border border-black p-1 text-center">{index + 1}</td>
              <td className="border border-black p-1">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
              <td className="border border-black p-1">{employee.user.position || 'N/A'}</td>
              <td className="border border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
              <td className="border border-black p-1 text-center">{employee.user.department || 'N/A'}</td>
              <td className="border border-black p-1 text-right">₱{grossPay.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{withholdingTax.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{pagibigContribution.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{sssContribution.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{philHealthContribution.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{totalContributions.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{netPay.toFixed(2)}</td>
            </tr>
          )
        }) : (
          <tr><td colSpan={12} className="border border-black p-4 text-center text-gray-500">No data available</td></tr>
        )}
      </tbody>
    </table>
  )

  const renderDepartmentPayrollTable = () => (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-black bg-gray-100">
          <th className="border border-black p-1 text-center">No.</th>
          <th className="border border-black p-1 text-center">Name</th>
          <th className="border border-black p-1 text-center">Position</th>
          <th className="border border-black p-1 text-center">Emp No.</th>
          <th className="border border-black p-1 text-center">Monthly Salary</th>
          <th className="border border-black p-1 text-center">Days Present</th>
          <th className="border border-black p-1 text-center">Hours Worked</th>
          <th className="border border-black p-1 text-center">Gross Pay</th>
          <th className="border border-black p-1 text-center">Total Deductions</th>
          <th className="border border-black p-1 text-center">Net Pay</th>
          <th className="border border-black p-1 text-center">Signature</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.length > 0 ? sortedData.map((employee, index) => {
          const salary = parseFloat(employee.dailyRate?.toString() || '0')
          const grossPay = parseFloat(employee.grossPay?.toString() || '0')
          const deductions = parseFloat(employee.deductions?.toString() || '0')
          const netPay = parseFloat(employee.netPay?.toString() || '0')
          const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')

          return (
            <tr key={employee.userId} className="border-b">
              <td className="border border-black p-1 text-center">{index + 1}</td>
              <td className="border border-black p-1">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
              <td className="border border-black p-1">{employee.user.position || 'N/A'}</td>
              <td className="border border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
              <td className="border border-black p-1 text-right">₱{salary.toFixed(2)}</td>
              <td className="border border-black p-1 text-center">{employee.attendanceData?.daysPresent || 0}</td>
              <td className="border border-black p-1 text-center">{hoursWorked.toFixed(1)}</td>
              <td className="border border-black p-1 text-right">₱{grossPay.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{deductions.toFixed(2)}</td>
              <td className="border border-black p-1 text-right">₱{netPay.toFixed(2)}</td>
              <td className="border border-black p-1"></td>
            </tr>
          )
        }) : (
          <tr><td colSpan={11} className="border border-black p-4 text-center text-gray-500">No data available</td></tr>
        )}
      </tbody>
    </table>
  )

  const isTax = selectedTemplate?.type === 'tax'
  const isDepartment = selectedTemplate?.type === 'department'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[95vh] overflow-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-bisu-purple-deep mb-4">
            {selectedTemplate?.name || 'Payroll Ledger'} Preview
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
        <div className="payroll-report bg-white p-4">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-2">{getReportTitle()}</h1>
            <h2 className="text-base">
              For the Period: {templateDateRange?.from && templateDateRange?.to && 
                `${format(templateDateRange.from, 'MMMM dd, yyyy')} - ${format(templateDateRange.to, 'MMMM dd, yyyy')}`
              }
            </h2>
          </div>

          <div className="mb-4 flex justify-between items-start text-xs">
            <div className="space-y-1">
              <p><strong>Entity Name:</strong> BISU Balilihan Campus</p>
              <p><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
              {isDepartment && payrollData?.[0]?.user?.department && (
                <p><strong>Department:</strong> {payrollData[0].user.department}</p>
              )}
            </div>
            <div className="space-y-1 text-right">
              <p><strong>Generated:</strong> {format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
            </div>
          </div>

          {!isTax && (
            <div className="mb-4 text-xs">
              <p>
                We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered {templateDateRange?.from && templateDateRange?.to && 
                  `${format(templateDateRange.from, 'MMMM dd, yyyy')} - ${format(templateDateRange.to, 'MMMM dd, yyyy')}`}.
              </p>
            </div>
          )}

          {isTax && renderTaxWithholdingTable()}
          {isDepartment && renderDepartmentPayrollTable()}
          {!isTax && !isDepartment && (
            <>
              {renderCompensationTable()}
              {renderDeductionTable()}
            </>
          )}

          {!isTax && (
            <div className="grid grid-cols-3 gap-4 mt-6 text-xs">
              <div className="border border-black p-2 relative">
                <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">A</div>
                <p className="font-semibold mb-1">Prepared by:</p>
                <p className="font-bold">Maricel R. Tambis</p>
                <p>(Administrative Aide 3)</p>
              </div>
              <div className="border border-black p-2 relative">
                <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">B</div>
                <p className="font-semibold mb-1">Reviewed by:</p>
                <p className="font-bold">Anneli C. Uy</p>
                <p>(Administrative Assistant 2 - Disbursing Officer 2)</p>
              </div>
              <div className="border border-black p-2 relative">
                <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">C</div>
                <p className="font-semibold mb-1">Approved by:</p>
                <p className="font-bold">Jean F. Nebrea</p>
                <p>(Associate Professor 5)</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
