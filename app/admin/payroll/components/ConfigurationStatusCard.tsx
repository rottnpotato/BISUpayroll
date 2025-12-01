"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  TrendingUp, 
  Briefcase, 
  PiggyBank, 
  Receipt,
  Users,
  Building2,
  User,
  Settings,
  CheckCircle2,
  XCircle
} from "lucide-react"
import Link from "next/link"
import {
  WorkingHoursConfig,
  RatesConfig,
  LeaveBenefitsConfig,
  ContributionsConfig,
  TaxBracketsConfig,
  ApplicationType
} from "../types"

interface ConfigurationStatusCardProps {
  workingHoursConfig: WorkingHoursConfig
  ratesConfig: RatesConfig
  leaveBenefitsConfig: LeaveBenefitsConfig
  contributionsConfig: ContributionsConfig
  taxBracketsConfig: TaxBracketsConfig
}

interface ConfigItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  scope: ApplicationType
  scopeTarget?: string
  values: { label: string; value: string | number }[]
}

export function ConfigurationStatusCard({
  workingHoursConfig,
  ratesConfig,
  leaveBenefitsConfig,
  contributionsConfig,
  taxBracketsConfig
}: ConfigurationStatusCardProps) {
  
  const getScopeIcon = (type: ApplicationType) => {
    switch (type) {
      case 'ALL': return <Users className="w-3 h-3" />
      case 'DEPARTMENT': return <Building2 className="w-3 h-3" />
      case 'INDIVIDUAL': return <User className="w-3 h-3" />
      case 'ROLE':
      case 'POSITION': return <Briefcase className="w-3 h-3" />
      default: return <Users className="w-3 h-3" />
    }
  }

  const getScopeBadge = (type: ApplicationType, targetName?: string) => {
    const label = type === 'ALL' ? 'All Employees' : 
                  type === 'DEPARTMENT' ? `Dept: ${targetName || 'N/A'}` :
                  type === 'INDIVIDUAL' ? `Employee: ${targetName || 'N/A'}` :
                  type === 'ROLE' ? `Role: ${targetName || 'N/A'}` :
                  type === 'POSITION' ? `Position: ${targetName || 'N/A'}` : 'Permanent Only'
    
    return (
      <Badge variant="outline" className="text-xs">
        <span className="mr-1">{getScopeIcon(type)}</span>
        {label}
      </Badge>
    )
  }

  const configurations: ConfigItem[] = [
    {
      title: "Working Hours",
      icon: Clock,
      isActive: workingHoursConfig.isActive !== false,
      scope: workingHoursConfig.applicationScope?.applicationType || 'ALL',
      scopeTarget: workingHoursConfig.applicationScope?.targetName,
      values: [
        { label: "Daily Hours", value: `${workingHoursConfig.dailyHours}h` },
        { label: "Weekly Hours", value: `${workingHoursConfig.weeklyHours}h` },
        { label: "Overtime Threshold", value: `${workingHoursConfig.overtimeThreshold}h` },
        { label: "Late Grace", value: `${workingHoursConfig.lateGraceMinutes} min` }
      ]
    },
    {
      title: "Pay Rates",
      icon: TrendingUp,
      isActive: ratesConfig.isActive !== false,
      scope: ratesConfig.applicationScope?.applicationType || 'ALL',
      scopeTarget: ratesConfig.applicationScope?.targetName,
      values: [
        { label: "OT Rate (First 2hrs)", value: `${ratesConfig.overtimeRate1}x` },
        { label: "OT Rate (Beyond 2hrs)", value: `${ratesConfig.overtimeRate2}x` },
        { label: "Regular Holiday", value: `${ratesConfig.regularHolidayRate}%` },
        { label: "Special Holiday", value: `${ratesConfig.specialHolidayRate}%` }
      ]
    },
    {
      title: "Leave Benefits",
      icon: Briefcase,
      isActive: leaveBenefitsConfig.isActive !== false,
      scope: leaveBenefitsConfig.applicationScope?.applicationType || 'ALL',
      scopeTarget: leaveBenefitsConfig.applicationScope?.targetName,
      values: [
        { label: "Vacation Leave", value: `${leaveBenefitsConfig.vacationLeave} days` },
        { label: "Sick Leave", value: `${leaveBenefitsConfig.sickLeave} days` },
        { label: "Service Incentive", value: `${leaveBenefitsConfig.serviceIncentiveLeave} days` },
        ...(leaveBenefitsConfig.maternityLeave ? [{ label: "Maternity", value: `${leaveBenefitsConfig.maternityLeave} days` }] : []),
        ...(leaveBenefitsConfig.paternityLeave ? [{ label: "Paternity", value: `${leaveBenefitsConfig.paternityLeave} days` }] : [])
      ]
    },
    {
      title: "Government Contributions",
      icon: PiggyBank,
      isActive: contributionsConfig.isActive !== false,
      scope: contributionsConfig.applicationScope?.applicationType || 'Permanent Only' as ApplicationType,
      scopeTarget: contributionsConfig.applicationScope?.targetName,
      values: [
        { label: "GSIS Employee", value: `${(contributionsConfig.gsis.employeeRate * 100).toFixed(2)}%` },
        { label: "PhilHealth Employee", value: `${(contributionsConfig.philHealth.employeeRate * 100).toFixed(2)}%` },
        { label: "Pag-IBIG Employee", value: `${(contributionsConfig.pagibig.employeeRate * 100).toFixed(2)}%` }
      ]
    },
    {
      title: "Tax Configuration",
      icon: Receipt,
      isActive: taxBracketsConfig.isActive !== false,
      scope: taxBracketsConfig.applicationScope?.applicationType || 'ALL',
      scopeTarget: taxBracketsConfig.applicationScope?.targetName,
      values: [
        { label: "Tax Brackets", value: `${taxBracketsConfig.brackets.length} configured` },
        { label: "Withholding", value: taxBracketsConfig.withholdingEnabled ? 'Enabled' : 'Disabled' },
        { label: "Auto Compute", value: taxBracketsConfig.autoComputeTax ? 'Yes' : 'No' }
      ]
    }
  ]

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-bisu-yellow" />
            <CardTitle className="text-bisu-yellow">Active Payroll Configurations</CardTitle>
          </div>
          <Link href="/admin/payroll/configuration">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Edit Configurations
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configurations.map((config) => {
            const Icon = config.icon
            return (
              <Card key={config.title} className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-bisu-purple-extralight rounded-lg">
                        <Icon className="h-4 w-4 text-bisu-purple-deep" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">{config.title}</h4>
                      </div>
                    </div>
                    {config.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="mt-2">
                    {getScopeBadge(config.scope, config.scopeTarget)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {config.values.map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-gray-600">{item.label}:</span>
                        <span className="font-medium text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Configurations marked as "Read Only" can only be viewed here. 
            To make changes, navigate to the Configuration page. Configurations with specific scopes 
            (Department, Individual, Role, Position) will override the "All Employees" configuration 
            based on priority settings.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
