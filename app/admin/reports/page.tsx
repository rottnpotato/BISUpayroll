"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, Download, Printer, BarChart, PieChart, CalendarRange, 
  Users, Search, Filter, RefreshCcw
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

interface Report {
  id: string
  name: string
  type: string
  generatedBy: string
  generatedOn: string
  status: string
  downloadUrl: string
}

// Mock reports data
const recentReports: Report[] = [
  { 
    id: "RPT-2023-001", 
    name: "Monthly Payroll Summary - November 2023", 
    type: "payroll", 
    generatedBy: "Admin", 
    generatedOn: "2023-12-05 09:15:22",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-002", 
    name: "Attendance Summary - November 2023", 
    type: "attendance", 
    generatedBy: "HR Manager", 
    generatedOn: "2023-12-04 14:30:45",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-003", 
    name: "Employee Tax Withholdings - Q4 2023", 
    type: "tax", 
    generatedBy: "Admin", 
    generatedOn: "2023-12-02 11:05:30",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-004", 
    name: "Department Expense Report - November 2023", 
    type: "expense", 
    generatedBy: "Finance Director", 
    generatedOn: "2023-12-01 10:22:15",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-005", 
    name: "Annual Leave Balance Report", 
    type: "leave", 
    generatedBy: "System", 
    generatedOn: "2023-11-30 08:45:10",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-006", 
    name: "Overtime Analysis - Q4 2023", 
    type: "attendance", 
    generatedBy: "Admin", 
    generatedOn: "2023-11-28 15:40:05",
    status: "ready",
    downloadUrl: "#"
  },
  { 
    id: "RPT-2023-007", 
    name: "Custom Payroll Report - December 2023", 
    type: "payroll", 
    generatedBy: "Admin", 
    generatedOn: "2023-12-10 13:25:30",
    status: "processing",
    downloadUrl: "#"
  }
]

// Report templates
const reportTemplates = [
  {
    id: "template-001",
    name: "Payroll Summary",
    description: "Monthly summary of all employee payroll information",
    icon: <FileText className="h-6 w-6 text-blue-500" />,
    category: "payroll"
  },
  {
    id: "template-002",
    name: "Attendance Report",
    description: "Employee attendance, late arrivals, and absences",
    icon: <Users className="h-6 w-6 text-green-500" />,
    category: "attendance"
  },
  {
    id: "template-003",
    name: "Tax Withholding Report",
    description: "Summary of tax withholdings for all employees",
    icon: <BarChart className="h-6 w-6 text-purple-500" />,
    category: "tax"
  },
  {
    id: "template-004",
    name: "Department Expense Report",
    description: "Breakdown of expenses by department",
    icon: <PieChart className="h-6 w-6 text-orange-500" />,
    category: "expense"
  },
  {
    id: "template-005",
    name: "Leave Balance Report",
    description: "Employee leave balances and usage",
    icon: <CalendarRange className="h-6 w-6 text-red-500" />,
    category: "leave"
  }
]

// Report types for filtering
const reportTypes = [
  "All Types",
  "Payroll",
  "Attendance",
  "Tax",
  "Expense",
  "Leave"
]

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReportType, setSelectedReportType] = useState("All Types")
  const [selectedTab, setSelectedTab] = useState("recent")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  })

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
      setReports(recentReports)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Filter reports based on search term and type
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      report.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = 
      selectedReportType === "All Types" || 
      report.type.toLowerCase() === selectedReportType.toLowerCase()
    
    return matchesSearch && matchesType
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
      case "ready":
        return <Badge className="bg-green-500">Ready</Badge>
      case "processing":
        return <Badge className="bg-yellow-500">Processing</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
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
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Reports</h1>
        <p className="text-gray-600">Generate and view system reports</p>
      </motion.div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="text-white w-full bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium border border-bisu-yellow-DEFAULT/20">
          <TabsTrigger 
            value="recent" 
            className="flex-1 data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-yellow-light"
          >
            Recent Reports
          </TabsTrigger>
          <TabsTrigger 
            value="generate" 
            className="flex-1 data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-yellow-light"
          >
            Generate Report
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <SkeletonCard lines={8} />
        ) : (
          <>
            <TabsContent value="recent" className="mt-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <CardTitle className="text-bisu-yellow-DEFAULT">Recent Reports</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-purple-light">
                          <RefreshCcw size={16} className="mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow-DEFAULT" />
                        <Input
                          placeholder="Search reports..."
                          className="pl-10 bg-bisu-purple-light text-white placeholder:text-bisu-yellow-DEFAULT/70 border-bisu-yellow-DEFAULT/30"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                          <SelectTrigger className="w-[180px] bg-bisu-purple-light text-white border-bisu-yellow-DEFAULT/30">
                            <Filter size={16} className="mr-2 text-bisu-yellow-DEFAULT" />
                            <SelectValue placeholder="Report Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {reportTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[240px] justify-start text-left bg-transparent font-normal text-bisu-yellow-DEFAULT border-bisu-yellow-DEFAULT/30">
                              <CalendarRange className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange?.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Generated By</TableHead>
                          <TableHead>Generated On</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                              No reports found matching the current filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredReports.map((report) => (
                            <TableRow key={report.id} className="transition-colors hover:bg-gray-50">
                              <TableCell className="font-medium">{report.id}</TableCell>
                              <TableCell>{report.name}</TableCell>
                              <TableCell className="capitalize">{report.type}</TableCell>
                              <TableCell>{report.generatedBy}</TableCell>
                              <TableCell>{report.generatedOn}</TableCell>
                              <TableCell>{getStatusBadge(report.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-blue-500"
                                    disabled={report.status !== "ready"}
                                  >
                                    <Download size={16} />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-green-500"
                                    disabled={report.status !== "ready"}
                                  >
                                    <Printer size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="generate" className="mt-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={selectedTab === "generate" ? "visible" : "hidden"}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {reportTemplates.map((template) => (
                  <motion.div key={template.id} variants={itemVariants}>
                    <Card className="shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-transparent hover:border-bisu-yellow-DEFAULT">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
                          {template.icon}
                        </div>
                        <div>
                          <CardTitle className="text-bisu-purple-deep">{template.name}</CardTitle>
                          <CardDescription className="text-gray-600">{template.description}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Start Date</p>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <CalendarRange className="mr-2 h-4 w-4" />
                                    <span>Pick a date</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">End Date</p>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <CalendarRange className="mr-2 h-4 w-4" />
                                    <span>Pick a date</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF Document</SelectItem>
                              <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                              <SelectItem value="csv">CSV File</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button className="w-full bg-bisu-purple-deep hover:bg-bisu-purple-medium">
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
} 