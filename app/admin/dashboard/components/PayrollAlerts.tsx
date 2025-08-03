"use client"

import { FC } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FileX, 
  Shield, 
  TrendingUp,
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { DashboardData } from './types'
import { useRouter } from 'next/navigation'

interface PayrollAlertsProps {
  data: DashboardData | null
  isLoading: boolean
}

const PayrollAlerts: FC<PayrollAlertsProps> = ({ data, isLoading }) => {
  const router = useRouter()
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  const deadlineStatus = data?.payrollDetails?.deadlineStatus
  const upcomingDeadlines = data?.payrollDetails?.upcomingDeadlines || []
  const fileStatus = data?.payrollDetails?.fileStatus

  // Filter urgent upcoming deadlines
  const urgentDeadlines = upcomingDeadlines.filter(deadline => deadline.isUrgent)
  const normalDeadlines = upcomingDeadlines.filter(deadline => !deadline.isUrgent)

  const handleGeneratePayroll = () => {
    router.push('/admin/payroll')
  }

  return (
    <div className="space-y-4">
      {/* Missed Deadline Alert */}
      {deadlineStatus?.isMissed && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-800 font-semibold">
            Payroll Generation Overdue
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <div className="mt-2">
              <p>{deadlineStatus.message}</p>
              {deadlineStatus.daysOverdue && deadlineStatus.daysOverdue > 3 && (
                <p className="mt-1 text-sm font-medium">
                  ⚠️ This may affect employee payment schedules and compliance requirements.
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button 
                  onClick={handleGeneratePayroll}
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Generate Payroll Now
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
                <Badge variant="outline" className="border-red-300 text-red-700">
                  {deadlineStatus.daysOverdue} day{deadlineStatus.daysOverdue !== 1 ? 's' : ''} overdue
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Urgent Deadlines Alert */}
      {urgentDeadlines.length > 0 && !deadlineStatus?.isMissed && (
        <Alert variant="default" className="border-amber-300 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">
            Upcoming Payroll Deadlines
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="mt-2 space-y-2">
              {urgentDeadlines.slice(0, 2).map((deadline, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {deadline.type === 'generation' && <FileX className="h-3 w-3" />}
                      {deadline.type === 'cutoff' && <Calendar className="h-3 w-3" />}
                      {deadline.type === 'payment' && <TrendingUp className="h-3 w-3" />}
                      <span className="text-sm font-medium capitalize">{deadline.type}</span>
                    </div>
                    <span className="text-sm">
                      {new Date(deadline.date).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge 
                    variant={deadline.daysUntil <= 1 ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {deadline.daysUntil === 0 ? 'Today' : 
                     deadline.daysUntil === 1 ? 'Tomorrow' : 
                     `${deadline.daysUntil} days`}
                  </Badge>
                </div>
              ))}
              {urgentDeadlines.length > 2 && (
                <p className="text-sm">
                  +{urgentDeadlines.length - 2} more urgent deadline{urgentDeadlines.length - 2 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* File Security Status */}
      {fileStatus && fileStatus.hasGeneratedFiles && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Payroll File Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-green-700">Total Files: {fileStatus.fileCount}</div>
                <div className="text-green-700">Encrypted: {fileStatus.encryptedFiles}</div>
              </div>
              <div className="space-y-1">
                <div className="text-green-700">Employees: {fileStatus.totalEmployees}</div>
                {fileStatus.lastGenerated && (
                  <div className="text-green-600 text-xs">
                    Last: {new Date(fileStatus.lastGenerated).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            {fileStatus.encryptedFiles < fileStatus.fileCount && (
              <Alert variant="default" className="mt-3 border-amber-300 bg-amber-50">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs text-amber-700">
                  {fileStatus.fileCount - fileStatus.encryptedFiles} file(s) are not encrypted. 
                  Consider re-generating with encryption enabled.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Schedule */}
      {normalDeadlines.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Payroll Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {normalDeadlines.slice(0, 3).map((deadline, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-blue-700">{deadline.type}</span>
                    <span className="text-blue-600">
                      {new Date(deadline.date).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">
                    {deadline.daysUntil} day{deadline.daysUntil !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
              {normalDeadlines.length > 3 && (
                <p className="text-xs text-blue-600 mt-2">
                  +{normalDeadlines.length - 3} more scheduled event{normalDeadlines.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues State */}
      {!deadlineStatus?.isMissed && urgentDeadlines.length === 0 && (
        <Alert variant="default" className="border-green-300 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 font-semibold">
            Payroll System Status: Good
          </AlertTitle>
          <AlertDescription className="text-green-700">
            <p>All payroll deadlines are on track. {deadlineStatus?.message}</p>
            {fileStatus?.hasGeneratedFiles && (
              <p className="text-sm mt-1">
                {fileStatus.encryptedFiles} encrypted file{fileStatus.encryptedFiles !== 1 ? 's' : ''} secured for {fileStatus.totalEmployees} employee{fileStatus.totalEmployees !== 1 ? 's' : ''}.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default PayrollAlerts