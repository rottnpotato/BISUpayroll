"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

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

export default function EmployeePayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const fetchPayrollRecords = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employee/payroll')
      
      if (!response.ok) throw new Error('Failed to fetch payroll records')
      
      const data = await response.json()
      setPayrollRecords(data.payrollRecords || [])
    } catch (error) {
      console.error('Error fetching payroll records:', error)
      toast.error('Failed to load payroll records')
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
    fetchPayrollRecords()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">My Payroll</h1>
          <p className="text-muted-foreground">View and manage your payroll records</p>
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

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">My Payroll</h1>
        <p className="text-muted-foreground">
          View your payroll records and payment details.
        </p>
      </div>

      {payrollRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Records</h3>
            <p className="text-gray-500 text-center">
              You don't have any payroll records yet. Your payroll will appear here once it's generated.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {payrollRecords.map((record, index) => {
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
                    {/* Payroll Details */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Earnings Section */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Earnings
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex justify-between">
                            <span className="text-sm">Base Salary:</span>
                            <span className="font-medium">{formatCurrency(record.baseSalary)}</span>
                          </div>
                          {record.overtime > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm">Overtime:</span>
                              <span className="font-medium text-green-600">{formatCurrency(record.overtime)}</span>
                            </div>
                          )}
                          {record.bonuses > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm">Bonuses:</span>
                              <span className="font-medium text-green-600">{formatCurrency(record.bonuses)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Gross Pay:</span>
                            <span className="text-green-600">{formatCurrency(record.grossPay)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions & Net Pay Section */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-bisu-purple-deep">Deductions & Net Pay</h4>
                        <div className="space-y-2 pl-6">
                          {record.deductions > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm">Total Deductions:</span>
                              <span className="font-medium text-red-600">-{formatCurrency(record.deductions)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Net Pay:</span>
                            <span className="text-bisu-purple-deep">{formatCurrency(record.netPay)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="mt-6 pt-4 border-t">
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
    </motion.div>
  )
} 