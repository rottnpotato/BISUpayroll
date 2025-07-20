"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, Download, Printer, BarChart, PieChart, CalendarRange, 
  Users, Search, Filter, RefreshCcw, Eye
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Report {
  id: string
  name: string
  type: string
  generatedBy: string
  generatedOn: string
  status: string
  downloadUrl: string
}

interface PayrollData {
  id: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
    department: string
    position: string
    salary: number | string | null
  }
  payPeriodStart: string
  payPeriodEnd: string
  baseSalary: number | string | null
  overtime: number | string | null
  deductions: number | string | null
  bonuses: number | string | null
  grossPay: number | string | null
  netPay: number | string | null
  attendanceData: {
    daysPresent: number | null
    hoursWorked: number | string | null
    lateHours: number | string | null
  }
  deductionBreakdown: {
    withholdingTax: number | string | null
    citySavingsLoan: number | string | null
    pagibigContribution: number | string | null
  }
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
  }
]

// Report templates
const reportTemplates = [
  {
    id: "template-001",
    name: "Monthly Payroll Report",
    description: "Generate comprehensive payroll for all employees with attendance-based calculations",
    icon: <FileText className="h-6 w-6 text-blue-500" />,
    category: "payroll",
    type: "monthly"
  },
  {
    id: "template-002",
    name: "Department Payroll Report",
    description: "Generate payroll report filtered by specific department",
    icon: <Users className="h-6 w-6 text-green-500" />,
    category: "payroll",
    type: "department"
  },
  {
    id: "template-003",
    name: "Custom Period Payroll",
    description: "Generate payroll for custom date range with detailed calculations",
    icon: <CalendarRange className="h-6 w-6 text-purple-500" />,
    category: "payroll",
    type: "custom"
  },
  {
    id: "template-004",
    name: "Tax Withholding Summary",
    description: "Detailed breakdown of tax withholdings and contributions",
    icon: <BarChart className="h-6 w-6 text-orange-500" />,
    category: "tax",
    type: "tax"
  }
]

export default function PayrollGenerationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReportType, setSelectedReportType] = useState("All Types")
  const [selectedTab, setSelectedTab] = useState("recent")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  })
  const [templateDateRanges, setTemplateDateRanges] = useState<Record<string, DateRange | undefined>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [payrollData, setPayrollData] = useState<PayrollData[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setReports(recentReports)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      report.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = 
      selectedReportType === "All Types" || 
      report.type.toLowerCase() === selectedReportType.toLowerCase()
    
    return matchesSearch && matchesType
  })

  // Generate payroll data
  const generatePayroll = async (template: any) => {
    const templateDateRange = templateDateRanges[template.id]
    if (!templateDateRange?.from || !templateDateRange?.to) {
      toast({
        title: "Error",
        description: "Please select both start and end dates for this template",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setSelectedTemplate(template)

    try {
      console.log("Generating payroll with params:", {
        payPeriodStart: templateDateRange.from.toISOString(),
        payPeriodEnd: templateDateRange.to.toISOString(),
        department: selectedDepartment === "all" ? undefined : selectedDepartment,
        role: "EMPLOYEE"
      })

      const response = await fetch('/api/admin/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payPeriodStart: templateDateRange.from.toISOString(),
          payPeriodEnd: templateDateRange.to.toISOString(),
          department: selectedDepartment === "all" ? undefined : selectedDepartment,
          role: "EMPLOYEE"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Payroll generation failed:', errorData)
        throw new Error(errorData.error || 'Failed to generate payroll')
      }

      const result = await response.json()
      console.log("Payroll generation result:", result)
      
      // Check if we have records
      if (!result.records || result.records.length === 0) {
        toast({
          title: "No Data", 
          description: `No employees found for the selected criteria. Generated: ${result.generated || 0} records. Please check if employees have role 'EMPLOYEE', are active, and have salary configured.`,
          variant: "destructive"
        })
        return
      }

      // Fetch additional data for detailed payroll
      const detailedPayroll = await Promise.all(
        result.records.map(async (record: any) => {
          // Fetch attendance data
          const attendanceResponse = await fetch(
            `/api/admin/attendance?userId=${record.userId}&startDate=${templateDateRange.from?.toISOString()}&endDate=${templateDateRange.to?.toISOString()}`
          )
          
          if (!attendanceResponse.ok) {
            console.warn(`Failed to fetch attendance for user ${record.userId}`)
          }
          
          const attendanceData = await attendanceResponse.json()
          console.log(`Attendance data for user ${record.userId}:`, attendanceData)
          
          // Calculate attendance summary
          const daysPresent = attendanceData.records?.filter((r: any) => r.timeIn && r.timeOut).length || 0
          const hoursWorked = attendanceData.records?.reduce((sum: number, r: any) => 
            sum + (r.hoursWorked ? parseFloat(r.hoursWorked.toString()) : 0), 0) || 0
          const lateHours = attendanceData.records?.reduce((sum: number, r: any) => 
            sum + (r.isLate ? 1 : 0), 0) || 0

          // Calculate deduction breakdown
          const grossPay = parseFloat(record.grossPay?.toString() || '0')
          const withholdingTax = grossPay * 0.12 // 12% tax
          const citySavingsLoan = 0 // Default to 0, could be from rules
          const pagibigContribution = grossPay * 0.02 // 2% PAG-IBIG

          return {
            ...record,
            attendanceData: {
              daysPresent,
              hoursWorked,
              lateHours
            },
            deductionBreakdown: {
              withholdingTax,
              citySavingsLoan,
              pagibigContribution
            }
          }
        })
      )

      console.log("Detailed payroll data:", detailedPayroll)
      setPayrollData(detailedPayroll)
      setShowPreview(true)
      
      toast({
        title: "Success",
        description: `Payroll generated for ${result.generated} employees`,
      })
    } catch (error) {
      console.error('Error generating payroll:', error)
      toast({
        title: "Error",
        description: "Failed to generate payroll report",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Print payroll - create new window for clean printing
  const printPayroll = () => {
    const templateDateRange = templateDateRanges[selectedTemplate?.id]
    if (!templateDateRange?.from || !templateDateRange?.to || !payrollData.length) {
      toast({
        title: "Error",
        description: "No payroll data available to print",
        variant: "destructive"
      })
      return
    }

    // Create new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to print the payroll",
        variant: "destructive"
      })
      return
    }

    // Generate HTML for the print window
    const printContent = generatePrintHTML(payrollData, templateDateRange)
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Auto-print after content loads
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 100)
    }
    
    // Close preview dialog
    setShowPreview(false)
  }

  // Generate HTML for printing
  const generatePrintHTML = (data: PayrollData[], dateRange: DateRange) => {
    const sortedData = data.sort((a, b) => 
      `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`)
    )

    const tableRows = sortedData.map((employee, index) => {
      const salary = parseFloat(employee.user.salary?.toString() || '0')
      const baseSalary = parseFloat(employee.baseSalary?.toString() || '0')
      const deductions = parseFloat(employee.deductions?.toString() || '0')
      const netPay = parseFloat(employee.netPay?.toString() || '0')
      const hoursWorked = parseFloat(employee.attendanceData.hoursWorked?.toString() || '0')
      const lateHours = parseFloat(employee.attendanceData.lateHours?.toString() || '0')
      const withholdingTax = parseFloat(employee.deductionBreakdown.withholdingTax?.toString() || '0')
      const citySavingsLoan = parseFloat(employee.deductionBreakdown.citySavingsLoan?.toString() || '0')
      const pagibigContribution = parseFloat(employee.deductionBreakdown.pagibigContribution?.toString() || '0')

      const hourlyRate = salary > 0 ? salary / (30 * 8) : 0
      const dailyRate = salary > 0 ? salary / 30 : 0
      const earnedForPeriod = baseSalary
      const undertimeDeduction = lateHours * hourlyRate * 0.5
      const grossAmount = earnedForPeriod - undertimeDeduction

      return `
        <tr style="border-bottom: 1px solid #ccc;">
          <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
          <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
          <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${hourlyRate.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${dailyRate.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.attendanceData.daysPresent || 0}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${hoursWorked.toFixed(1)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${earnedForPeriod.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${undertimeDeduction.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${grossAmount.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${withholdingTax.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${citySavingsLoan.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${pagibigContribution.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${deductions.toFixed(2)}</td>
          <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${netPay.toFixed(2)}</td>
          <td style="padding: 4px;"></td>
        </tr>
      `
    }).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BISU Payroll Report</title>
        <style>
          @page {
            size: landscape;
            margin: 0.5in;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 0;
            color: black;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 16px;
            margin: 0 0 10px 0;
            font-weight: bold;
          }
          .header h2 {
            font-size: 14px;
            margin: 0 0 20px 0;
            font-weight: normal;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
          }
          .acknowledgment {
            margin-bottom: 15px;
            font-size: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
          }
          th, td {
            border: 1px solid #000;
            padding: 2px;
            font-size: 8px;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
          }
          .cert-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
          }
          .cert-box {
            border: 1px solid #000;
            padding: 10px;
            position: relative;
            min-height: 60px;
          }
          .cert-letter {
            position: absolute;
            top: 2px;
            right: 5px;
            width: 15px;
            height: 15px;
            border: 1px solid #000;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
          }
          .cert-content {
            font-size: 9px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAYROLL - CONTRACT OF SERVICE INSTRUCTORS - of BISU Balilihan Campus</h1>
          <h2>For the Period: ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}</h2>
        </div>

        <div class="info-section">
          <div>
            <p><strong>Entity Name:</strong> BISU Balilihan Campus</p>
            <p><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Payroll no.:</strong> _________________________</p>
            <p><strong>Sheet no.:</strong> 1 of 1</p>
          </div>
        </div>

        <div class="acknowledgment">
          <p>We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}.</p>
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="2">Serial No.</th>
              <th rowspan="2">Name</th>
              <th rowspan="2">Position</th>
              <th rowspan="2">Employee No.</th>
              <th colspan="7">Compensations</th>
              <th colspan="4">Deductions/Contributions</th>
              <th rowspan="2">Net Amount Due</th>
              <th rowspan="2">Signature</th>
            </tr>
            <tr>
              <th>Rate per Hour</th>
              <th>Rate per Day</th>
              <th>No. of Days</th>
              <th>No. of Hours</th>
              <th>Earned for Period</th>
              <th>Less: Undertime</th>
              <th>Gross Amount Earned</th>
              <th>Withholding Tax</th>
              <th>City Savings Loan</th>
              <th>Pag-ibig Contribution</th>
              <th>Total Deductions</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="cert-section">
          <div class="cert-box">
            <div class="cert-letter">A</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Shiela Olaguir</strong></p>
              <p>Dean of CCIS</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">B</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Jean F. Nebrea</strong></p>
              <p>Campus Director</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">C</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Julie Mae Sembrano</strong></p>
              <p>Accountant II</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">D</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Anneli Uy</strong></p>
              <p>Disbursing Officer</p>
            </div>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <div class="cert-box">
            <div class="cert-content">
              <p><strong>Additional Certifiers:</strong></p>
              <p><strong>Junrey Poyos</strong> - Dean of CTAS</p>
              <p><strong>Mary Joyce Gudmalin</strong> - Dean of CCJ</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Test function to check users
  const testUsers = async () => {
    try {
      const response = await fetch('/api/test-users')
      const data = await response.json()
      console.log("User test results:", data)
      toast({
        title: "User Test Results",
        description: `Found ${data.employeesWithSalary} eligible employees out of ${data.totalUsers} total users. Check console for details.`,
      })
    } catch (error) {
      console.error('Error testing users:', error)
      toast({
        title: "Error",
        description: "Failed to test users",
        variant: "destructive"
      })
    }
  }

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
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Payroll Generation</h1>
        <p className="text-gray-600">Generate comprehensive payroll reports with attendance integration</p>
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
            Generate Payroll
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
                        <Button variant="outline" onClick={testUsers} className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-purple-light">
                          <Users size={16} className="mr-2" />
                          Test Users
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
                            {["All Types", "Payroll", "Attendance", "Tax", "Expense", "Leave"].map((type) => (
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
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {reportTemplates.map((template) => (
                  <motion.div key={template.id} variants={itemVariants}>
                    <Card className="shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-transparent hover:border-bisu-yellow-DEFAULT h-full">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-bisu-purple-deep">{template.name}</CardTitle>
                          <CardDescription className="text-gray-600">{template.description}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <div className="space-y-4 flex-1">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Payroll Period</p>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <CalendarRange className="mr-2 h-4 w-4" />
                                    {templateDateRanges[template.id]?.from ? (
                                      templateDateRanges[template.id]?.to ? (
                                        <>
                                          {format(templateDateRanges[template.id]!.from!, "LLL dd, yyyy")} - {format(templateDateRanges[template.id]!.to!, "LLL dd, yyyy")}
                                        </>
                                      ) : (
                                        format(templateDateRanges[template.id]!.from!, "LLL dd, yyyy")
                                      )
                                    ) : (
                                      <span>Select date range</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={templateDateRanges[template.id]?.from}
                                    selected={templateDateRanges[template.id]}
                                    onSelect={(range) => setTemplateDateRanges(prev => ({
                                      ...prev,
                                      [template.id]: range
                                    }))}
                                    numberOfMonths={2}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            {template.type === 'department' && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2">Department</p>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    <SelectItem value="CCIS">CCIS</SelectItem>
                                    <SelectItem value="CTAS">CTAS</SelectItem>
                                    <SelectItem value="CCJ">CCJ</SelectItem>
                                    <SelectItem value="CTE">CTE</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-bisu-purple-deep hover:bg-bisu-purple-medium mt-4"
                          onClick={() => generatePayroll(template)}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Payroll
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Payroll Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-bold text-bisu-purple-deep mb-4">
              Payroll Report Preview
            </DialogTitle>
            <div className="flex items-center justify-end gap-6 pr-8">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                <Eye className="mr-2 h-4 w-4" />
                Close Preview
              </Button>
              <Button onClick={printPayroll} className="bg-bisu-purple-deep hover:bg-bisu-purple-medium">
                <Printer className="mr-2 h-4 w-4" />
                Print Payroll
              </Button>
            </div>
          </DialogHeader>
          <div className="payroll-report">
            {/* Simplified styling since we use new window for printing */}
            <style jsx>{`
              .payroll-report {
                font-size: 12px;
                color: black;
                background: white;
                padding: 20px;
              }
            `}</style>
            
            {/* BISU Payroll Header */}
            <div className="text-center mb-8 print:mb-4">
              <h1 className="text-2xl font-bold mb-2 print:text-lg">
                PAYROLL - CONTRACT OF SERVICE INSTRUCTORS - of BISU Balilihan Campus
              </h1>
              <h2 className="text-lg font-semibold print:text-base">
                For the Period: {selectedTemplate && templateDateRanges[selectedTemplate.id]?.from && templateDateRanges[selectedTemplate.id]?.to && 
                  `${format(templateDateRanges[selectedTemplate.id]!.from!, 'MMMM dd, yyyy')} - ${format(templateDateRanges[selectedTemplate.id]!.to!, 'MMMM dd, yyyy')}`
                }
              </h2>
            </div>

            <div className="mb-6 print:mb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p><strong>Entity Name:</strong> BISU Balilihan Campus</p>
                  <p><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
                </div>
                <div className="space-y-1 text-right">
                  <p><strong>Payroll no.:</strong> _________________________</p>
                  <p><strong>Sheet no.:</strong> 1 of 1</p>
                </div>
              </div>
            </div>

            <div className="mb-4 print:mb-2">
              <p className="text-sm">
                We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered {selectedTemplate && templateDateRanges[selectedTemplate.id]?.from && templateDateRanges[selectedTemplate.id]?.to && 
                  `${format(templateDateRanges[selectedTemplate.id]!.from!, 'MMMM dd, yyyy')} - ${format(templateDateRanges[selectedTemplate.id]!.to!, 'MMMM dd, yyyy')}`}.
              </p>
            </div>

            {/* Payroll Table */}
            <div className="border border-black mb-6">
              <table className="w-full border-collapse text-xs print:text-[10px]">
                <thead>
                  <tr className="border-b border-black">
                    <th rowSpan={2} className="border-r border-black p-1 w-8">Serial No.</th>
                    <th rowSpan={2} className="border-r border-black p-1 w-32">Name</th>
                    <th rowSpan={2} className="border-r border-black p-1 w-24">Position</th>
                    <th rowSpan={2} className="border-r border-black p-1 w-20">Employee No.</th>
                    <th colSpan={7} className="border-r border-black p-1 text-center">Compensations</th>
                    <th colSpan={4} className="border-r border-black p-1 text-center">Deductions/Contributions</th>
                    <th rowSpan={2} className="border-r border-black p-1 w-20">Net Amount Due</th>
                    <th rowSpan={2} className="p-1 w-24">Signature</th>
                  </tr>
                  <tr className="border-b border-black text-[10px] print:text-[8px]">
                    <th className="border-r border-black p-1 w-16">Rate per Hour</th>
                    <th className="border-r border-black p-1 w-16">Rate per Day</th>
                    <th className="border-r border-black p-1 w-12">No. of Days</th>
                    <th className="border-r border-black p-1 w-12">No. of Hours</th>
                    <th className="border-r border-black p-1 w-20">Earned for Period</th>
                    <th className="border-r border-black p-1 w-16">Less: Undertime</th>
                    <th className="border-r border-black p-1 w-20">Gross Amount Earned</th>
                    <th className="border-r border-black p-1 w-16">Withholding Tax</th>
                    <th className="border-r border-black p-1 w-16">City Savings Loan</th>
                    <th className="border-r border-black p-1 w-16">Pag-ibig Contribution</th>
                    <th className="border-r border-black p-1 w-16">Total Deductions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData && payrollData.length > 0 ? (
                    payrollData
                      .sort((a, b) => `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`))
                      .map((employee, index) => {
                      // Safely convert all values to numbers with fallbacks
                      const salary = parseFloat(employee.user.salary?.toString() || '0')
                      const baseSalary = parseFloat(employee.baseSalary?.toString() || '0')
                      const deductions = parseFloat(employee.deductions?.toString() || '0')
                      const netPay = parseFloat(employee.netPay?.toString() || '0')
                      const hoursWorked = parseFloat(employee.attendanceData.hoursWorked?.toString() || '0')
                      const lateHours = parseFloat(employee.attendanceData.lateHours?.toString() || '0')
                      const withholdingTax = parseFloat(employee.deductionBreakdown.withholdingTax?.toString() || '0')
                      const citySavingsLoan = parseFloat(employee.deductionBreakdown.citySavingsLoan?.toString() || '0')
                      const pagibigContribution = parseFloat(employee.deductionBreakdown.pagibigContribution?.toString() || '0')

                      // Calculate rates and amounts
                      const hourlyRate = salary > 0 ? salary / (30 * 8) : 0 // Monthly salary / (30 days * 8 hours)
                      const dailyRate = salary > 0 ? salary / 30 : 0
                      const earnedForPeriod = baseSalary
                      const undertimeDeduction = lateHours * hourlyRate * 0.5 // Half pay for late hours
                      const grossAmount = earnedForPeriod - undertimeDeduction

                      return (
                        <tr key={employee.id} className="border-b border-gray-300">
                          <td className="border-r border-black p-1 text-center">{index + 1}</td>
                          <td className="border-r border-black p-1">{`${employee.user.lastName}, ${employee.user.firstName}`}</td>
                          <td className="border-r border-black p-1">{employee.user.position || 'N/A'}</td>
                          <td className="border-r border-black p-1 text-center">{employee.user.employeeId || 'N/A'}</td>
                          <td className="border-r border-black p-1 text-right">₱{hourlyRate.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{dailyRate.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-center">{employee.attendanceData.daysPresent || 0}</td>
                          <td className="border-r border-black p-1 text-center">{hoursWorked.toFixed(1)}</td>
                          <td className="border-r border-black p-1 text-right">₱{earnedForPeriod.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{undertimeDeduction.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{grossAmount.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{withholdingTax.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{citySavingsLoan.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{pagibigContribution.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{deductions.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">₱{netPay.toFixed(2)}</td>
                          <td className="p-1"></td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={17} className="border-r border-black p-4 text-center text-gray-500">
                        No employee data available. Please generate payroll first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Certification Boxes */}
            <div className="grid grid-cols-2 gap-4 mt-8 print:mt-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-black p-2 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">A</div>
                  <p className="text-xs font-semibold mb-1">Certified:</p>
                  <p className="text-xs font-bold">Shiela Olaguir</p>
                  <p className="text-xs">Dean of CCIS</p>
                </div>
                <div className="border border-black p-2 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">B</div>
                  <p className="text-xs font-semibold mb-1">Certified:</p>
                  <p className="text-xs font-bold">Jean F. Nebrea</p>
                  <p className="text-xs">Campus Director</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-black p-2 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">C</div>
                  <p className="text-xs font-semibold mb-1">Certified:</p>
                  <p className="text-xs font-bold">Julie Mae Sembrano</p>
                  <p className="text-xs">Accountant II</p>
                </div>
                <div className="border border-black p-2 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 border border-black flex items-center justify-center text-xs font-bold">D</div>
                  <p className="text-xs font-semibold mb-1">Certified:</p>
                  <p className="text-xs font-bold">Anneli Uy</p>
                  <p className="text-xs">Disbursing Officer</p>
                </div>
              </div>
            </div>

            <div className="mt-4 print:mt-2 grid grid-cols-2 gap-4">
              <div className="border border-black p-2">
                <p className="text-xs font-semibold mb-1">Additional Certifiers:</p>
                <p className="text-xs"><strong>Junrey Poyos</strong> - Dean of CTAS</p>
                <p className="text-xs"><strong>Mary Joyce Gudmalin</strong> - Dean of CCJ</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 