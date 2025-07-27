"use client"

import { Search, ChevronRight, Filter, ArrowUpDown, Calendar, FileText, Download } from "lucide-react"
import DashboardDataProvider from "./components/dashboard-data-provider"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import PayrollOverview from "./components/payrollOverview"
import PayrollBreakdown from "./components/payroll-breakdown"
import EmployeeTable from "./components/employee-table"
import DashboardTabs from "./components/dashboard-tabs"
import ScheduleCard from "./components/schedule-card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin")
  const [currentDate, setCurrentDate] = useState<string>("")

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

  return (
    <DashboardDataProvider>
      {({ dashboardData, isLoading, error, refreshData }) => (
        <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 p-4 pb-12">
          <div className="max-w-8xl mx-auto">
            {/* Dashboard Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back, {adminName}</h1>
                  <p className="text-gray-500 mt-1">{currentDate}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <Calendar className="h-4 w-4" />
                    July 2025
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Reports
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          
            {/* Breadcrumb Navigation */}
            <div className="flex items-center text-sm text-gray-500 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div>BISU Payrolls</div>
              <ChevronRight className="h-4 w-4 mx-1" />
              <div className="font-medium text-purple-700">Payroll details</div>
            </div>

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
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-300 shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <Filter className="h-4 w-4" />
                    All Departments
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <Filter className="h-4 w-4" />
                    All Status
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    Sort by: Name
                  </Button>
                </div>
              </div>
              
              <EmployeeTable 
                data={dashboardData?.recentActivity?.payroll || []}
                isLoading={isLoading}
              />
            </motion.div>
          </div>
        </div>
      )}
    </DashboardDataProvider>
  )
}
