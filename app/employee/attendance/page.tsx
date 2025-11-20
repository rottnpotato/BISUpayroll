"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  CalendarDays, TrendingUp, AlertCircle, CheckCircle, Clock, Info
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AttendanceDetailModal } from "./components/attendance-detail-modal"
import { AttendanceRecord, AttendanceData, AttendanceSummary } from "./types"
import { calculateUndertime } from "./utils"

export default function EmployeeAttendancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

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
              Pending
            </Badge>
          </div>
        )
      case 'APPROVED':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 w-fit">
              <CheckCircle className="h-3 w-3" />
              Approved
            </Badge>
          </div>
        )
      case 'REJECTED':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1 w-fit">
              <AlertCircle className="h-3 w-3" />
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
  } as const

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
  } as const

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">My Attendance</h1>
        <p className="text-gray-600">View your attendance records and time logs</p>
      </motion.div>

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Note:</strong> Attendance records are imported from the biometric system by administrators. 
          If you notice any discrepancies, please contact your supervisor or HR department.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bisu-purple-deep mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Summary Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-md border-l-4 border-l-bisu-purple-deep">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Total Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bisu-purple-deep">
                  {attendanceData?.summary.totalDays || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Present Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {attendanceData?.summary.presentDays || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Late Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {attendanceData?.summary.lateDays || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatHours(attendanceData?.summary.totalHours || 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Attendance Records Table with AM/PM sessions */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-bisu-yellow">Attendance Records</CardTitle>
                  <div className="flex gap-2">
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(value) => setSelectedMonth(parseInt(value))}
                    >
                      <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(parseInt(value))}
                    >
                      <SelectTrigger className="w-24 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead colSpan={2} className="text-center">Morning</TableHead>
                        <TableHead colSpan={2} className="text-center">Afternoon</TableHead>
                        <TableHead>Undertime</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approval</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead></TableHead>
                        <TableHead className="text-xs text-gray-500">In</TableHead>
                        <TableHead className="text-xs text-gray-500">Out</TableHead>
                        <TableHead className="text-xs text-gray-500">In</TableHead>
                        <TableHead className="text-xs text-gray-500">Out</TableHead>
                        <TableHead></TableHead>
                        <TableHead></TableHead>
                        <TableHead></TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData && attendanceData.records.length > 0 ? (
                        attendanceData.records.map((record) => (
                          <TableRow 
                            key={record.id}
                            className="cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              setSelectedRecord(record)
                              setIsDetailModalOpen(true)
                            }}
                          >
                            <TableCell className="font-medium">{record.date}</TableCell>
                            <TableCell>{record.dayOfWeek}</TableCell>
                            <TableCell>
                              {record.morningTimeIn || <span className="text-gray-400">--</span>}
                            </TableCell>
                            <TableCell>
                              {record.morningTimeOut || <span className="text-gray-400">--</span>}
                            </TableCell>
                            <TableCell>
                              {record.afternoonTimeIn || <span className="text-gray-400">--</span>}
                            </TableCell>
                            <TableCell>
                              {record.afternoonTimeOut || <span className="text-gray-400">--</span>}
                            </TableCell>
                            <TableCell className="text-red-500 font-medium">{calculateUndertime(record)}</TableCell>
                            <TableCell>{formatHours(record.hours)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>
                              {getApprovalStatusBadge(record.approvalStatus!, record.rejectionReason)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                            No attendance records found for this period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedRecord(null)
        }}
        record={selectedRecord}
        onOverloadAdded={() => {
          // Refresh attendance data to show new overload
          fetchAttendanceData()
        }}
      />
    </div>
  )
}