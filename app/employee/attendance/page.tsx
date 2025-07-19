"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Clock, CalendarDays, TrendingUp, AlertCircle,
  CheckCircle, XCircle, Timer, Calendar as CalendarIcon
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AttendanceRecord {
  id: string
  date: string
  dayOfWeek: string
  timeIn: string | null
  timeOut: string | null
  status: string
  hours: number
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
    try {
      setIsClockingIn(true)
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'time-in' })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        if (result.data?.isLate) {
          toast.warning('You are late for work today')
        }
        fetchAttendanceData() // Refresh data
      } else {
        toast.error(result.message || 'Failed to record time-in')
      }
    } catch (error) {
      console.error('Error recording time-in:', error)
      toast.error('Failed to record time-in')
    } finally {
      setIsClockingIn(false)
    }
  }

  const handleTimeOut = async () => {
    try {
      setIsClockingOut(true)
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'time-out' })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        fetchAttendanceData() // Refresh data
      } else {
        toast.error(result.message || 'Failed to record time-out')
      }
    } catch (error) {
      console.error('Error recording time-out:', error)
      toast.error('Failed to record time-out')
    } finally {
      setIsClockingOut(false)
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

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getTodayStatus = () => {
    if (!todayRecord) return 'Not clocked in'
    if (todayRecord.timeOut) return 'Completed'
    if (todayRecord.timeIn) return 'Clocked in'
    return 'Absent'
  }

  const canClockIn = () => {
    return !todayRecord || !todayRecord.timeIn
  }

  const canClockOut = () => {
    return todayRecord && todayRecord.timeIn && !todayRecord.timeOut
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
              <CardTitle className="text-bisu-yellow-DEFAULT flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Time Clock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-bisu-yellow-DEFAULT">
                  {format(currentTime, 'HH:mm:ss')}
                </div>
                <div className="text-lg text-bisu-yellow-light">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>

              <div className="flex justify-center items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-bisu-yellow-light">Today's Status</div>
                  <div className="text-lg font-semibold text-white">{getTodayStatus()}</div>
                </div>
                {todayRecord && (
                  <>
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
                  </>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleTimeIn}
                  disabled={!canClockIn() || isClockingIn}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
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