"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, Filter, FileDown, RefreshCcw, CheckCircle, 
  XCircle, Clock, CalendarClock, UserCheck, Calendar as CalendarIcon
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface AttendanceRecord {
  id: number
  employeeId: number
  employeeName: string
  department: string
  date: string
  timeIn: string | null
  timeOut: string | null
  status: string
  hoursWorked: string
  overtime: string
}

// Mock attendance data
const attendanceRecords: AttendanceRecord[] = [
  { 
    id: 1, 
    employeeId: 101,
    employeeName: "Juan Dela Cruz", 
    department: "IT Department", 
    date: "2023-12-11",
    timeIn: "08:02:15",
    timeOut: "17:05:30",
    status: "present",
    hoursWorked: "9:03:15",
    overtime: "0:05:30"
  },
  { 
    id: 2, 
    employeeId: 102,
    employeeName: "Maria Santos", 
    department: "Accounting", 
    date: "2023-12-11",
    timeIn: "08:30:45",
    timeOut: "17:30:20",
    status: "present",
    hoursWorked: "8:59:35",
    overtime: "0:00:00"
  },
  { 
    id: 3, 
    employeeId: 103,
    employeeName: "Pedro Reyes", 
    department: "HR", 
    date: "2023-12-11",
    timeIn: "07:55:10",
    timeOut: "17:00:05",
    status: "present",
    hoursWorked: "9:04:55",
    overtime: "0:04:55"
  },
  { 
    id: 4, 
    employeeId: 104,
    employeeName: "Ana Gonzales", 
    department: "Faculty", 
    date: "2023-12-11",
    timeIn: "09:10:22",
    timeOut: "17:45:18",
    status: "late",
    hoursWorked: "8:34:56",
    overtime: "0:45:18"
  },
  { 
    id: 5, 
    employeeId: 105,
    employeeName: "Roberto Carlos", 
    department: "Maintenance", 
    date: "2023-12-11",
    timeIn: null,
    timeOut: null,
    status: "absent",
    hoursWorked: "0:00:00",
    overtime: "0:00:00"
  },
  { 
    id: 6, 
    employeeId: 106,
    employeeName: "Sofia Luna", 
    department: "Admin Office", 
    date: "2023-12-11",
    timeIn: "08:45:33",
    timeOut: "16:30:12",
    status: "present",
    hoursWorked: "7:44:39",
    overtime: "0:00:00"
  },
]

// Department options
const departments = [
  "All Departments",
  "IT Department",
  "HR",
  "Accounting",
  "Faculty",
  "Maintenance",
  "Admin Office"
]

// Summary statistics
const summaryStats = {
  present: 5,
  late: 1,
  absent: 1,
  onLeave: 0,
  totalEmployees: 7
}

export default function AttendancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
      setRecords(attendanceRecords)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Filter records based on search term, department, and status
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.employeeId.toString().includes(searchTerm)
    
    const matchesDepartment = 
      selectedDepartment === "All Departments" || 
      record.department === selectedDepartment
    
    const matchesStatus = 
      selectedStatus === "all" || 
      record.status === selectedStatus
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

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

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>
      case "late":
        return <Badge className="bg-yellow-500">Late</Badge>
      case "absent":
        return <Badge className="bg-red-500">Absent</Badge>
      case "on-leave":
        return <Badge className="bg-blue-500">On Leave</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Attendance Monitoring</h1>
        <p className="text-gray-600">Track employee attendance and time records</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <div className="lg:col-span-4">
            <SkeletonCard lines={8} />
          </div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-green-500 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Present</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{summaryStats.present}</div>
                  <p className="text-xs text-green-600 mt-1">
                    {Math.round((summaryStats.present / summaryStats.totalEmployees) * 100)}% of workforce
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-yellow-500 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Late</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{summaryStats.late}</div>
                  <p className="text-xs text-yellow-600 mt-1">
                    {Math.round((summaryStats.late / summaryStats.totalEmployees) * 100)}% of workforce
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-red-500 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Absent</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{summaryStats.absent}</div>
                  <p className="text-xs text-red-500 mt-1">
                    {Math.round((summaryStats.absent / summaryStats.totalEmployees) * 100)}% of workforce
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-blue-500 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">On Leave</CardTitle>
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{summaryStats.onLeave}</div>
                  <p className="text-xs text-blue-500 mt-1">
                    {Math.round((summaryStats.onLeave / summaryStats.totalEmployees) * 100)}% of workforce
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Attendance Records */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-bisu-yellow-DEFAULT">Attendance Records</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-transparent text-bisu-yellow-DEFAULT border-bisu-yellow-DEFAULT/30 hover:bg-bisu-yellow-light">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 ">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light">
                      <RefreshCcw size={16} className="mr-2" />
                      Refresh
                    </Button>
                    <Button variant="outline" className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light">
                      <FileDown size={16} className="mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow-DEFAULT" />
                    <Input
                      placeholder="Search by name or ID..."
                      className="pl-10 bg-bisu-purple-light text-white placeholder:text-bisu-yellow-DEFAULT/70 border-bisu-yellow-DEFAULT/30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-[180px] bg-bisu-purple-light text-white border-bisu-yellow-DEFAULT/30">
                        <Filter size={16} className="mr-2 text-bisu-yellow-DEFAULT" />
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-[300px]">
                      <TabsList className="bg-bisu-purple-light border-bisu-yellow-DEFAULT/30 text-bisu-yellow-light hover:text-bisu-yellow-DEFAULT">
                        <TabsTrigger value="all" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="present" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                          Present
                        </TabsTrigger>
                        <TabsTrigger value="late" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                          Late
                        </TabsTrigger>
                        <TabsTrigger value="absent" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                          Absent
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                          No attendance records found matching the current filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id} className="transition-colors hover:bg-gray-50">
                          <TableCell className="font-medium">{record.employeeId}</TableCell>
                          <TableCell>{record.employeeName}</TableCell>
                          <TableCell>{record.department}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.timeIn || "-"}</TableCell>
                          <TableCell>{record.timeOut || "-"}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>{record.hoursWorked}</TableCell>
                          <TableCell>
                            {record.overtime !== "0:00:00" ? (
                              <span className="text-blue-600">{record.overtime}</span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 