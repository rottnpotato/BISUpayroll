"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bug, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PayrollDebugModalProps {
  defaultUserId?: string
  defaultStartDate?: Date
  defaultEndDate?: Date
}

export function PayrollDebugModal({ defaultUserId, defaultStartDate, defaultEndDate }: PayrollDebugModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(defaultUserId || "")
  const [startDate, setStartDate] = useState(
    defaultStartDate ? format(defaultStartDate, "yyyy-MM-dd") : ""
  )
  const [endDate, setEndDate] = useState(
    defaultEndDate ? format(defaultEndDate, "yyyy-MM-dd") : ""
  )
  const [debugData, setDebugData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDebug = async () => {
    if (!userId || !startDate || !endDate) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError(null)
    setDebugData(null)

    try {
      const response = await fetch(
        `/api/admin/payroll/debug-calculation?userId=${userId}&start=${startDate}&end=${endDate}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch debug data")
      }

      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return "null"
    if (typeof value === "number") return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (typeof value === "boolean") return value ? "✓" : "✗"
    if (value instanceof Date) return format(value, "MMM dd, yyyy HH:mm")
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return format(new Date(value), "MMM dd, yyyy HH:mm")
    }
    return String(value)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-4 w-4" />
          Debug Calculation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Payroll Calculation Debugger
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input Form */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleDebug} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Debug Data...
              </>
            ) : (
              <>
                <Bug className="mr-2 h-4 w-4" />
                Run Debug Analysis
              </>
            )}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Debug Results */}
          {debugData && (
            <ScrollArea className="h-[500px] rounded-lg border">
              <div className="p-4">
                {/* Diagnostics Section */}
                <div className="mb-6 rounded-lg bg-gray-50 border p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Diagnostics
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      {debugData.diagnostics.hasStoredProcResult ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Stored Procedure Result</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {debugData.diagnostics.hasAttendanceRecords ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Attendance Records</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {debugData.diagnostics.hasPayrollRules ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Payroll Rules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {debugData.diagnostics.hasApprovedAttendance ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Approved Attendance</span>
                    </div>
                  </div>
                  {debugData.diagnostics.warnings.length > 0 && (
                    <div className="space-y-1">
                      {debugData.diagnostics.warnings.map((warning: string, idx: number) => (
                        <div key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Tabs defaultValue="calculation" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="calculation">Calculation</TabsTrigger>
                    <TabsTrigger value="payslip">Payslip</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="raw">Raw Data</TabsTrigger>
                  </TabsList>

                  {/* Calculation Tab */}
                  <TabsContent value="calculation" className="space-y-4">
                    {debugData.storedProcedureCalculation ? (
                      <>
                        <div className="rounded-lg border p-4">
                          <h4 className="font-semibold mb-3">Base Rates</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Daily Rate:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.dailyRate)}</div>
                            <div>Hourly Rate:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.hourlyRate)}</div>
                          </div>
                        </div>

                        <div className="rounded-lg border p-4">
                          <h4 className="font-semibold mb-3">Attendance Metrics</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Days Worked:</div>
                            <div className="font-mono">{renderValue(debugData.storedProcedureCalculation.formatted.daysWorked)}</div>
                            <div>Hours Worked:</div>
                            <div className="font-mono">{renderValue(debugData.storedProcedureCalculation.formatted.hoursWorked)}</div>
                            <div>Overtime Hours:</div>
                            <div className="font-mono">{renderValue(debugData.storedProcedureCalculation.formatted.overtimeHours)}</div>
                            <div>Late Hours:</div>
                            <div className="font-mono text-red-600">{renderValue(debugData.storedProcedureCalculation.formatted.lateHours)}</div>
                            <div>Holiday Hours:</div>
                            <div className="font-mono text-green-600">{renderValue(debugData.storedProcedureCalculation.formatted.holidayHours)}</div>
                          </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-green-50">
                          <h4 className="font-semibold mb-3 text-green-800">Earnings</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Regular Pay:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.regularPay)}</div>
                            <div>Overtime Pay:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.overtimePay)}</div>
                            <div>Holiday Pay:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.holidayPay)}</div>
                            <div>Allowances:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.allowances)}</div>
                            <div>Bonuses:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.bonuses)}</div>
                            <div className="font-semibold pt-2 border-t">Gross Pay:</div>
                            <div className="font-mono font-semibold pt-2 border-t">₱{renderValue(debugData.storedProcedureCalculation.formatted.grossPay)}</div>
                          </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-red-50">
                          <h4 className="font-semibold mb-3 text-red-800">Deductions</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>GSIS:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.gsisContribution)}</div>
                            <div>PhilHealth:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.philHealthContribution)}</div>
                            <div>Pag-IBIG:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.pagibigContribution)}</div>
                            <div>Withholding Tax:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.withholdingTax)}</div>
                            <div>Late Deductions:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.lateDeductions)}</div>
                            <div>Loan Deductions:</div>
                            <div className="font-mono">₱{renderValue(debugData.storedProcedureCalculation.formatted.loanDeductions)}</div>
                            <div className="font-semibold pt-2 border-t">Total Deductions:</div>
                            <div className="font-mono font-semibold pt-2 border-t">₱{renderValue(debugData.storedProcedureCalculation.formatted.totalDeductions)}</div>
                          </div>
                        </div>

                        <div className="rounded-lg border-2 border-blue-500 p-4 bg-blue-50">
                          <h4 className="font-semibold mb-3 text-blue-800 text-lg">Net Pay</h4>
                          <div className="text-3xl font-bold text-blue-900 font-mono">
                            ₱{renderValue(debugData.storedProcedureCalculation.formatted.netPay)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No calculation result available
                      </div>
                    )}
                  </TabsContent>

                  {/* Payslip Preview Tab */}
                  <TabsContent value="payslip" className="space-y-4">
                    {debugData.payslipPreview ? (
                      <>
                        <div className="rounded-lg border-2 border-bisu-purple-deep p-6 bg-white shadow-lg">
                          <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-bisu-purple-deep">PAYSLIP</h2>
                            <p className="text-sm text-gray-600">BISU Payroll System</p>
                          </div>

                          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
                            <div>
                              <h3 className="font-semibold mb-3 text-bisu-purple-deep">Employee Information</h3>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-600">Name:</span> <span className="font-medium">{debugData.payslipPreview.employee.name}</span></div>
                                <div><span className="text-gray-600">Employee ID:</span> <span className="font-medium">{debugData.payslipPreview.employee.employeeId || 'N/A'}</span></div>
                                <div><span className="text-gray-600">Department:</span> <span className="font-medium">{debugData.payslipPreview.employee.department || 'N/A'}</span></div>
                                <div><span className="text-gray-600">Position:</span> <span className="font-medium">{debugData.payslipPreview.employee.position || 'N/A'}</span></div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-3 text-bisu-purple-deep">Pay Period</h3>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-600">Period:</span> <span className="font-medium">{debugData.payslipPreview.payPeriodStart} - {debugData.payslipPreview.payPeriodEnd}</span></div>
                                <div><span className="text-gray-600">Generated:</span> <span className="font-medium">{debugData.payslipPreview.generatedAt}</span></div>
                                <div><span className="text-gray-600">Reference:</span> <span className="font-mono text-xs">{debugData.payslipPreview.payrollRecordId}</span></div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="rounded-lg bg-green-50 p-4">
                              <h3 className="font-semibold mb-3 text-green-800">Earnings</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Regular Pay:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.earningsBreakdown.regular)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Overtime Pay:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.earningsBreakdown.overtime)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Holiday Pay:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.earningsBreakdown.holiday)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Allowances:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.earningsBreakdown.allowances)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Bonuses:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.earningsBreakdown.bonuses)}</span>
                                </div>
                                {debugData.payslipPreview.earningsBreakdown.thirteenthMonth > 0 && (
                                  <div className="flex justify-between">
                                    <span>13th Month:</span>
                                    <span className="font-mono">₱{renderValue(debugData.payslipPreview.earningsBreakdown.thirteenthMonth)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-2 border-t font-semibold text-green-800">
                                  <span>Gross Pay:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.calculations.grossPay)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-lg bg-red-50 p-4">
                              <h3 className="font-semibold mb-3 text-red-800">Deductions</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>GSIS:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.deductionBreakdown.gsis)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>PhilHealth:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.deductionBreakdown.philHealth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pag-IBIG:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.deductionBreakdown.pagibig)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Withholding Tax:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.deductionBreakdown.withholdingTax)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Late Deductions:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.deductionBreakdown.late)}</span>
                                </div>
                                {debugData.payslipPreview.deductionBreakdown.loans > 0 && (
                                  <div className="flex justify-between">
                                    <span>Loan Deductions:</span>
                                    <span className="font-mono">₱{renderValue(debugData.payslipPreview.deductionBreakdown.loans)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-2 border-t font-semibold text-red-800">
                                  <span>Total Deductions:</span>
                                  <span className="font-mono">₱{renderValue(debugData.payslipPreview.calculations.totalDeductions)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-blue-100 border-2 border-blue-500 p-6 text-center">
                            <div className="text-sm text-blue-800 mb-2">NET PAY</div>
                            <div className="text-4xl font-bold text-blue-900 font-mono">
                              ₱{renderValue(debugData.payslipPreview.calculations.netPay)}
                            </div>
                          </div>

                          <div className="mt-6 pt-6 border-t">
                            <h3 className="font-semibold mb-3 text-bisu-purple-deep">Attendance Summary</h3>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="text-center p-3 rounded bg-gray-50">
                                <div className="text-2xl font-bold text-gray-700">{debugData.payslipPreview.attendanceSummary.daysWorked}</div>
                                <div className="text-xs text-gray-600">Days Worked</div>
                              </div>
                              <div className="text-center p-3 rounded bg-gray-50">
                                <div className="text-2xl font-bold text-gray-700">{renderValue(debugData.payslipPreview.attendanceSummary.hoursWorked)}</div>
                                <div className="text-xs text-gray-600">Hours Worked</div>
                              </div>
                              <div className="text-center p-3 rounded bg-gray-50">
                                <div className="text-2xl font-bold text-gray-700">{renderValue(debugData.payslipPreview.attendanceSummary.overtimeHours)}</div>
                                <div className="text-xs text-gray-600">Overtime Hours</div>
                              </div>
                              <div className="text-center p-3 rounded bg-gray-50">
                                <div className="text-2xl font-bold text-gray-700">{renderValue(debugData.payslipPreview.attendanceSummary.lateHours)}</div>
                                <div className="text-xs text-gray-600">Late Hours</div>
                              </div>
                            </div>
                          </div>

                          {debugData.payslipPreview.notes && debugData.payslipPreview.notes.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                              <h3 className="font-semibold mb-3 text-gray-700">Notes</h3>
                              <ul className="space-y-1 text-sm">
                                {debugData.payslipPreview.notes.map((note: string, idx: number) => (
                                  <li key={idx} className="text-gray-600">{note}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 text-center">
                          This is a preview for debugging purposes. Actual payslip may differ based on finalized data.
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No payslip data available
                      </div>
                    )}
                  </TabsContent>

                  {/* Attendance Tab */}
                  <TabsContent value="attendance" className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold mb-3">Summary</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>Total Days: {debugData.attendance.summary.totalDays}</div>
                        <div>Approved: {debugData.attendance.summary.approvedDays}</div>
                        <div>Pending: {debugData.attendance.summary.pendingDays}</div>
                        <div>Total Hours: {renderValue(debugData.attendance.summary.totalHours)}</div>
                        <div>Overtime: {renderValue(debugData.attendance.summary.totalOvertimeHours)}</div>
                        <div>Holidays: {debugData.attendance.summary.holidayCount}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {debugData.attendance.records.map((record: any, idx: number) => (
                        <div key={idx} className="rounded border p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{format(new Date(record.date), "MMM dd, yyyy")}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              record.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              record.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <div>Hours: {renderValue(record.hoursWorked)}</div>
                            <div>Overtime: {renderValue(record.overtimeHours)}</div>
                            <div>Late: {renderValue(record.lateMinutes)} min</div>
                            {record.isHoliday && <div className="text-green-600">Holiday: {record.holidayType}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Rules Tab */}
                  <TabsContent value="rules" className="space-y-4">
                    {/* Global Rules */}
                    {debugData.payrollRules?.globalRules && debugData.payrollRules.globalRules.length > 0 && (
                      <div className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-3 text-bisu-purple-deep">Global Rules (Apply to All)</h4>
                        <div className="space-y-2">
                          {debugData.payrollRules.globalRules.map((rule: any) => (
                            <div key={rule.id} className="flex items-center justify-between text-sm border-b pb-2">
                              <div>
                                <div className="font-medium">{rule.name}</div>
                                <div className="text-xs text-gray-500">
                                  Type: {rule.type} • {rule.isPercentage ? `${rule.amount}%` : `₱${renderValue(rule.amount)}`}
                                </div>
                                {rule.description && <div className="text-xs text-gray-400 mt-1">{rule.description}</div>}
                              </div>
                              <div className="font-mono font-semibold">₱{renderValue(rule.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User-Specific Rules */}
                    {debugData.payrollRules?.userSpecificRules && debugData.payrollRules.userSpecificRules.length > 0 && (
                      <div className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-3 text-bisu-purple-deep">User-Specific Rules</h4>
                        <div className="space-y-2">
                          {debugData.payrollRules.userSpecificRules.map((rule: any) => (
                            <div key={rule.id} className="flex items-center justify-between text-sm border-b pb-2">
                              <div>
                                <div className="font-medium">{rule.name}</div>
                                <div className="text-xs text-gray-500">
                                  Type: {rule.type} • {rule.isPercentage ? `${rule.amount}%` : `₱${renderValue(rule.amount)}`}
                                </div>
                                {rule.description && <div className="text-xs text-gray-400 mt-1">{rule.description}</div>}
                              </div>
                              <div className="font-mono font-semibold">₱{renderValue(rule.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User Payroll Roles */}
                    {debugData.payrollRules?.userPayrollRoles && debugData.payrollRules.userPayrollRoles.length > 0 && (
                      <div className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-3 text-bisu-purple-deep">Payroll Roles</h4>
                        <div className="space-y-2">
                          {debugData.payrollRules.userPayrollRoles.map((role: any) => (
                            <div key={role.id} className="flex items-center justify-between text-sm border-b pb-2">
                              <div>
                                <div className="font-medium">{role.name}</div>
                                <div className="text-xs text-gray-500">
                                  {role.department && `${role.department} • `}
                                  {role.position && `${role.position} • `}
                                  {role.isActive ? 'Active' : 'Inactive'}
                                </div>
                              </div>
                              {role.dailyRate && (
                                <div className="font-mono font-semibold">₱{renderValue(role.dailyRate)}/day</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {debugData.payrollRules?.summary && (
                      <div className="rounded-lg bg-gray-50 p-4">
                        <h4 className="font-semibold mb-3 text-gray-700">Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm text-center">
                          <div>
                            <div className="text-2xl font-bold text-bisu-purple-deep">{debugData.payrollRules.summary.totalGlobalRules || 0}</div>
                            <div className="text-xs text-gray-600">Global Rules</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-bisu-purple-deep">{debugData.payrollRules.summary.totalUserRules || 0}</div>
                            <div className="text-xs text-gray-600">User Rules</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-bisu-purple-deep">{debugData.payrollRules.summary.totalPayrollRoles || 0}</div>
                            <div className="text-xs text-gray-600">Payroll Roles</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No Rules Message */}
                    {(!debugData.payrollRules?.globalRules || debugData.payrollRules.globalRules.length === 0) &&
                     (!debugData.payrollRules?.userSpecificRules || debugData.payrollRules.userSpecificRules.length === 0) &&
                     (!debugData.payrollRules?.userPayrollRoles || debugData.payrollRules.userPayrollRoles.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        No payroll rules or roles found
                      </div>
                    )}
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold mb-3">Rates</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(debugData.systemSettings.parsed.rates).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b pb-1">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h4 className="font-semibold mb-3">Working Hours</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(debugData.systemSettings.parsed.workingHours).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b pb-1">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Raw Data Tab */}
                  <TabsContent value="raw">
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
