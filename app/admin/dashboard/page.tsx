"use client"

import { Search, ChevronRight, Filter, ArrowUpDown, Calendar, FileText, Download } from "lucide-react"
import DashboardDataProvider from "./components/dashboard-data-provider"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import PayrollOverview from "./components/payrollOverview"
import PayrollBreakdown from "./components/payroll-breakdown"
import EmployeeTable from "./components/employee-table"
import DashboardTabs from "./components/dashboard-tabs"
import ScheduleCard from "./components/schedule-card"
import PayrollAlerts from "./components/PayrollAlerts"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin")
  const [currentDate, setCurrentDate] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [sortBy, setSortBy] = useState("Name")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Set formatted current date
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    setCurrentDate(now.toLocaleDateString('en-US', options))
    
    // Get admin name from session or use default
    const fetchAdminName = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data?.firstName) {
            setAdminName(data.firstName)
          }
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
      }
    }

    fetchAdminName()
  }, [])

  const handleCalendarClick = () => {
    router.push('/admin/attendance')
  }

  const handleReportsClick = () => {
    router.push('/admin/payroll')
  }

  const handleExportClick = async () => {
    try {
      toast({
        title: "Generating Export",
        description: "Preparing dashboard data for export...",
      })

      // Generate export for current month
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const exportUrl = new URL('/api/admin/reports', window.location.origin)
      exportUrl.searchParams.set('type', 'dashboard-export')
      exportUrl.searchParams.set('startDate', startDate.toISOString())
      exportUrl.searchParams.set('endDate', endDate.toISOString())
      exportUrl.searchParams.set('format', 'csv')

      const response = await fetch(exportUrl.toString())
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dashboard-export-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Dashboard data has been downloaded successfully.",
      })
    } catch (error) {
      // If export API is not available, redirect to payroll page
      toast({
        title: "Redirecting to Payroll",
        description: "Opening payroll page for data export options.",
      })
      router.push('/admin/payroll')
    }
  }

  const handleDepartmentFilter = () => {
    const departments = ["All Departments", "Computer Science", "Information Technology", "Engineering", "Business"]
    const currentIndex = departments.indexOf(selectedDepartment)
    const nextIndex = (currentIndex + 1) % departments.length
    setSelectedDepartment(departments[nextIndex])
    
    toast({
      title: "Filter Updated",
      description: `Showing employees from: ${departments[nextIndex]}`,
    })
  }

  const handleStatusFilter = () => {
    const statuses = ["All Status", "Active", "Inactive", "On Leave"]
    const currentIndex = statuses.indexOf(selectedStatus)
    const nextIndex = (currentIndex + 1) % statuses.length
    setSelectedStatus(statuses[nextIndex])
    
    toast({
      title: "Filter Updated",
      description: `Showing employees with status: ${statuses[nextIndex]}`,
    })
  }

  const handleSortChange = () => {
    const sortOptions = ["Name", "Department", "Salary", "Status"]
    const currentIndex = sortOptions.indexOf(sortBy)
    const nextIndex = (currentIndex + 1) % sortOptions.length
    setSortBy(sortOptions[nextIndex])
    
    toast({
      title: "Sort Updated",
      description: `Sorting by: ${sortOptions[nextIndex]}`,
    })
  }

  return (
    <DashboardDataProvider>
      {({ dashboardData, isLoading, error, refreshData }) => (
        <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 p-4 pb-12">
          <div className="max-w-8xl mx-auto">
            {/* Dashboard Header */}
            <motion.div 
              className="mb-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-bisu-purple-deep via-bisu-purple-medium to-bisu-purple-light shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <motion.h1 
                      className="text-3xl md:text-4xl font-bold text-bisu-yellow mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      Welcome back, {adminName}
                    </motion.h1>
                    <motion.p 
                      className="text-bisu-yellow-light/90 text-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      {currentDate}
                    </motion.p>
                    <motion.p 
                      className="text-white/80 text-sm mt-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      BISU Payroll Management System
                    </motion.p>
                  </div>
                  
                  <motion.div 
                    className="flex flex-wrap items-center gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm shadow-lg transition-all duration-200"
                      onClick={handleCalendarClick}
                    >
                      <Calendar className="h-4 w-4" />
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm shadow-lg transition-all duration-200"
                      onClick={handleReportsClick}
                    >
                      <FileText className="h-4 w-4" />
                      Reports
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="flex items-center gap-2 bg-bisu-yellow hover:bg-bisu-yellow-dark text-bisu-purple-deep font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
                      onClick={handleExportClick}
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-bisu-yellow/10 rounded-full animate-pulse-subtle"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-bisu-yellow/10 rounded-full animate-pulse-subtle"></div>
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full"></div>
            </motion.div>
          
            {/* Breadcrumb Navigation */}
            <motion.div 
              className="flex items-center text-sm mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-bisu-purple-200/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-bisu-purple-medium font-medium">BISU Payrolls</div>
              <ChevronRight className="h-4 w-4 mx-2 text-bisu-purple-light" />
              <div className="font-semibold text-bisu-purple-deep bg-bisu-yellow-extralight px-3 py-1 rounded-full">
                Admin Dashboard
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <PayrollOverview 
                    data={dashboardData} 
                    isLoading={isLoading} 
                    companyName="BISU Balilihan Campus"
                  />
                </motion.div>
              </div>
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ScheduleCard />
                </motion.div>
              </div>
            </div>
            
            {/* Payroll Alerts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <PayrollAlerts 
                data={dashboardData}
                isLoading={isLoading}
              />
            </motion.div>
            
              {/* Payroll Breakdown Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PayrollBreakdown 
                data={dashboardData}
                isLoading={isLoading}
              />
            </motion.div>
            
            {/* Dashboard Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <DashboardTabs 
                dashboardData={dashboardData}
                isLoading={isLoading}
              />
            </motion.div>
            
          
            
            {/* Employee Table Section */}
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Employee Payroll Details</h2>
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-300 shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDepartmentFilter}
                    className="flex items-center gap-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <Filter className="h-4 w-4" />
                    {selectedDepartment}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleStatusFilter}
                    className="flex items-center gap-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <Filter className="h-4 w-4" />
                    {selectedStatus}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSortChange}
                    className="flex items-center gap-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    Sort by: {sortBy}
                  </Button>
                </div>
              </div>
              
              <EmployeeTable 
                data={dashboardData?.recentActivity?.payroll || []}
                isLoading={isLoading}
                searchTerm={searchTerm}
                selectedDepartment={selectedDepartment}
                selectedStatus={selectedStatus}
                sortBy={sortBy}
              />
            </motion.div>
          </div>
        </div>
      )}
    </DashboardDataProvider>
  )
}
