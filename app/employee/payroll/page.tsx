"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Calculator,
  TrendingUp,
  TrendingDown,
  User,
  Building,
  Briefcase
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { PayrollRulesBreakdown, ManualDeductionsCard, PastPayslipsCard } from "./components"

interface PayrollRecord {
  id: string
  payPeriodStart: string
  payPeriodEnd: string
  dailyRate: number
  overtime: number
  deductions: number
  bonuses: number
  grossPay: number
  netPay: number
  isPaid: boolean
  paidAt: string | null
  isGenerated: boolean
  generatedAt: string | null
  createdAt: string
}

interface PayrollRule {
  id: string
  name: string
  type: string
  amount: number
  isPercentage: boolean
  description: string | null
  calculatedAmount: number
}

interface DeductionDetail {
  name: string
  amount: number
  isPercentage?: boolean
  percentage?: number | null
  description?: string
}

interface DeductionBreakdown {
  government: {
    total: number
    details: DeductionDetail[]
  }
  loans: {
    total: number
    details: DeductionDetail[]
  }
  other: {
    total: number
    details: DeductionDetail[]
  }
}

interface EmployeeInfo {
  id: string
  name: string
  employeeId: string
  department: string
  position: string
  hireDate: string
}

interface CurrentMonthData {
  year: number
  month: number
  workingDays: number
  totalHoursWorked: number
  regularHours: number
  overtimeHours: number
  lateCount: number
  absentCount: number
  expectedDailyHours: number
  expectedTotalHours: number
}

interface PayrollCalculations {
  dailyRate: number
  hourlyRate: number
  basePay: number
  overtimePay: number
  bonuses: number
  governmentDeductions: number
  loanDeductions: number
  otherDeductions: number
  lateDeductions: number
  totalDeductions: number
  grossPay: number
  netPay: number
}

interface PayrollSummary {
  currentSalaryRate: number
  prospectedSalary: number
  ytdEarnings: number
  latesThisMonth: number
  absencesThisMonth: number
  hoursWorkedToday: number
}

interface DetailedPayrollData {
  employee: EmployeeInfo
  currentMonth: CurrentMonthData
  calculations: PayrollCalculations
  summary: PayrollSummary
  payrollHistory: PayrollRecord[]
  deductionBreakdown: DeductionBreakdown
  appliedRules: PayrollRule[]
}

export default function PayslipDetailsPage() {
  const [payrollData, setPayrollData] = useState<DetailedPayrollData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingCurrentPayslip, setIsGeneratingCurrentPayslip] = useState(false)
  const { user } = useAuth()

  const fetchPayrollData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employee/payroll')
      
      if (!response.ok) throw new Error('Failed to fetch payroll data')
      
      const result = await response.json()
      if (result.success) {
        setPayrollData(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch payroll data')
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error)
      toast.error('Failed to load payroll data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleGenerateCurrentPayslip = async () => {
    try {
      setIsGeneratingCurrentPayslip(true)
      toast.message('Generating current month payslip…')
      
      // Get current month date range
      const now = new Date()
      const payPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const payPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      
      // Use the new on-demand generation API
      const res = await fetch('/api/employee/payslip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payPeriodStart: payPeriodStart.toISOString(),
          payPeriodEnd: payPeriodEnd.toISOString(),
          format: 'pdf'
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate payslip')
      }
      
      const blob = await res.blob()
      const isPdf = blob.type === 'application/pdf'
      
      if (isPdf) {
        // Open PDF in new window for printing
        const objectUrl = URL.createObjectURL(blob)
        const printWindow = window.open(objectUrl, '_blank')
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
            }, 250)
          }
          toast.success('Payslip opened for printing')
        } else {
          // Fallback to download if popup blocked
          const a = document.createElement('a')
          a.href = objectUrl
          a.download = `Payslip_Current_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`
          document.body.appendChild(a)
          a.click()
          a.remove()
          toast.success('Payslip downloaded')
        }
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
      } else {
        // Fallback to download DOCX
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = `Payslip_Current_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.docx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        toast.success('Payslip downloaded')
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Error generating current payslip')
    } finally {
      setIsGeneratingCurrentPayslip(false)
    }
  }

  useEffect(() => {
    fetchPayrollData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
        <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">Payslip Details</h1>
        <p className="text-muted-foreground">View your payroll details, applied rules, and history</p>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!payrollData) {
    return (
      <div className="space-y-6">
        <div>
        <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">Payslip Details</h1>
        <p className="text-muted-foreground">View your payroll details, applied rules, and history</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Data Available</h3>
            <p className="text-gray-500 text-center">
              Unable to load your payroll information. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">Payslip Details</h1>
        <p className="text-muted-foreground">View your current payroll calculations and generate payslips for any period</p>
      </div>

      {/* Employee Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
            <User className="h-5 w-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{payrollData.employee.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{payrollData.employee.position || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{payrollData.employee.department || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{payrollData.employee.employeeId || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Daily Rate</p>
                <p className="font-medium">{formatCurrency(payrollData.calculations.dailyRate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Hire Date</p>
                <p className="font-medium">{formatDate(payrollData.employee.hireDate)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Current Payroll
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Payroll Calculations
          </TabsTrigger>
          <TabsTrigger value="deductions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            My Deductions
          </TabsTrigger>
          <TabsTrigger value="payslips" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Past Payslips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Current Month Summary */}
          <Card className="border-bisu-purple-light bg-bisu-purple-extralight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <TrendingUp className="h-5 w-5" />
                Current Period Summary - {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-5">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-bisu-purple-light bg-white">
                  <div className="h-10 w-10 rounded-full bg-bisu-purple-extralight text-bisu-purple-deep flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-bisu-purple-deep">{payrollData.currentMonth.workingDays}</p>
                    <p className="text-xs text-muted-foreground">Working Days</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-bisu-purple-light bg-white">
                  <div className="h-10 w-10 rounded-full bg-bisu-purple-extralight text-bisu-purple-deep flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-bisu-purple-deep">{payrollData.currentMonth.totalHoursWorked.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Hours Worked</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-bisu-purple-light bg-white">
                  <div className="h-10 w-10 rounded-full bg-bisu-purple-extralight text-bisu-purple-deep flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-bisu-purple-deep">{payrollData.currentMonth.overtimeHours.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Overtime Hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-bisu-purple-light bg-white">
                  <div className="h-10 w-10 rounded-full bg-bisu-purple-extralight text-bisu-purple-deep flex items-center justify-center">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-bisu-purple-deep">{payrollData.currentMonth.lateCount}</p>
                    <p className="text-xs text-muted-foreground">Late Count</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Payroll Calculation */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earnings */}
            <Card className="border-bisu-purple-light bg-bisu-purple-extralight">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                  <TrendingUp className="h-5 w-5" />
                  Current Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Pay:</span>
                  <span className="font-medium text-bisu-purple-deep">{formatCurrency(payrollData.calculations.basePay)}</span>
                </div>
                {payrollData.calculations.overtimePay > 0 && (
                  <div className="flex justify-between">
                    <span>Overtime Pay:</span>
                    <span className="font-medium text-bisu-purple-deep">{formatCurrency(payrollData.calculations.overtimePay)}</span>
                  </div>
                )}
                {payrollData.calculations.bonuses > 0 && (
                  <div className="flex justify-between">
                    <span>Bonuses & Allowances:</span>
                    <span className="font-medium text-bisu-purple-deep">{formatCurrency(payrollData.calculations.bonuses)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Gross Pay:</span>
                  <span className="text-bisu-purple-deep">{formatCurrency(payrollData.calculations.grossPay)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card className="border-bisu-purple-light bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                  <TrendingDown className="h-5 w-5" />
                  Current Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payrollData.calculations.governmentDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Government Contributions:</span>
                    <span className="font-medium text-bisu-purple-deep">{formatCurrency(payrollData.calculations.governmentDeductions)}</span>
                  </div>
                )}
                {payrollData.calculations.loanDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Loan Deductions:</span>
                    <span className="font-medium text-bisu-purple-deep">{formatCurrency(payrollData.calculations.loanDeductions)}</span>
                  </div>
                )}
                {payrollData.calculations.lateDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Late Deductions:</span>
                    <span className="font-medium text-bisu-purple-deep">{formatCurrency(payrollData.calculations.lateDeductions)}</span>
                  </div>
                )}
                {payrollData.calculations.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="font-medium text-bisu-purple-deep">{formatCurrency(payrollData.calculations.otherDeductions)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Deductions:</span>
                  <span className="text-bisu-purple-deep">{formatCurrency(payrollData.calculations.totalDeductions)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Pay */}
          <Card className="border-bisu-purple-deep bg-gradient-to-r from-bisu-purple-deep/10 to-blue-500/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground mb-2">Your Projected Net Pay</p>
                <p className="text-4xl font-bold text-bisu-purple-deep">{formatCurrency(payrollData.calculations.netPay)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on current month attendance and applicable payroll calculations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generate Current Payslip Button */}
          <Card className="border-bisu-purple-light">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-bisu-purple-deep mb-2">Download Current Payslip</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate and download your current month's payslip based on real-time attendance data.
                    No need to wait for payroll processing!
                  </p>
                </div>
                <Button
                  onClick={handleGenerateCurrentPayslip}
                  disabled={isGeneratingCurrentPayslip}
                  className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
                  size="lg"
                >
                  {isGeneratingCurrentPayslip ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                      Generating Payslip...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Current Payslip
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-md">
                  💡 <strong>Tip:</strong> You can also generate payslips for any past period using the "Past Payslips" tab
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <PayrollRulesBreakdown 
            appliedRules={payrollData.appliedRules}
            deductionBreakdown={payrollData.deductionBreakdown}
            calculations={payrollData.calculations}
          />
        </TabsContent>

        <TabsContent value="deductions">
          <ManualDeductionsCard onDeductionChange={fetchPayrollData} />
        </TabsContent>

        <TabsContent value="payslips" className="space-y-6">
          <PastPayslipsCard payrollHistory={payrollData.payrollHistory} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
} 