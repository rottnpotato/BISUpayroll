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
  FileText,
  Download,
  RefreshCw,
  FolderOpen,
  Archive
} from "lucide-react"
import { PayrollRule, PayrollSchedule, WorkingHoursConfig, RatesConfig, LeaveBenefitsConfig, PayrollGroup, PayrollFile, PayrollOverviewSummary } from '../types'
import { toast } from "sonner"
import { OverviewHeader } from "./overview/OverviewHeader"
import { OverviewStats } from "./overview/OverviewStats"
import { RecentActivity } from "./overview/RecentActivity"

interface PayrollOverviewProps {
  rules: PayrollRule[]
  schedules: PayrollSchedule[]
  workingHoursConfig: WorkingHoursConfig
  ratesConfig: RatesConfig
  leaveBenefitsConfig: LeaveBenefitsConfig
}

export function PayrollOverview({
  rules,
  schedules,
  workingHoursConfig,
  ratesConfig,
  leaveBenefitsConfig
}: PayrollOverviewProps) {
  const [payrollSummary, setPayrollSummary] = useState<PayrollOverviewSummary>({
    totalEmployees: 0,
    activeRules: 0,
    activeSchedules: 0,
    monthlyPayrollTotal: 0,
    generatedGroups: 0,
    pendingApproval: 0,
    completedPayrolls: 0,
    upcomingPayDate: null,
    totalPayrollFiles: 0
  })
  const [payrollGroups, setPayrollGroups] = useState<PayrollGroup[]>([])
  const [recentFiles, setRecentFiles] = useState<PayrollFile[]>([])
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
        generatedGroups: 0,
        pendingApproval: 0,
        completedPayrolls: 0,
        upcomingPayDate: getUpcomingPayDate(),
        totalPayrollFiles: 0
      }
      
      setPayrollSummary(basicSummary)

      // Try to fetch additional data
      try {
        const [summaryResponse, groupsResponse, filesResponse] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/payroll/groups?limit=5'),
          fetch('/api/admin/payroll/files?limit=10')
        ])

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          
          setPayrollSummary(prev => ({
            ...prev,
            totalEmployees: summaryData.totalEmployees || summaryData.overview?.totalEmployees || 0,
            monthlyPayrollTotal: summaryData.monthlyPayrollTotal || 0,
            generatedGroups: summaryData.generatedGroups || 0,
            pendingApproval: summaryData.pendingApproval || 0,
            completedPayrolls: summaryData.completedPayrolls || 0,
            totalPayrollFiles: summaryData.totalPayrollFiles || 0
          }))
        }

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json()
          setPayrollGroups(groupsData.groups || [])
        }

        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setRecentFiles(filesData.files || [])
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
        generatedGroups: 0,
        pendingApproval: 0,
        completedPayrolls: 0,
        upcomingPayDate: getUpcomingPayDate(),
        totalPayrollFiles: 0
      })
      setPayrollGroups([])
      setRecentFiles([])
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

  // Removed unused date/status helpers after unifying activity lists

  const handleExpandActivity = async () => {
    try {
      const [groupsResponse, filesResponse] = await Promise.all([
        fetch('/api/admin/payroll/groups?limit=100'),
        fetch('/api/admin/payroll/files?limit=100')
      ])
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setPayrollGroups(groupsData.groups || [])
      }
      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        setRecentFiles(filesData.files || [])
      }
    } catch (e) {
      console.warn('Failed to expand recent activity', e)
    }
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
      <div className="space-y-6">
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
        <Card className="animate-pulse">
          <CardContent className="p-10">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
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
      {/* Header */}
      <OverviewHeader summary={payrollSummary} onRefresh={fetchPayrollOverview} />

      {/* Stats */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <OverviewStats summary={payrollSummary} formatCurrency={formatCurrency} />
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <RecentActivity
              groups={payrollGroups}
              files={recentFiles}
              onRefresh={fetchPayrollOverview}
              onExpand={handleExpandActivity}
              initialLimit={8}
            />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                  <BarChart3 className="h-5 w-5" />
                  Active Calculations
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.activeRules}</span>
                  <span className="text-sm text-muted-foreground">of {rules.length} total</span>
                </div>
                <div className="flex-1 space-y-2">
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
                      No payroll calculations configured
                    </div>
                  )}
                  {rules.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      +{rules.length - 3} more items
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card className="flex flex-col h-full">
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
                <div className="flex-1 space-y-3">
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
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                  <FolderOpen className="h-5 w-5" />
                  Payroll Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm">Generated</span>
                  <span className="font-medium">{payrollSummary.generatedGroups}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm">Completed</span>
                  <span className="font-medium text-green-600">{payrollSummary.completedPayrolls}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm">Pending</span>
                  <span className="font-medium text-orange-600">{payrollSummary.pendingApproval}</span>
                </div>
                <div className="h-px w-full bg-gray-200 my-2" />
                <div className="flex justify-between py-1">
                  <span className="text-sm">Total Files</span>
                  <span className="text-sm">{payrollSummary.totalPayrollFiles}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
