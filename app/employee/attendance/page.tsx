"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Clock, Calendar as CalendarIcon, CheckCircle2, XCircle, AlertTriangle, Download, Printer } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// Mock attendance data
const attendanceData = {
  thisMonth: [
    { date: "2023-09-01", dayOfWeek: "Friday", timeIn: "08:02 AM", timeOut: "05:03 PM", status: "On Time", hours: 8.0 },
    { date: "2023-09-04", dayOfWeek: "Monday", timeIn: "08:15 AM", timeOut: "05:00 PM", status: "Late", hours: 7.75 },
    { date: "2023-09-05", dayOfWeek: "Tuesday", timeIn: "07:55 AM", timeOut: "05:05 PM", status: "On Time", hours: 8.17 },
    { date: "2023-09-06", dayOfWeek: "Wednesday", timeIn: "08:00 AM", timeOut: "05:00 PM", status: "On Time", hours: 8.0 },
    { date: "2023-09-07", dayOfWeek: "Thursday", timeIn: "08:10 AM", timeOut: "05:10 PM", status: "On Time", hours: 8.0 },
    { date: "2023-09-08", dayOfWeek: "Friday", timeIn: "08:22 AM", timeOut: "05:00 PM", status: "Late", hours: 7.63 },
    { date: "2023-09-11", dayOfWeek: "Monday", timeIn: "07:58 AM", timeOut: "05:03 PM", status: "On Time", hours: 8.08 },
    { date: "2023-09-12", dayOfWeek: "Tuesday", timeIn: "08:05 AM", timeOut: "05:00 PM", status: "On Time", hours: 7.92 },
  ],
  summary: {
    totalDays: 22,
    presentDays: 20,
    absentDays: 0,
    lateDays: 2,
    totalHours: 160.5,
    averageHoursPerDay: 8.03,
  }
}

// Mock leave data
const leaveData = [
  { id: 1, type: "Vacation", startDate: "2023-08-15", endDate: "2023-08-17", status: "Approved", approvedBy: "Jane Smith" },
  { id: 2, type: "Sick", startDate: "2023-07-10", endDate: "2023-07-10", status: "Approved", approvedBy: "Jane Smith" },
  { id: 3, type: "Personal", startDate: "2023-09-25", endDate: "2023-09-25", status: "Pending", approvedBy: null },
]

export default function EmployeeAttendance() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("attendance")

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Animation variants
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "on time":
        return "text-green-600"
      case "late":
        return "text-amber-600"
      case "absent":
        return "text-red-600"
      case "approved":
        return "text-green-600"
      case "pending":
        return "text-amber-600"
      case "rejected":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "on time":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "late":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-bisu-purple-deep">My Attendance</h1>
          <p className="text-gray-600">View and manage your attendance records and leave requests</p>
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Page
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex mb-6 bg-bisu-purple-extralight">
          <TabsTrigger value="attendance" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Attendance Log
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
            <Clock className="mr-2 h-4 w-4" />
            Leave Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {isLoading ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SkeletonCard hasHeader={true} lines={6} />
              <div className="lg:col-span-2">
                <SkeletonCard hasHeader={true} lines={10} />
              </div>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Card */}
              <motion.div variants={itemVariants} className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Attendance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Working Days:</span>
                        <span className="font-semibold text-bisu-purple-deep">{attendanceData.summary.totalDays}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Present:</span>
                        <span className="font-semibold text-green-600">{attendanceData.summary.presentDays}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Absent:</span>
                        <span className="font-semibold text-red-600">{attendanceData.summary.absentDays}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Late:</span>
                        <span className="font-semibold text-amber-600">{attendanceData.summary.lateDays}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Hours:</span>
                        <span className="font-semibold text-bisu-purple-deep">{attendanceData.summary.totalHours}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. Hours/Day:</span>
                        <span className="font-semibold text-bisu-purple-deep">{attendanceData.summary.averageHoursPerDay}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep">Calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center pt-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md"
                      modifiersClassNames={{
                        selected: "bg-bisu-yellow-DEFAULT text-bisu-purple-deep hover:bg-bisu-yellow-dark",
                        today: "bg-bisu-purple-light text-white",
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Attendance Table */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Attendance Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-bisu-purple-deep">Date</TableHead>
                            <TableHead className="text-bisu-purple-deep">Day</TableHead>
                            <TableHead className="text-bisu-purple-deep">Time In</TableHead>
                            <TableHead className="text-bisu-purple-deep">Time Out</TableHead>
                            <TableHead className="text-bisu-purple-deep">Status</TableHead>
                            <TableHead className="text-bisu-purple-deep text-right">Hours</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceData.thisMonth.map((record, index) => (
                            <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <TableCell className="font-medium">{record.date}</TableCell>
                              <TableCell>{record.dayOfWeek}</TableCell>
                              <TableCell>{record.timeIn}</TableCell>
                              <TableCell>{record.timeOut}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {getStatusIcon(record.status)}
                                  <span className={cn("ml-1", getStatusColor(record.status))}>{record.status}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{record.hours}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          {isLoading ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-6">
              <SkeletonCard hasHeader={true} lines={6} />
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-bisu-purple-deep flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        Leave Requests
                      </CardTitle>
                      <Button className="bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep">
                        New Request
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-bisu-purple-deep">ID</TableHead>
                            <TableHead className="text-bisu-purple-deep">Type</TableHead>
                            <TableHead className="text-bisu-purple-deep">Start Date</TableHead>
                            <TableHead className="text-bisu-purple-deep">End Date</TableHead>
                            <TableHead className="text-bisu-purple-deep">Status</TableHead>
                            <TableHead className="text-bisu-purple-deep">Approved By</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaveData.map((leave) => (
                            <TableRow key={leave.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{leave.id}</TableCell>
                              <TableCell>{leave.type}</TableCell>
                              <TableCell>{leave.startDate}</TableCell>
                              <TableCell>{leave.endDate}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {getStatusIcon(leave.status)}
                                  <span className={cn("ml-1", getStatusColor(leave.status))}>{leave.status}</span>
                                </div>
                              </TableCell>
                              <TableCell>{leave.approvedBy || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 