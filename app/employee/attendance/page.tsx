"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Clock, CalendarDays, TrendingUp, AlertCircle,
  CheckCircle, XCircle, Timer, Calendar as CalendarIcon, Check, X
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"

interface AttendanceRecord {
  id: string
  date: string
  dayOfWeek: string
  timeIn: string | null
  timeOut: string | null
  status: string
  hours: number
  approvalStatus: string
  rejectionReason: string | null
  approvedAt: string | null
}

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  totalHours: number
  averageHoursPerDay: number
}

interface AttendanceData {
  records: AttendanceRecord[]
  summary: AttendanceSummary
}

export default function EmployeeAttendancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  
  // Testing state - disable time restrictions
  const [restrictionsDisabled, setRestrictionsDisabled] = useState(false)
  
  // Confirmation dialog states
  const [isTimeActionDialogOpen, setIsTimeActionDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'time-in' | 'time-out' | null>(null)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/employee/attendance?year=${selectedYear}&month=${selectedMonth}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data')
      }

      const result = await response.json()
      
      if (result.success) {
        setAttendanceData(result.data)
        
        // Find today's record
        const today = format(new Date(), 'yyyy-MM-dd')
        const todayRec = result.data.records.find((record: AttendanceRecord) => record.date === today)
        
        // Debug logging for testing
        if (restrictionsDisabled) {
          console.log('🔍 Debug - Today date:', today)
          console.log('🔍 Debug - Available records:', result.data.records.map((r: AttendanceRecord) => ({ date: r.date, timeIn: r.timeIn, timeOut: r.timeOut })))
          console.log('🔍 Debug - Found today record:', todayRec)
        }
        
        setTodayRecord(todayRec || null)
      } else {
        throw new Error(result.message || 'Failed to fetch attendance data')
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      toast.error('Failed to fetch attendance data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedMonth, selectedYear])

  const handleTimeIn = async () => {
    // Check time restrictions (skip if disabled for testing)
    if (!restrictionsDisabled) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute
      
      const morningStartTime = 6 * 60 // 6:00 AM
      const morningEndTime = 12 * 60 + 59 // 12:59 PM
      
      if (currentTime < morningStartTime || currentTime > morningEndTime) {
        let errorMessage = ""
        
        if (currentTime < morningStartTime) {
          const minutesUntilStart = morningStartTime - currentTime
          const hoursUntil = Math.floor(minutesUntilStart / 60)
          const minsUntil = minutesUntilStart % 60
          
          errorMessage = `Time-in opens at 6:00 AM. Please wait ${hoursUntil > 0 ? `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} and ` : ''}${minsUntil} minute${minsUntil > 1 ? 's' : ''}.`
        } else {
          errorMessage = "Time-in window closed at 12:59 PM. Please contact your supervisor if you need to record attendance."
        }
        
        toast.error(errorMessage)
        return
      }
    }

    // Check if already timed in
    if (todayRecord?.timeIn) {
      toast.error('You have already timed in today')
      return
    }

    setPendingAction('time-in')
    setIsTimeActionDialogOpen(true)
  }

  const handleTimeOut = async () => {
    // Check if timed in first
    if (!todayRecord?.timeIn) {
      toast.error('You must time in first before you can time out')
      return
    }

    // Check if already timed out
    if (todayRecord?.timeOut) {
      toast.error('You have already timed out today')
      return
    }

    setPendingAction('time-out')
    setIsTimeActionDialogOpen(true)
  }

  const confirmTimeAction = async () => {
    if (!pendingAction) return
    
    const isTimeIn = pendingAction === 'time-in'
    
    try {
      if (isTimeIn) {
        setIsClockingIn(true)
      } else {
        setIsClockingOut(true)
      }
      
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: pendingAction,
          skipTimeRestrictions: restrictionsDisabled
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        
        // Show additional information based on the response
        if (isTimeIn && result.data?.isLate) {
          toast.warning('You are late for work today')
        }
        
        if (!isTimeIn && result.data?.isEarlyOut) {
          toast.warning(`Early timeout detected. Expected end time: ${result.data.expectedEndTime}`)
        }
        
        if (!isTimeIn && result.data?.isHalfDay && !result.data?.isAttendanceComplete) {
          if (result.data?.hasCompletedMorning && !result.data?.hasCompletedAfternoon) {
            toast.info('Half-day complete. Afternoon session still needed for full attendance.')
          } else if (!result.data?.hasCompletedMorning && result.data?.hasCompletedAfternoon) {
            toast.info('Half-day complete. Morning session still needed for full attendance.')
          }
        }
        
        fetchAttendanceData() // Refresh data
      } else {
        toast.error(result.message || `Failed to record ${pendingAction}`)
      }
    } catch (error) {
      console.error(`Error recording ${pendingAction}:`, error)
      toast.error(`Failed to record ${pendingAction}`)
    } finally {
      if (isTimeIn) {
        setIsClockingIn(false)
      } else {
        setIsClockingOut(false)
      }
      setIsTimeActionDialogOpen(false)
      setPendingAction(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on time':
        return <Badge className="bg-green-500 text-white">On Time</Badge>
      case 'late':
        return <Badge className="bg-yellow-500 text-white">Late</Badge>
      case 'absent':
        return <Badge className="bg-red-500 text-white">Absent</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getApprovalStatusBadge = (approvalStatus: string, rejectionReason?: string | null) => {
    switch (approvalStatus) {
      case 'PENDING':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 flex items-center gap-1 w-fit">
              <Clock className="h-3 w-3" />
              Pending Review
            </Badge>
          </div>
        )
      case 'APPROVED':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 w-fit">
              <Check className="h-3 w-3" />
              Approved
            </Badge>
          </div>
        )
      case 'REJECTED':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1 w-fit">
              <X className="h-3 w-3" />
              Rejected
            </Badge>
            {rejectionReason && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 max-w-xs">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                <span className="font-medium">Reason:</span> {rejectionReason}
              </div>
            )}
          </div>
        )
      default:
        return <Badge variant="outline">{approvalStatus}</Badge>
    }
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getTodayStatus = () => {
    if (!todayRecord) return 'Not clocked in'

    // Check session-based status
    const hasMorningIn = todayRecord.morningTimeIn
    const hasMorningOut = todayRecord.morningTimeOut
    const hasAfternoonIn = todayRecord.afternoonTimeIn
    const hasAfternoonOut = todayRecord.afternoonTimeOut
    
    if (hasMorningIn && hasMorningOut && hasAfternoonIn && hasAfternoonOut) {
      return 'Full Day Complete'
    } else if (hasMorningIn && hasMorningOut && !hasAfternoonIn) {
      return 'Morning Complete - Afternoon Pending'
    } else if (hasMorningIn && !hasMorningOut) {
      return 'Morning Session Active'
    } else if (hasAfternoonIn && !hasAfternoonOut) {
      return 'Afternoon Session Active'
    } else if (hasAfternoonIn && hasAfternoonOut && !hasMorningIn) {
      return 'Afternoon Only Complete'
    } else if (todayRecord.timeOut) {
      return 'Completed'
    } else if (todayRecord.timeIn) {
      return 'Clocked in'
    }
    
    return 'Absent'
  }

  const canClockIn = () => {
    // If restrictions are disabled for testing, only check if not already timed in
    if (restrictionsDisabled) {
      return !todayRecord || !todayRecord.timeIn
    }
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute
    
    const morningStartTime = 6 * 60 // 6:00 AM
    const morningEndTime = 12 * 60 + 59 // 12:59 PM
    
    // Check time window and if not already timed in
    return (currentTime >= morningStartTime && currentTime <= morningEndTime) && (!todayRecord || !todayRecord.timeIn)
  }

  const canClockOut = () => {
    const result = todayRecord && todayRecord.timeIn && !todayRecord.timeOut
    
    // Debug logging for testing
    if (restrictionsDisabled) {
      console.log('🔍 Debug - canClockOut check:')
      console.log('  - todayRecord exists:', !!todayRecord)
      console.log('  - todayRecord.timeIn exists:', !!todayRecord?.timeIn)
      console.log('  - todayRecord.timeOut exists:', !!todayRecord?.timeOut)
      console.log('  - Final result:', result)
      console.log('  - todayRecord data:', todayRecord)
    }
    
    return result
  }

  // Generate month/year options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

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
    <div className="p-6 space-y-8">
      {/* Time Action Confirmation Dialog */}
      <AlertDialog open={isTimeActionDialogOpen} onOpenChange={setIsTimeActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-bisu-purple-deep">
              <Clock className="mr-2 h-5 w-5" />
              Confirm {pendingAction === 'time-in' ? 'Time In' : 'Time Out'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to record your{' '}
              <span className="font-semibold text-bisu-purple-deep">
                {pendingAction === 'time-in' ? 'TIME IN' : 'TIME OUT'}
              </span>{' '}
              at this time?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 px-6">
            <div className="text-center py-4">
              <div className="text-2xl font-mono font-bold text-bisu-purple-deep mb-2">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-sm text-gray-600">
                {format(currentTime, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {pendingAction === 'time-in' && (
                <span className="text-xs text-amber-600 block">
                  ⚠️ Note: Late arrivals after 8:00 AM will be marked as late.
                </span>
              )}
              
              {pendingAction === 'time-out' && (
                <span className="text-xs text-blue-600 block">
                  ✓ Your work hours will be calculated automatically.
                </span>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClockingIn || isClockingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTimeAction}
              disabled={isClockingIn || isClockingOut}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium"
            >
              {isClockingIn || isClockingOut ? 'Recording...' : `Confirm ${pendingAction === 'time-in' ? 'Time In' : 'Time Out'}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">My Attendance</h1>
        <p className="text-gray-600">Track your attendance and working hours</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Clock In/Out Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white">
            <CardHeader>
              <CardTitle className="text-bisu-yellow flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Time Clock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-bisu-yellow">
                  {format(currentTime, 'HH:mm:ss')}
                </div>
                <div className="text-lg text-bisu-yellow-light">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-sm text-bisu-yellow-light mt-2">
                  <div>Morning: 8:00 AM - 12:00 PM | Afternoon: 1:00 PM - 5:00 PM</div>
                  <div className="text-xs mt-1">Time-in allowed during session times</div>
                  {restrictionsDisabled && (
                    <div className="text-red-200 text-xs mt-1 font-semibold">
                      ⚠️ TIME RESTRICTIONS DISABLED (TESTING MODE)
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-sm text-bisu-yellow-light">Today's Status</div>
                  <div className="text-lg font-semibold text-white">{getTodayStatus()}</div>
                  {todayRecord?.isHalfDay && (
                    <div className="text-sm text-yellow-300 mt-1">
                      Half-day attendance ({todayRecord.hours?.toFixed(2) || '0'} hours)
                    </div>
                  )}
                  {todayRecord?.isEarlyOut && (
                    <div className="text-sm text-orange-300 mt-1">
                      Early timeout - {todayRecord.earlyOutReason}
                    </div>
                  )}
                </div>
                
                {/* Session-based time display */}
                {todayRecord && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Morning Session */}
                    <div className="text-center border border-bisu-yellow-light/20 rounded-lg p-3">
                      <div className="text-sm text-bisu-yellow-light font-medium mb-2">Morning Session</div>
                      <div className="space-y-1">
                        <div className="text-xs text-bisu-yellow-light">Time In</div>
                        <div className="text-sm font-semibold text-white">
                          {todayRecord.morningTimeIn || '-'}
                        </div>
                        <div className="text-xs text-bisu-yellow-light">Time Out</div>
                        <div className="text-sm font-semibold text-white">
                          {todayRecord.morningTimeOut || '-'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Afternoon Session */}
                    <div className="text-center border border-bisu-yellow-light/20 rounded-lg p-3">
                      <div className="text-sm text-bisu-yellow-light font-medium mb-2">Afternoon Session</div>
                      <div className="space-y-1">
                        <div className="text-xs text-bisu-yellow-light">Time In</div>
                        <div className="text-sm font-semibold text-white">
                          {todayRecord.afternoonTimeIn || '-'}
                        </div>
                        <div className="text-xs text-bisu-yellow-light">Time Out</div>
                        <div className="text-sm font-semibold text-white">
                          {todayRecord.afternoonTimeOut || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Legacy display for backwards compatibility */}
                {todayRecord && !todayRecord.morningTimeIn && !todayRecord.afternoonTimeIn && (
                  <div className="flex justify-center items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-bisu-yellow-light">Time In</div>
                      <div className="text-lg font-semibold text-white">
                        {todayRecord.timeIn || '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-bisu-yellow-light">Time Out</div>
                      <div className="text-lg font-semibold text-white">
                        {todayRecord.timeOut || '-'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleTimeIn}
                  disabled={!canClockIn() || isClockingIn}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  title={!canClockIn() && !todayRecord?.timeIn && !restrictionsDisabled ? 'Time-in only allowed between 6:00 AM - 12:59 PM' : ''}
                >
                  {isClockingIn ? 'Clocking In...' : 'Clock In'}
                </Button>
                <Button
                  onClick={handleTimeOut}
                  disabled={!canClockOut() || isClockingOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  {isClockingOut ? 'Clocking Out...' : 'Clock Out'}
                </Button>
              </div>
              
              {/* Testing Controls */}
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setRestrictionsDisabled(!restrictionsDisabled)
                    toast.info(restrictionsDisabled ? 'Time restrictions enabled' : 'Time restrictions disabled for testing')
                  }}
                  variant="outline"
                  className={`text-xs px-4 py-2 border-2 ${
                    restrictionsDisabled 
                      ? 'bg-red-600 text-white border-red-400 hover:bg-red-700' 
                      : 'bg-orange-600 text-white border-orange-400 hover:bg-orange-700'
                  }`}
                >
                  {restrictionsDisabled ? '🔓 Enable Time Restrictions' : '🔒 Disable Time Restrictions (Testing)'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Statistics */}
        {attendanceData && (
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Present Days</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{attendanceData.summary.presentDays}</div>
                  <p className="text-xs text-green-600 mt-1">
                    {attendanceData.summary.totalDays > 0 
                      ? Math.round((attendanceData.summary.presentDays / attendanceData.summary.totalDays) * 100) 
                      : 0}% attendance rate
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Late Days</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{attendanceData.summary.lateDays}</div>
                  <p className="text-xs text-yellow-600 mt-1">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Absent Days</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{attendanceData.summary.absentDays}</div>
                  <p className="text-xs text-red-500 mt-1">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
                  <Timer className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">
                    {formatHours(attendanceData.summary.totalHours)}
                  </div>
                  <p className="text-xs text-blue-500 mt-1">
                    Avg: {formatHours(attendanceData.summary.averageHoursPerDay)}/day
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Attendance History */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-bisu-purple-deep flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Attendance History
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bisu-purple-deep mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading attendance records...</p>
                </div>
              ) : attendanceData?.records && attendanceData.records.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{record.dayOfWeek}</TableCell>
                        <TableCell>{record.timeIn || '-'}</TableCell>
                        <TableCell>{record.timeOut || '-'}</TableCell>
                        <TableCell>{formatHours(record.hours)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{getApprovalStatusBadge(record.approvalStatus, record.rejectionReason)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records found for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
} 