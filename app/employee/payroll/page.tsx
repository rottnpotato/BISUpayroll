"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  Download,
  FileText,
  CreditCard,
  ChevronRight,
  Calendar,
  Clock,
  Wallet,
  BarChart4,
  CircleDollarSign,
  Printer
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface PayrollData {
  employee: {
    id: string
    name: string
    employeeId: string
    department: string
    position: string
    hireDate: string
    salary: number
  }
  currentMonth: {
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
  calculations: {
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
  summary: {
    currentSalaryRate: number
    prospectedSalary: number
    ytdEarnings: number
    latesThisMonth: number
    absencesThisMonth: number
    hoursWorkedToday: number
  }
  payrollHistory: Array<{
    id: string
    payPeriodStart: string
    payPeriodEnd: string
    grossPay: number
    deductions: number
    netPay: number
    isPaid: boolean
    paidAt: string | null
  }>
  deductionBreakdown: {
    government: {
      total: number
      details: Array<{
        name: string
        amount: number
        isPercentage: boolean
        percentage?: number
      }>
    }
    loans: {
      total: number
      details: Array<{
        name: string
        amount: number
        description?: string
      }>
    }
    other: {
      total: number
      details: Array<{
        name: string
        amount: number
        description?: string
      }>
    }
  }
  appliedRules: Array<{
    id: string
    name: string
    type: string
    amount: number
    isPercentage: boolean
    description?: string
    calculatedAmount: number
  }>
}

export default function EmployeePayroll() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null)

  useEffect(() => {
    fetchPayrollData()
  }, [])

  const fetchPayrollData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/employee/payroll")
      const result = await response.json()
      
      if (result.success) {
        setPayrollData(result.data)
      } else {
        toast.error(result.message || "Failed to load payroll data")
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error)
      toast.error("An error occurred while loading payroll data")
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCurrentPayPeriod = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    
    if (day <= 15) {
      return `${new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(year, month, 15).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${year}`
    } else {
      const lastDay = new Date(year, month + 1, 0).getDate()
      return `${new Date(year, month, 16).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(year, month, lastDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${year}`
    }
  }

  const getNextPayday = () => {
    const today = new Date()
    const day = today.getDate()
    
    if (day <= 15) {
      return new Date(today.getFullYear(), today.getMonth(), 20).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } else {
      return new Date(today.getFullYear(), today.getMonth() + 1, 5).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <div className="md:col-span-2 lg:col-span-4">
            <SkeletonCard hasHeader={true} lines={5} />
          </div>
        </motion.div>
      </div>
    )
  }

  if (!payrollData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Payroll Data Available</h2>
          <p className="text-gray-600">Unable to load your payroll information. Please try again later.</p>
          <Button onClick={fetchPayrollData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-bisu-purple-deep">Payroll Information</h1>
          <p className="text-gray-600">View your salary details, payment history, and download payslips</p>
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Page
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex mb-6 bg-bisu-purple-extralight">
          <TabsTrigger value="summary" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
            <DollarSign className="mr-2 h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="history" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
            <FileText className="mr-2 h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="deductions" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
            <CreditCard className="mr-2 h-4 w-4" />
            Deductions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <motion.div variants={itemVariants}>
                <Card className="border-l-4 border-l-bisu-yellow-DEFAULT shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <Wallet className="h-4 w-4 mr-2 text-bisu-yellow-DEFAULT" />
                      Monthly Salary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{formatCurrency(payrollData.summary.currentSalaryRate)}</div>
                    <p className="text-xs text-gray-500 mt-1">Based on position and tenure</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-l-4 border-l-bisu-purple-deep shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <CircleDollarSign className="h-4 w-4 mr-2 text-bisu-purple-deep" />
                      Expected Net Pay
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{formatCurrency(payrollData.calculations.netPay)}</div>
                    <p className="text-xs text-gray-500 mt-1">Based on current attendance</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-l-4 border-l-green-500 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <BarChart4 className="h-4 w-4 mr-2 text-green-500" />
                      YTD Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{formatCurrency(payrollData.summary.ytdEarnings)}</div>
                    <p className="text-xs text-gray-500 mt-1">Year to date total</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-l-4 border-l-blue-500 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      Next Payday
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{getNextPayday()}</div>
                    <p className="text-xs text-gray-500 mt-1">For {getCurrentPayPeriod()}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Current Payslip */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-bisu-purple-deep">Current Period Calculation</CardTitle>
                      <CardDescription className="text-gray-600">
                        Pay Period: {getCurrentPayPeriod()}
                      </CardDescription>
                    </div>
                    <Button className="bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Earnings */}
                    <div>
                      <h3 className="text-lg font-semibold text-bisu-purple-deep mb-4">Earnings</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Regular Hours ({payrollData.currentMonth.regularHours.toFixed(1)} hrs):</span>
                          <span className="font-semibold text-bisu-purple-deep">{formatCurrency(payrollData.calculations.basePay)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Overtime ({payrollData.currentMonth.overtimeHours.toFixed(1)} hrs):</span>
                          <span className="font-semibold text-bisu-purple-deep">{formatCurrency(payrollData.calculations.overtimePay)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Bonuses & Allowances:</span>
                          <span className="font-semibold text-bisu-purple-deep">{formatCurrency(payrollData.calculations.bonuses)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-bisu-purple-deep font-semibold">Gross Pay:</span>
                          <span className="font-bold text-bisu-purple-deep">{formatCurrency(payrollData.calculations.grossPay)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h3 className="text-lg font-semibold text-bisu-purple-deep mb-4">Deductions</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Government Contributions:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(payrollData.calculations.governmentDeductions)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Loans:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(payrollData.calculations.loanDeductions)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Late & Other Deductions:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(payrollData.calculations.otherDeductions + payrollData.calculations.lateDeductions)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-bisu-purple-deep font-semibold">Total Deductions:</span>
                          <span className="font-bold text-red-600">{formatCurrency(payrollData.calculations.totalDeductions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-bisu-purple-deep">Net Pay:</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(payrollData.calculations.netPay)}</span>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-bisu-purple-deep mb-3">Attendance Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-bisu-purple-deep">{payrollData.currentMonth.workingDays}</div>
                        <div className="text-gray-600">Days Worked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{payrollData.currentMonth.lateCount}</div>
                        <div className="text-gray-600">Late Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{payrollData.currentMonth.absentCount}</div>
                        <div className="text-gray-600">Absent Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{payrollData.currentMonth.totalHoursWorked.toFixed(1)}</div>
                        <div className="text-gray-600">Total Hours</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                  <CardTitle className="text-bisu-purple-deep flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Payroll History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-bisu-purple-deep">Period</TableHead>
                          <TableHead className="text-bisu-purple-deep">Gross Pay</TableHead>
                          <TableHead className="text-bisu-purple-deep">Deductions</TableHead>
                          <TableHead className="text-bisu-purple-deep">Net Pay</TableHead>
                          <TableHead className="text-bisu-purple-deep">Status</TableHead>
                          <TableHead className="text-bisu-purple-deep">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollData.payrollHistory.map((payroll) => (
                          <TableRow key={payroll.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <div className="font-medium">{formatDate(payroll.payPeriodStart)} - {formatDate(payroll.payPeriodEnd)}</div>
                                {payroll.paidAt && (
                                  <div className="text-sm text-gray-500">Paid: {formatDate(payroll.paidAt)}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(payroll.grossPay)}</TableCell>
                            <TableCell className="text-red-600">{formatCurrency(payroll.deductions)}</TableCell>
                            <TableCell className="text-green-600 font-medium">{formatCurrency(payroll.netPay)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                payroll.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payroll.isPaid ? 'Paid' : 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight">
                                <Download className="h-4 w-4 mr-1" /> PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {payrollData.payrollHistory.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No payroll history available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="shadow-md h-full">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                  <CardTitle className="text-bisu-purple-deep flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Government Contributions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {payrollData.deductionBreakdown.government.details.map((deduction, index) => (
                      <div key={index}>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">{deduction.name}</h3>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Employee Share:</span>
                          <span className="font-semibold text-bisu-purple-deep">{formatCurrency(deduction.amount)}</span>
                        </div>
                        {deduction.isPercentage && (
                          <div className="flex justify-between items-center pb-2">
                            <span className="text-gray-600">Rate:</span>
                            <span className="font-semibold text-bisu-purple-deep">{deduction.percentage}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-bisu-purple-deep">Total Government Deductions:</span>
                        <span className="font-bold text-bisu-purple-deep">{formatCurrency(payrollData.deductionBreakdown.government.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="shadow-md h-full">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                  <CardTitle className="text-bisu-purple-deep flex items-center">
                    <Wallet className="mr-2 h-5 w-5" />
                    Loans & Other Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {payrollData.deductionBreakdown.loans.details.length > 0 && (
                      <div>
                        <h3 className="text-md font-semibold text-bisu-purple-deep mb-3">Loan Deductions</h3>
                        {payrollData.deductionBreakdown.loans.details.map((loan, index) => (
                          <div key={index} className="mb-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-gray-600">{loan.name}:</span>
                              <span className="font-semibold text-bisu-purple-deep">{formatCurrency(loan.amount)}</span>
                            </div>
                            {loan.description && (
                              <p className="text-xs text-gray-500 mt-1">{loan.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {payrollData.deductionBreakdown.other.details.length > 0 && (
                      <div>
                        <h3 className="text-md font-semibold text-bisu-purple-deep mb-3">Other Deductions</h3>
                        {payrollData.deductionBreakdown.other.details.map((deduction, index) => (
                          <div key={index} className="mb-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-gray-600">{deduction.name}:</span>
                              <span className="font-semibold text-bisu-purple-deep">{formatCurrency(deduction.amount)}</span>
                            </div>
                            {deduction.description && (
                              <p className="text-xs text-gray-500 mt-1">{deduction.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-bisu-purple-deep">Total Other Deductions:</span>
                        <span className="font-bold text-bisu-purple-deep">{formatCurrency(payrollData.deductionBreakdown.loans.total + payrollData.deductionBreakdown.other.total)}</span>
                      </div>
                    </div>

                    {payrollData.deductionBreakdown.loans.details.length === 0 && payrollData.deductionBreakdown.other.details.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No loans or other deductions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 