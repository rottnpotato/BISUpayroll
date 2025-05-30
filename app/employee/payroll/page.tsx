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

// Mock payroll data
const payrollData = {
  currentRate: "₱1,200.00 / day",
  monthlyRate: "₱26,400.00",
  ytdEarnings: "₱211,200.00",
  payrollPeriod: "September 1-15, 2023",
  nextPayday: "September 20, 2023",
  deductions: {
    tax: "₱2,640.00",
    sss: "₱1,125.00",
    philhealth: "₱400.00",
    pagibig: "₱200.00",
    loans: "₱1,500.00",
    total: "₱5,865.00",
  },
  netPay: "₱20,535.00",
}

// Mock payslip history
const payslipHistory = [
  {
    id: "PS-2023-09-01",
    period: "September 1-15, 2023",
    datePaid: "September 20, 2023",
    grossPay: "₱26,400.00",
    deductions: "₱5,865.00",
    netPay: "₱20,535.00",
    status: "Paid",
  },
  {
    id: "PS-2023-08-16",
    period: "August 16-31, 2023",
    datePaid: "September 5, 2023",
    grossPay: "₱26,400.00",
    deductions: "₱5,865.00",
    netPay: "₱20,535.00",
    status: "Paid",
  },
  {
    id: "PS-2023-08-01",
    period: "August 1-15, 2023",
    datePaid: "August 20, 2023",
    grossPay: "₱26,400.00",
    deductions: "₱5,865.00",
    netPay: "₱20,535.00",
    status: "Paid",
  },
  {
    id: "PS-2023-07-16",
    period: "July 16-31, 2023",
    datePaid: "August 5, 2023",
    grossPay: "₱26,400.00",
    deductions: "₱5,865.00",
    netPay: "₱20,535.00",
    status: "Paid",
  },
]

export default function EmployeePayroll() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

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
          {isLoading ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SkeletonCard hasHeader={false} lines={2} />
              <SkeletonCard hasHeader={false} lines={2} />
              <SkeletonCard hasHeader={false} lines={2} />
              <SkeletonCard hasHeader={false} lines={2} />
              <div className="md:col-span-2 lg:col-span-4">
                <SkeletonCard hasHeader={true} lines={5} />
              </div>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-bisu-yellow-DEFAULT shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                        <Wallet className="h-4 w-4 mr-2 text-bisu-yellow-DEFAULT" />
                        Current Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-bisu-purple-deep">{payrollData.currentRate}</div>
                      <p className="text-xs text-gray-500 mt-1">Based on position and tenure</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-bisu-purple-deep shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                        <CircleDollarSign className="h-4 w-4 mr-2 text-bisu-purple-deep" />
                        Monthly Salary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-bisu-purple-deep">{payrollData.monthlyRate}</div>
                      <p className="text-xs text-gray-500 mt-1">Based on 22 working days</p>
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
                      <div className="text-2xl font-bold text-bisu-purple-deep">{payrollData.ytdEarnings}</div>
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
                      <div className="text-2xl font-bold text-bisu-purple-deep">{payrollData.nextPayday}</div>
                      <p className="text-xs text-gray-500 mt-1">For {payrollData.payrollPeriod}</p>
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
                        <CardTitle className="text-bisu-purple-deep">Current Payslip</CardTitle>
                        <CardDescription className="text-gray-600">
                          Pay Period: {payrollData.payrollPeriod}
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
                            <span className="text-gray-600">Basic Salary:</span>
                            <span className="font-semibold text-bisu-purple-deep">{payrollData.monthlyRate}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">Overtime:</span>
                            <span className="font-semibold text-bisu-purple-deep">₱0.00</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">Allowances:</span>
                            <span className="font-semibold text-bisu-purple-deep">₱0.00</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-bisu-purple-deep font-semibold">Gross Pay:</span>
                            <span className="font-bold text-bisu-purple-deep">{payrollData.monthlyRate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div>
                        <h3 className="text-lg font-semibold text-bisu-purple-deep mb-4">Deductions</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">Tax Withholding:</span>
                            <span className="font-semibold text-red-600">{payrollData.deductions.tax}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">SSS Contribution:</span>
                            <span className="font-semibold text-red-600">{payrollData.deductions.sss}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">PhilHealth:</span>
                            <span className="font-semibold text-red-600">{payrollData.deductions.philhealth}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">Pag-IBIG:</span>
                            <span className="font-semibold text-red-600">{payrollData.deductions.pagibig}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-600">Loans:</span>
                            <span className="font-semibold text-red-600">{payrollData.deductions.loans}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-bisu-purple-deep font-semibold">Total Deductions:</span>
                            <span className="font-bold text-red-600">{payrollData.deductions.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Pay */}
                    <div className="mt-8 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-bisu-purple-deep">Net Pay:</span>
                        <span className="text-xl font-bold text-green-600">{payrollData.netPay}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {isLoading ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-6">
              <SkeletonCard hasHeader={true} lines={10} />
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants}>
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Payslip History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-bisu-purple-deep">ID</TableHead>
                            <TableHead className="text-bisu-purple-deep">Pay Period</TableHead>
                            <TableHead className="text-bisu-purple-deep">Date Paid</TableHead>
                            <TableHead className="text-bisu-purple-deep">Gross Pay</TableHead>
                            <TableHead className="text-bisu-purple-deep">Deductions</TableHead>
                            <TableHead className="text-bisu-purple-deep">Net Pay</TableHead>
                            <TableHead className="text-bisu-purple-deep">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payslipHistory.map((payslip) => (
                            <TableRow key={payslip.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{payslip.id}</TableCell>
                              <TableCell>{payslip.period}</TableCell>
                              <TableCell>{payslip.datePaid}</TableCell>
                              <TableCell>{payslip.grossPay}</TableCell>
                              <TableCell className="text-red-600">{payslip.deductions}</TableCell>
                              <TableCell className="text-green-600 font-medium">{payslip.netPay}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" className="text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight">
                                  <Download className="h-4 w-4 mr-1" /> PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="deductions" className="space-y-6">
          {isLoading ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard hasHeader={true} lines={6} />
              <SkeletonCard hasHeader={true} lines={6} />
            </motion.div>
          ) : (
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
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">SSS Contribution</h3>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Employee Share:</span>
                          <span className="font-semibold text-bisu-purple-deep">{payrollData.deductions.sss}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Employer Share:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱2,415.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-600">Total Contribution:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱3,540.00</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">PhilHealth Contribution</h3>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Employee Share:</span>
                          <span className="font-semibold text-bisu-purple-deep">{payrollData.deductions.philhealth}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Employer Share:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱400.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-600">Total Contribution:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱800.00</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Pag-IBIG Contribution</h3>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Employee Share:</span>
                          <span className="font-semibold text-bisu-purple-deep">{payrollData.deductions.pagibig}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Employer Share:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱200.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-600">Total Contribution:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱400.00</span>
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
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">SSS Loan</h3>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Monthly Amortization:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱1,000.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Remaining Balance:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱11,000.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-600">Remaining Months:</span>
                          <span className="font-semibold text-bisu-purple-deep">11</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Pag-IBIG Loan</h3>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Monthly Amortization:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱500.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Remaining Balance:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱5,500.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-600">Remaining Months:</span>
                          <span className="font-semibold text-bisu-purple-deep">11</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Other Deductions</h3>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Union Dues:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱0.00</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-600">Health Insurance:</span>
                          <span className="font-semibold text-bisu-purple-deep">₱0.00</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 