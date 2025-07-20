"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Printer } from "lucide-react"
import { format } from "date-fns"
import { PayrollData } from '../types'
import { DateRange } from "react-day-picker"

interface PayrollPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  payrollData: PayrollData[]
  templateDateRange: DateRange | undefined
  onPrint: () => void
}

export const PayrollPreviewDialog = ({
  isOpen,
  onClose,
  payrollData,
  templateDateRange,
  onPrint
}: PayrollPreviewDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold text-bisu-purple-deep mb-4">
            Payroll Report Preview
          </DialogTitle>
          <div className="flex items-center justify-end gap-6 pr-8">
            <Button variant="outline" onClick={onClose}>
              <Eye className="mr-2 h-4 w-4" />
              Close Preview
            </Button>
            <Button onClick={onPrint} className="bg-bisu-purple-deep hover:bg-bisu-purple-medium">
              <Printer className="mr-2 h-4 w-4" />
              Print Payroll
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
              PAYROLL - CONTRACT OF SERVICE INSTRUCTORS - of BISU Balilihan Campus
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
              </div>
              <div className="space-y-1 text-right">
                <p><strong>Payroll no.:</strong> _________________________</p>
                <p><strong>Sheet no.:</strong> 1 of 1</p>
              </div>
            </div>
          </div>

          <div className="mb-4 print:mb-2">
            <p className="text-sm">
              We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered {templateDateRange?.from && templateDateRange?.to && 
                `${format(templateDateRange.from, 'MMMM dd, yyyy')} - ${format(templateDateRange.to, 'MMMM dd, yyyy')}`}.
            </p>
          </div>

          <div className="border border-black mb-6">
            <table className="w-full border-collapse text-xs print:text-[10px]">
              <thead>
                <tr className="border-b border-black">
                  <th rowSpan={2} className="border-r border-black p-1 w-8">Serial No.</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-32">Name</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-24">Position</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-20">Employee No.</th>
                  <th colSpan={7} className="border-r border-black p-1 text-center">Compensations</th>
                  <th colSpan={4} className="border-r border-black p-1 text-center">Deductions/Contributions</th>
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
                  <th className="border-r border-black p-1 w-16">City Savings Loan</th>
                  <th className="border-r border-black p-1 w-16">Pag-ibig Contribution</th>
                  <th className="border-r border-black p-1 w-16">Total Deductions</th>
                </tr>
              </thead>
              <tbody>
                {payrollData && payrollData.length > 0 ? (
                  payrollData
                    .sort((a, b) => `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`))
                    .map((employee, index) => {
                    const salary = parseFloat(employee.user.salary?.toString() || '0')
                    const baseSalary = parseFloat(employee.baseSalary?.toString() || '0')
                    const deductions = parseFloat(employee.deductions?.toString() || '0')
                    const netPay = parseFloat(employee.netPay?.toString() || '0')
                    const hoursWorked = parseFloat(employee.attendanceData.hoursWorked?.toString() || '0')
                    const lateHours = parseFloat(employee.attendanceData.lateHours?.toString() || '0')
                    const withholdingTax = parseFloat(employee.deductionBreakdown.withholdingTax?.toString() || '0')
                    const citySavingsLoan = parseFloat(employee.deductionBreakdown.citySavingsLoan?.toString() || '0')
                    const pagibigContribution = parseFloat(employee.deductionBreakdown.pagibigContribution?.toString() || '0')

                    const hourlyRate = salary > 0 ? salary / (30 * 8) : 0
                    const dailyRate = salary > 0 ? salary / 30 : 0
                    const earnedForPeriod = baseSalary
                    const undertimeDeduction = lateHours * hourlyRate * 0.5
                    const grossAmount = earnedForPeriod - undertimeDeduction

                    return (
                      <tr key={employee.id} className="border-b border-gray-300">
                        <td className="border-r border-black p-1 text-center">{index + 1}</td>
                        <td className="border-r border-black p-1">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
                        <td className="border-r border-black p-1">{employee.user.position || 'N/A'}</td>
                        <td className="border-r border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
                        <td className="border-r border-black p-1 text-right">₱{hourlyRate.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right">₱{dailyRate.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-center">{employee.attendanceData.daysPresent || 0}</td>
                        <td className="border-r border-black p-1 text-center">{hoursWorked.toFixed(1)}</td>
                        <td className="border-r border-black p-1 text-right">₱{earnedForPeriod.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right">₱{undertimeDeduction.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right">₱{grossAmount.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right">₱{withholdingTax.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right">₱{citySavingsLoan.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right">₱{pagibigContribution.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right">₱{deductions.toFixed(2)}</td>
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
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 print:mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-black p-2 relative">
                <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">A</div>
                <p className="text-xs font-semibold mb-1">Certified:</p>
                <p className="text-xs font-bold">Shiela Olaguir</p>
                <p className="text-xs">Dean of CCIS</p>
              </div>
              <div className="border border-black p-2 relative">
                <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">B</div>
                <p className="text-xs font-semibold mb-1">Certified:</p>
                <p className="text-xs font-bold">Jean F. Nebrea</p>
                <p className="text-xs">Campus Director</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-black p-2 relative">
                <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">C</div>
                <p className="text-xs font-semibold mb-1">Certified:</p>
                <p className="text-xs font-bold">Julie Mae Sembrano</p>
                <p className="text-xs">Accountant II</p>
              </div>
              <div className="border border-black p-2 relative">
                <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">D</div>
                <p className="text-xs font-semibold mb-1">Certified:</p>
                <p className="text-xs font-bold">Anneli Uy</p>
                <p className="text-xs">Disbursing Officer</p>
              </div>
            </div>
          </div>

          <div className="mt-4 print:mt-2 grid grid-cols-2 gap-4">
            <div className="border border-black p-2">
              <p className="text-xs font-semibold mb-1">Additional Certifiers:</p>
              <p className="text-xs"><strong>Junrey Poyos</strong> - Dean of CTAS</p>
              <p className="text-xs"><strong>Mary Joyce Gudmalin</strong> - Dean of CCJ</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
