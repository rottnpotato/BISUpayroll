"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, Filter, FileDown, RefreshCcw, CheckCircle, 
  XCircle, Clock, CalendarClock, UserCheck, Calendar as CalendarIcon,
  Edit, Trash2
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface User {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
  position: string
}

interface AttendanceRecord {
  id: string
  userId: string
  date: string
  timeIn: string | null
  timeOut: string | null
  hoursWorked: number | null
  isLate: boolean
  isAbsent: boolean
  user: User
}

interface AttendanceResponse {
  records: AttendanceRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface SummaryStats {
  present: number
  late: number
  absent: number
  onLeave: number
  totalEmployees: number
}

export default function AttendancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
    totalEmployees: 0
  })
  const [users, setUsers] = useState<User[]>([])

  // Form state for adding/editing records
  const [formData, setFormData] = useState({
    userId: "",
    date: "",
    timeIn: "",
    timeOut: "",
    isLate: false,
    isAbsent: false
  })

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

  const fetchAttendanceRecords = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      })

      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        params.append('startDate', dateStr)
        params.append('endDate', dateStr)
      }

      if (selectedDepartment !== "All Departments") {
        params.append('department', selectedDepartment)
      }

      const response = await fetch(`/api/admin/attendance?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records')
      }

      const data: AttendanceResponse = await response.json()
      setRecords(data.records)
      setTotalPages(data.pagination.pages)

      // Calculate summary stats
      const stats = data.records.reduce(
        (acc, record) => {
          if (record.isAbsent) {
            acc.absent++
          } else if (record.timeIn && record.timeOut) {
            if (record.isLate) {
              acc.late++
            } else {
              acc.present++
            }
          }
          return acc
        },
        { present: 0, late: 0, absent: 0, onLeave: 0, totalEmployees: data.pagination.total }
      )
      setSummaryStats(stats)
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      toast.error('Failed to fetch attendance records')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    }
  }

  useEffect(() => {
    fetchAttendanceRecords()
    fetchUsers()
  }, [currentPage, selectedDate, selectedDepartment])



  const handleEditRecord = async () => {
    if (!editingRecord) return

    try {
      const response = await fetch(`/api/admin/attendance/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update attendance record')
      }

      toast.success('Attendance record updated successfully')
      setIsEditDialogOpen(false)
      setEditingRecord(null)
      setFormData({
        userId: "",
        date: "",
        timeIn: "",
        timeOut: "",
        isLate: false,
        isAbsent: false
      })
      fetchAttendanceRecords()
    } catch (error) {
      console.error('Error updating attendance record:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update attendance record')
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/attendance/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete attendance record')
      }

      toast.success('Attendance record deleted successfully')
      fetchAttendanceRecords()
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete attendance record')
    }
  }

  const openEditDialog = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setFormData({
      userId: record.userId,
      date: format(new Date(record.date), 'yyyy-MM-dd'),
      timeIn: record.timeIn ? format(new Date(record.timeIn), 'HH:mm') : "",
      timeOut: record.timeOut ? format(new Date(record.timeOut), 'HH:mm') : "",
      isLate: record.isLate,
      isAbsent: record.isAbsent
    })
    setIsEditDialogOpen(true)
  }

  const exportAttendance = async () => {
    try {
      const params = new URLSearchParams()
      
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        params.append('startDate', dateStr)
        params.append('endDate', dateStr)
      }

      if (selectedDepartment !== "All Departments") {
        params.append('department', selectedDepartment)
      }

      // For now, just download the current view as JSON
      // In a real implementation, you'd want to create a CSV or Excel file
      const response = await fetch(`/api/admin/attendance?${params}&limit=1000`)
      const data = await response.json()
      
      const dataStr = JSON.stringify(data.records, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `attendance-${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all'}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      toast.success('Attendance data exported successfully')
    } catch (error) {
      console.error('Error exporting attendance:', error)
      toast.error('Failed to export attendance data')
    }
  }

  // Filter records based on search term and status
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      `${record.user.firstName} ${record.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const getRecordStatus = () => {
      if (record.isAbsent) return "absent"
      if (record.timeIn && record.isLate) return "late"
      if (record.timeIn) return "present"
      return "absent"
    }
    
    const matchesStatus = 
      selectedStatus === "all" || 
      getRecordStatus() === selectedStatus
    
    return matchesSearch && matchesStatus
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
  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.isAbsent) {
      return <Badge className="bg-red-500">Absent</Badge>
    }
    if (record.timeIn && record.isLate) {
      return <Badge className="bg-yellow-500">Late</Badge>
    }
    if (record.timeIn) {
      return <Badge className="bg-green-500">Present</Badge>
    }
    return <Badge className="bg-gray-500">No Data</Badge>
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "-"
    return format(new Date(dateString), 'HH:mm:ss')
  }

  const formatHours = (hours: number | null) => {
    if (!hours) return "-"
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Attendance Monitoring</h1>
          <p className="text-gray-600">Track employee attendance and time records</p>
        </div>
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
                    {summaryStats.totalEmployees > 0 ? Math.round((summaryStats.present / summaryStats.totalEmployees) * 100) : 0}% of records
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
                    {summaryStats.totalEmployees > 0 ? Math.round((summaryStats.late / summaryStats.totalEmployees) * 100) : 0}% of records
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
                    {summaryStats.totalEmployees > 0 ? Math.round((summaryStats.absent / summaryStats.totalEmployees) * 100) : 0}% of records
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-blue-500 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">{summaryStats.totalEmployees}</div>
                  <p className="text-xs text-blue-500 mt-1">
                    For selected date
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
                          {selectedDate ? format(selectedDate, 'PPP') : <span>All Dates</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="p-3">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                          {selectedDate && (
                            <Button 
                              variant="outline" 
                              className="w-full mt-2" 
                              onClick={() => setSelectedDate(undefined)}
                            >
                              Clear Date Filter
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="outline" 
                      className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light"
                      onClick={() => fetchAttendanceRecords()}
                    >
                      <RefreshCcw size={16} className="mr-2" />
                      Refresh
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light"
                      onClick={exportAttendance}
                    >
                      <FileDown size={16} className="mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow-DEFAULT" />
                    <Input
                      placeholder="Search by name, ID, or department..."
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
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Actions</TableHead>
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
                          <TableCell className="font-medium">{record.user.employeeId}</TableCell>
                          <TableCell>{`${record.user.firstName} ${record.user.lastName}`}</TableCell>
                          <TableCell>{record.user.department}</TableCell>
                          <TableCell>{format(new Date(record.date), 'yyyy-MM-dd')}</TableCell>
                          <TableCell>{formatTime(record.timeIn)}</TableCell>
                          <TableCell>{formatTime(record.timeOut)}</TableCell>
                          <TableCell>{getStatusBadge(record)}</TableCell>
                          <TableCell>{formatHours(record.hoursWorked)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 p-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance record for {editingRecord && `${editingRecord.user.firstName} ${editingRecord.user.lastName}`}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">Date</Label>
              <Input
                id="edit-date"
                type="date"
                className="col-span-3"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-timeIn" className="text-right">Time In</Label>
              <Input
                id="edit-timeIn"
                type="time"
                className="col-span-3"
                value={formData.timeIn}
                onChange={(e) => setFormData(prev => ({ ...prev, timeIn: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-timeOut" className="text-right">Time Out</Label>
              <Input
                id="edit-timeOut"
                type="time"
                className="col-span-3"
                value={formData.timeOut}
                onChange={(e) => setFormData(prev => ({ ...prev, timeOut: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditRecord}>Update Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}