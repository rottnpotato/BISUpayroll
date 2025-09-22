"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { PayrollRulesBreakdown } from "./components"

interface PayrollRecord {
  id: string
  payPeriodStart: string
  payPeriodEnd: string
  baseSalary: number
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

  const getPayrollStatus = (record: PayrollRecord) => {
    if (record.isPaid) return { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    if (record.isGenerated) return { label: 'Awaiting Payment', color: 'bg-orange-100 text-orange-800', icon: Clock }
    return { label: 'Processing', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
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
        <p className="text-muted-foreground">Your current payroll, rules, and payment history</p>
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
                <p className="text-sm text-muted-foreground">Base Salary</p>
                <p className="font-medium">{formatCurrency(payrollData.baseSalary)}</p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Current Payroll
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Payroll Rules
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Current Month Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <TrendingUp className="h-5 w-5" />
                Current Period Summary - {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{payrollData.currentMonth.workingDays}</p>
                  <p className="text-sm text-muted-foreground">Working Days</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{payrollData.currentMonth.totalHoursWorked.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Hours Worked</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50">
                  <p className="text-2xl font-bold text-orange-600">{payrollData.currentMonth.overtimeHours.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Overtime Hours</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{payrollData.currentMonth.lateCount}</p>
                  <p className="text-sm text-muted-foreground">Late Count</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Payroll Calculation */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earnings */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Current Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Pay:</span>
                  <span className="font-medium">{formatCurrency(payrollData.calculations.basePay)}</span>
                </div>
                {payrollData.calculations.overtimePay > 0 && (
                  <div className="flex justify-between">
                    <span>Overtime Pay:</span>
                    <span className="font-medium text-green-600">{formatCurrency(payrollData.calculations.overtimePay)}</span>
                  </div>
                )}
                {payrollData.calculations.bonuses > 0 && (
                  <div className="flex justify-between">
                    <span>Bonuses & Allowances:</span>
                    <span className="font-medium text-green-600">{formatCurrency(payrollData.calculations.bonuses)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Gross Pay:</span>
                  <span className="text-green-600">{formatCurrency(payrollData.calculations.grossPay)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <TrendingDown className="h-5 w-5" />
                  Current Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payrollData.calculations.governmentDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Government Contributions:</span>
                    <span className="font-medium">{formatCurrency(payrollData.calculations.governmentDeductions)}</span>
                  </div>
                )}
                {payrollData.calculations.loanDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Loan Deductions:</span>
                    <span className="font-medium">{formatCurrency(payrollData.calculations.loanDeductions)}</span>
                  </div>
                )}
                {payrollData.calculations.lateDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Late Deductions:</span>
                    <span className="font-medium">{formatCurrency(payrollData.calculations.lateDeductions)}</span>
                  </div>
                )}
                {payrollData.calculations.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="font-medium">{formatCurrency(payrollData.calculations.otherDeductions)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Deductions:</span>
                  <span className="text-red-600">{formatCurrency(payrollData.calculations.totalDeductions)}</span>
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
                  Based on current month attendance and applicable payroll rules
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

        <TabsContent value="history" className="space-y-6">
          {payrollData.payrollHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-500 text-center">
                  You don't have any payment history yet. Your payroll records will appear here once payments are processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payrollData.payrollHistory.map((record, index) => {
                const status = getPayrollStatus(record)
                const StatusIcon = status.icon
                
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                              <Calendar className="h-5 w-5" />
                              Pay Period: {formatDate(record.payPeriodStart)} - {formatDate(record.payPeriodEnd)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Generated on {record.generatedAt ? formatDate(record.generatedAt) : 'Pending'}
                            </p>
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center p-3 rounded-lg bg-green-50">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(record.grossPay)}</p>
                            <p className="text-sm text-muted-foreground">Gross Pay</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-red-50">
                            <p className="text-lg font-bold text-red-600">{formatCurrency(record.deductions)}</p>
                            <p className="text-sm text-muted-foreground">Deductions</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-blue-50">
                            <p className="text-lg font-bold text-bisu-purple-deep">{formatCurrency(record.netPay)}</p>
                            <p className="text-sm text-muted-foreground">Net Pay</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Payment Status:</span>
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <span className="font-medium">{status.label}</span>
                              {record.isPaid && record.paidAt && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  on {formatDate(record.paidAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
} 