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
        <Alert variant="destructive" className="border-bisu-yellow bg-bisu-yellow-extralight">
          <AlertTriangle className="h-4 w-4 text-bisu-purple-deep" />
          <AlertTitle className="text-bisu-purple-deep font-semibold">
            Payroll Generation Overdue
          </AlertTitle>
          <AlertDescription className="text-bisu-purple-medium">
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
                  className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
                >
                  Generate Payroll Now
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
                <Badge variant="outline" className="border-bisu-purple-light text-bisu-purple-deep">
                  {deadlineStatus.daysOverdue} day{deadlineStatus.daysOverdue !== 1 ? 's' : ''} overdue
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Urgent Deadlines Alert */}
      {urgentDeadlines.length > 0 && !deadlineStatus?.isMissed && (
        <Alert variant="default" className="border-bisu-yellow bg-bisu-yellow-extralight">
          <Clock className="h-4 w-4 text-bisu-purple-deep" />
          <AlertTitle className="text-bisu-purple-deep font-semibold">
            Upcoming Payroll Deadlines
          </AlertTitle>
          <AlertDescription className="text-bisu-purple-medium">
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
                    variant="outline"
                    className={`text-xs border-bisu-purple-light ${deadline.daysUntil <= 1 ? 'text-bisu-purple-deep' : 'text-bisu-purple-medium'}`}
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
        <Card className="border-bisu-purple-light bg-bisu-purple-extralight">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-bisu-purple-deep flex items-center gap-2">
              <Shield className="h-4 w-4 text-bisu-purple-deep" />
              Payroll File Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-bisu-purple-deep">Total Files: {fileStatus.fileCount}</div>
                <div className="text-bisu-purple-deep">Encrypted: {fileStatus.encryptedFiles}</div>
              </div>
              <div className="space-y-1">
                <div className="text-bisu-purple-deep">Employees: {fileStatus.totalEmployees}</div>
                {fileStatus.lastGenerated && (
                  <div className="text-bisu-purple-medium text-xs">
                    Last: {new Date(fileStatus.lastGenerated).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            {fileStatus.encryptedFiles < fileStatus.fileCount && (
              <Alert variant="default" className="mt-3 border-bisu-yellow bg-bisu-yellow-extralight">
                <AlertCircle className="h-3 w-3 text-bisu-purple-deep" />
                <AlertDescription className="text-xs text-bisu-purple-medium">
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
        <Card className="border-bisu-purple-light bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-bisu-purple-deep flex items-center gap-2">
              <Calendar className="h-4 w-4 text-bisu-purple-deep" />
              Upcoming Payroll Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {normalDeadlines.slice(0, 3).map((deadline, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-bisu-purple-deep">{deadline.type}</span>
                    <span className="text-bisu-purple-medium">
                      {new Date(deadline.date).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-bisu-purple-light text-bisu-purple-deep text-xs">
                    {deadline.daysUntil} day{deadline.daysUntil !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
              {normalDeadlines.length > 3 && (
                <p className="text-xs text-bisu-purple-medium mt-2">
                  +{normalDeadlines.length - 3} more scheduled event{normalDeadlines.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues State */}
      {!deadlineStatus?.isMissed && urgentDeadlines.length === 0 && (
        <Alert variant="default" className="border-bisu-purple-light bg-bisu-purple-extralight">
          <Shield className="h-4 w-4 text-bisu-purple-deep" />
          <AlertTitle className="text-bisu-purple-deep font-semibold">
            us: Good
          </AlertTitle>
          <AlertDescription className="text-bisu-purple-medium">
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