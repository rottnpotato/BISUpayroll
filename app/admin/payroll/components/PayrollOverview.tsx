"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  Calculator, 
  Clock, 
  Settings, 
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { PayrollRule, PayrollSchedule, WorkingHoursConfig, RatesConfig, LeaveBenefitsConfig } from "../types"

interface PayrollOverviewProps {
  rules: PayrollRule[]
  schedules: PayrollSchedule[]
  workingHoursConfig: WorkingHoursConfig
  ratesConfig: RatesConfig
  leaveBenefitsConfig: LeaveBenefitsConfig
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

export function PayrollOverview({
  rules,
  schedules,
  workingHoursConfig,
  ratesConfig,
  leaveBenefitsConfig
}: PayrollOverviewProps) {
  const activeRules = rules.filter(rule => rule.isActive)
  const activeSchedules = schedules.filter(schedule => schedule.isActive)
  
  const formatCurrency = (amount: number) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(0)}%`

  return (
    <motion.div 
      className="space-y-6 mb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-bisu-purple-deep">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold text-bisu-purple-deep">{activeRules.length}</p>
                </div>
                <Calculator className="h-8 w-8 text-bisu-purple-medium" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-bisu-yellow-DEFAULT">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Schedules</p>
                  <p className="text-2xl font-bold text-bisu-yellow-dark">{activeSchedules.length}</p>
                </div>
                <Clock className="h-8 w-8 text-bisu-yellow-DEFAULT" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Daily Hours</p>
                  <p className="text-2xl font-bold text-green-600">{workingHoursConfig.dailyHours}h</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Night Shift</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {workingHoursConfig.nightShiftEnabled ? 'On' : 'Off'}
                  </p>
                </div>
                {workingHoursConfig.nightShiftEnabled ? 
                  <CheckCircle className="h-8 w-8 text-green-500" /> :
                  <AlertCircle className="h-8 w-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Payroll Rules */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
              <Calculator className="h-5 w-5" />
              Active Payroll Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRules.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active payroll rules configured</p>
            ) : (
              <div className="space-y-3">
                {activeRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant={rule.type === 'allowance' ? 'default' : 'destructive'}>
                          {rule.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rule.description || 'No description'}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-bisu-purple-medium" />
                          <span className="text-xs text-muted-foreground">Applies to:</span>
                        </div>
                        {rule.applyToAll ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            All Employees
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {rule.assignedUsers?.length || 0} Specific Employee{(rule.assignedUsers?.length || 0) !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {!rule.applyToAll && rule.assignedUsers && rule.assignedUsers.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ({rule.assignedUsers.slice(0, 2).map(assignment => 
                              `${assignment.user.firstName} ${assignment.user.lastName}`
                            ).join(', ')}
                            {rule.assignedUsers.length > 2 && ` +${rule.assignedUsers.length - 2} more`})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="font-medium text-bisu-purple-deep">
                        {rule.isPercentage ? 
                          formatPercentage(rule.amount) : 
                          formatCurrency(rule.amount)
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Schedules */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
              <Calendar className="h-5 w-5" />
              Active Payroll Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSchedules.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active payroll schedules configured</p>
            ) : (
              <div className="space-y-3">
                {activeSchedules.map((schedule) => (
                  <div key={schedule.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{schedule.name}</h4>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Release Day:</span> {schedule.payrollReleaseDay || 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Processing Time:</span> {schedule.processHour}:{schedule.processMinute.toString().padStart(2, '0')}
                      </div>
                      <div>
                        <span className="font-medium">Cutoff Type:</span> {schedule.cutoffType || 'Bi-monthly'}
                      </div>
                      <div>
                        <span className="font-medium">Cutoff Days:</span> {schedule.cutoffDays?.join(', ') || 'Not set'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Configuration Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <Clock className="h-5 w-5" />
                Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Daily Hours:</span>
                <span className="font-medium">{workingHoursConfig.dailyHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Weekly Hours:</span>
                <span className="font-medium">{workingHoursConfig.weeklyHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Night Shift:</span>
                <Badge variant={workingHoursConfig.nightShiftEnabled ? "default" : "secondary"}>
                  {workingHoursConfig.nightShiftEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Late Grace:</span>
                <span className="font-medium">{workingHoursConfig.lateGraceMinutes} min</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <TrendingUp className="h-5 w-5" />
                Rate Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overtime 1.25x:</span>
                <span className="font-medium">{formatPercentage(ratesConfig.overtimeRate1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overtime 1.5x:</span>
                <span className="font-medium">{formatPercentage(ratesConfig.overtimeRate2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Night Differential:</span>
                <span className="font-medium">{formatPercentage(ratesConfig.nightDifferential / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Regular Holiday:</span>
                <span className="font-medium">{formatPercentage(ratesConfig.regularHolidayRate / 100)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <Users className="h-5 w-5" />
                Leave Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vacation Leave:</span>
                <span className="font-medium">{leaveBenefitsConfig.vacationLeave} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sick Leave:</span>
                <span className="font-medium">{leaveBenefitsConfig.sickLeave} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Service Incentive:</span>
                <span className="font-medium">{leaveBenefitsConfig.serviceIncentiveLeave} days</span>
              </div>
              {leaveBenefitsConfig.maternityLeave && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Maternity Leave:</span>
                  <span className="font-medium">{leaveBenefitsConfig.maternityLeave} days</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
