"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  PenTool,
  RefreshCw
} from "lucide-react"
import { PayrollRule, PayrollSchedule, WorkingHoursConfig, RatesConfig, LeaveBenefitsConfig } from '../types'
import { toast } from "sonner"

interface PayrollOverviewProps {
  rules: PayrollRule[]
  schedules: PayrollSchedule[]
  workingHoursConfig: WorkingHoursConfig
  ratesConfig: RatesConfig
  leaveBenefitsConfig: LeaveBenefitsConfig
}

interface PayrollSummary {
  totalEmployees: number
  activeRules: number
  activeSchedules: number
  monthlyPayrollTotal: number
  unpaidPayrolls: number
  generatedPayrolls: number
  paidPayrolls: number
  upcomingPayDate: string | null
}

interface RecentPayroll {
  id: string
  user: {
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
  }
  payPeriodStart: string
  payPeriodEnd: string
  grossPay: number
  netPay: number
  isPaid: boolean
  generatedAt: string | null
  paidAt: string | null
}

export function PayrollOverview({
  rules,
  schedules,
  workingHoursConfig,
  ratesConfig,
  leaveBenefitsConfig
}: PayrollOverviewProps) {
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({
    totalEmployees: 0,
    activeRules: 0,
    activeSchedules: 0,
    monthlyPayrollTotal: 0,
    unpaidPayrolls: 0,
    generatedPayrolls: 0,
    paidPayrolls: 0,
    upcomingPayDate: null
  })
  const [recentPayrolls, setRecentPayrolls] = useState<RecentPayroll[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPayrollOverview = async () => {
    try {
      setIsLoading(true)
      
      // Always show basic data from props first
      const basicSummary = {
        totalEmployees: 0,
        activeRules: rules.filter(r => r.isActive).length,
        activeSchedules: schedules.filter(s => s.isActive).length,
        monthlyPayrollTotal: 0,
        unpaidPayrolls: 0,
        generatedPayrolls: 0,
        paidPayrolls: 0,
        upcomingPayDate: getUpcomingPayDate()
      }
      
      setPayrollSummary(basicSummary)

      // Try to fetch additional data
      try {
        const [summaryResponse, payrollsResponse] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/payroll?limit=10')
        ])

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          
          setPayrollSummary(prev => ({
            ...prev,
            totalEmployees: summaryData.totalEmployees || summaryData.overview?.totalEmployees || 0,
            monthlyPayrollTotal: summaryData.monthlyPayrollTotal || 0,
            unpaidPayrolls: summaryData.unpaidPayrolls || 0,
            generatedPayrolls: summaryData.generatedPayrolls || 0,
            paidPayrolls: summaryData.paidPayrolls || 0
          }))
        }

        if (payrollsResponse.ok) {
          const payrollsData = await payrollsResponse.json()
          setRecentPayrolls(payrollsData.records || [])
        }
      } catch (apiError) {
        console.warn('API fetch failed, using fallback data:', apiError)
        // Keep the basic summary that was already set
      }
      
    } catch (error) {
      console.error('Error in payroll overview:', error)
      toast.error('Some data may not be up to date')
      
      // Ensure we always have some data to display
      setPayrollSummary({
        totalEmployees: 0,
        activeRules: rules.filter(r => r.isActive).length,
        activeSchedules: schedules.filter(s => s.isActive).length,
        monthlyPayrollTotal: 0,
        unpaidPayrolls: 0,
        generatedPayrolls: 0,
        paidPayrolls: 0,
        upcomingPayDate: getUpcomingPayDate()
      })
      setRecentPayrolls([])
    } finally {
      setIsLoading(false)
    }
  }

  const getUpcomingPayDate = () => {
    const activeSchedule = schedules.find(s => s.isActive)
    if (!activeSchedule || !activeSchedule.payrollReleaseDay) return null

    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    let nextPayDate = new Date(currentYear, currentMonth, activeSchedule.payrollReleaseDay)
    
    if (nextPayDate <= today) {
      nextPayDate = new Date(currentYear, currentMonth + 1, activeSchedule.payrollReleaseDay)
    }
    
    return nextPayDate.toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPayrollStatus = (payroll: RecentPayroll) => {
    if (payroll.isPaid) return { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    return { label: 'Awaiting Payment', color: 'bg-orange-100 text-orange-800', icon: Clock }
  }

  useEffect(() => {
    fetchPayrollOverview()
  }, [rules, schedules])

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
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
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-bisu-purple-deep">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-bisu-purple-medium" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-bisu-yellow-DEFAULT">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-bisu-yellow-dark" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bisu-purple-deep">{formatCurrency(payrollSummary.monthlyPayrollTotal)}</div>
              <p className="text-xs text-muted-foreground">Estimated total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Payrolls</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.unpaidPayrolls}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment processing</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Pay Date</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bisu-purple-deep">
                {payrollSummary.upcomingPayDate || 'Not Set'}
              </div>
              <p className="text-xs text-muted-foreground">Scheduled generation</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Configuration Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="h-[280px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <BarChart3 className="h-5 w-5" />
                Active Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.activeRules}</span>
                <span className="text-sm text-muted-foreground">of {rules.length} total</span>
              </div>
              <div className="flex-1 space-y-2 min-h-[140px]">
                {rules.length > 0 ? (
                  rules.slice(0, 3).map((rule) => (
                    <div key={rule.id} className="flex justify-between items-center text-sm py-2">
                      <span className="truncate flex-1 mr-2">{rule.name}</span>
                      <Badge variant={rule.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
                    No payroll rules configured
                  </div>
                )}
                {rules.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{rules.length - 3} more rules
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="h-[280px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <Clock className="h-5 w-5" />
                Schedule Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.activeSchedules}</span>
                <span className="text-sm text-muted-foreground">of {schedules.length} total</span>
              </div>
              <div className="flex-1 space-y-3 min-h-[140px]">
                {schedules.length > 0 ? (
                  schedules.slice(0, 2).map((schedule) => (
                    <div key={schedule.id} className="flex justify-between items-start py-2">
                      <div className="flex-1 mr-2">
                        <div className="font-medium text-sm">{schedule.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {schedule.cutoffType || 'Bi-monthly'}
                        </div>
                      </div>
                      <Badge variant={schedule.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
                    No schedules configured
                  </div>
                )}
                {schedules.length > 2 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{schedules.length - 2} more schedules
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="h-[280px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <TrendingUp className="h-5 w-5" />
                Payroll Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.generatedPayrolls}</span>
                <span className="text-sm text-muted-foreground">total records</span>
              </div>
              <div className="flex-1 space-y-3 min-h-[140px]">
                <div className="flex justify-between py-1">
                  <span className="text-sm">Generated:</span>
                  <span className="font-medium">{payrollSummary.generatedPayrolls}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm">Paid:</span>
                  <span className="font-medium text-green-600">{payrollSummary.paidPayrolls}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm">Unpaid:</span>
                  <span className="font-medium text-orange-600">{payrollSummary.unpaidPayrolls}</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-medium py-1">
                  <span className="text-sm">Avg. Daily Rate:</span>
                  <span className="text-sm">{formatCurrency(workingHoursConfig.dailyHours * 500)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Payrolls */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <DollarSign className="h-5 w-5" />
                Recent Payroll Records
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPayrollOverview}
                className="text-bisu-purple-deep border-bisu-purple-medium hover:bg-bisu-purple-light"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPayrolls.length > 0 ? (
              <div className="space-y-3">
                {recentPayrolls.map((payroll) => {
                  const status = getPayrollStatus(payroll)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={payroll.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">
                            {payroll.user.firstName} {payroll.user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payroll.user.employeeId} • {payroll.user.department}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(payroll.payPeriodStart)} - {formatDate(payroll.payPeriodEnd)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(payroll.netPay)}</div>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Payroll Records</h3>
                <p className="text-gray-500 text-center">
                  Payroll records will appear here once they are generated.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
