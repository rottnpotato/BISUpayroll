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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getGroupStatus = (group: PayrollGroup) => {
    switch (group.status) {
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'APPROVED':
        return { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
      case 'PROCESSING':
        return { label: 'Processing', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      default:
        return { label: 'Generated', color: 'bg-gray-100 text-gray-800', icon: FileText }
    }
  }

  const getFileStatus = (file: PayrollFile) => {
    switch (file.status) {
      case 'APPROVED':
        return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'ARCHIVED':
        return { label: 'Archived', color: 'bg-gray-100 text-gray-800', icon: Archive }
      default:
        return { label: 'Generated', color: 'bg-blue-100 text-blue-800', icon: FileText }
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
          <Card className="border-l-4 border-l-bisu-yellow">
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
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
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
          <Card className="flex flex-col h-full min-h-[280px]">
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
          <Card className="flex flex-col h-full min-h-[280px]">
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
          <Card className="flex flex-col h-full min-h-[280px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <FolderOpen className="h-5 w-5" />
                Payroll Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-bisu-purple-deep">{payrollSummary.generatedGroups}</span>
                <span className="text-sm text-muted-foreground">generated</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between py-1">
                  <span className="text-sm">Generated:</span>
                  <span className="font-medium">{payrollSummary.generatedGroups}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm">Completed:</span>
                  <span className="font-medium text-green-600">{payrollSummary.completedPayrolls}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm">Pending:</span>
                  <span className="font-medium text-orange-600">{payrollSummary.pendingApproval}</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-medium py-1">
                  <span className="text-sm">Total Files:</span>
                  <span className="text-sm">{payrollSummary.totalPayrollFiles}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Payroll Groups */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <FolderOpen className="h-5 w-5" />
                Recent Payroll Groups
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
            {payrollGroups.length > 0 ? (
              <div className="space-y-3">
                {payrollGroups.map((group) => {
                  const status = getGroupStatus(group)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={group.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">
                            {group.scheduleName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {group.employeeCount} employees • {group.departments.join(', ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(group.payPeriodStart)} - {formatDate(group.payPeriodEnd)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(group.totalNetPay)}</div>
                        <div className="text-xs text-muted-foreground">{group.fileCount} files</div>
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
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Groups</h3>
                <p className="text-gray-500 text-center">
                  Payroll groups will appear here once they are generated based on schedules.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Payroll Files */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <FileText className="h-5 w-5" />
                Recent Payroll Files
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
            {recentFiles.length > 0 ? (
              <div className="space-y-3">
                {recentFiles.map((file) => {
                  const status = getFileStatus(file)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-bisu-purple-medium" />
                        <div>
                          <div className="font-medium">
                            {file.fileName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {file.reportType} • {file.employeeCount} employees
                            {file.department && ` • ${file.department}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(file.generatedAt)} • {formatFileSize(file.fileSize)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(file.totalNetPay)}</div>
                        <div className="text-xs text-muted-foreground">
                          Downloads: {file.downloadCount}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Files</h3>
                <p className="text-gray-500 text-center">
                  Generated payroll files will appear here for safekeeping and backup.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
