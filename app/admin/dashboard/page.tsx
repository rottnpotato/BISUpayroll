"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, Clock, TrendingUp, Calendar, FileText, ChevronRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface DashboardData {
  overview: {
    totalEmployees: number
    activeEmployees: number
    todayAttendance: number
    thisWeekAttendance: number
    thisMonthPayroll: {
      total: number
      netTotal: number
      count: number
    }
    unpaidPayroll: number
  }
  departmentStats: Array<{
    department: string
    _count: { id: number }
  }>
  attendanceTrends: Array<{
    date: string
    count: number
  }>
  payrollTrends: Array<{
    month: string
    total: number
  }>
  recentActivity: {
    attendance: Array<{
      id: string
      date: Date
      timeIn: Date | null
      timeOut: Date | null
      isLate: boolean
      isAbsent: boolean
      user: {
        firstName: string
        lastName: string
        employeeId: string | null
        department: string | null
      }
    }>
    payroll: Array<{
      id: string
      grossPay: number
      netPay: number
      isPaid: boolean
      createdAt: Date
      user: {
        firstName: string
        lastName: string
        employeeId: string | null
        department: string | null
      }
    }>
  }
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/dashboard')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the BISU Payroll Management System</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isLoading ? "hidden" : "visible"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {isLoading ? (
          // Skeleton loaders
          <>
            <SkeletonCard hasHeader={false} lines={2} />
            <SkeletonCard hasHeader={false} lines={2} />
            <SkeletonCard hasHeader={false} lines={2} />
            <SkeletonCard hasHeader={false} lines={2} />
          </>
        ) : (
          // Actual content
          <>
            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-bisu-purple-deep card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-bisu-purple-deep" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">
                    {dashboardData?.overview.totalEmployees || 0}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {dashboardData?.overview.activeEmployees || 0} active
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-bisu-yellow-DEFAULT card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Monthly Payroll</CardTitle>
                  <DollarSign className="h-4 w-4 text-bisu-yellow-dark" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">
                    {formatCurrency(dashboardData?.overview.thisMonthPayroll.total || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {dashboardData?.overview.thisMonthPayroll.count || 0} records
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-blue-500 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Today's Attendance</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">
                    {dashboardData?.overview.todayAttendance || 0}
                  </div>
                  <p className="text-xs text-blue-500 mt-1">
                    {dashboardData?.overview.thisWeekAttendance || 0} this week
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-l-4 border-l-red-500 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Unpaid Payroll</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bisu-purple-deep">
                    {dashboardData?.overview.unpaidPayroll || 0}
                  </div>
                  <p className="text-xs text-red-500 mt-1">Requires attention</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Quick Actions and Recent Activity */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isLoading ? "hidden" : "visible"}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <SkeletonCard lines={4} />
          ) : (
            <Card className="shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
                <CardTitle className="text-bisu-yellow-DEFAULT">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <Link href="/admin/users">
                  <Button className="w-full justify-between btn-primary group mb-3">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/admin/payroll">
                  <Button className="w-full justify-between btn-secondary group mb-3">
                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Configure Payroll Rules
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/admin/attendance">
                  <Button variant="outline" className="w-full justify-between btn-outline-primary group mb-3">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Attendance
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/admin/reports">
                  <Button variant="outline" className="w-full justify-between btn-outline-secondary group">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Reports
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <SkeletonCard lines={5} />
          ) : (
            <Card className="shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-bisu-yellow-DEFAULT to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {dashboardData?.recentActivity.attendance.slice(0, 3).map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className="flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-bisu-purple-deep">
                          Attendance recorded
                        </p>
                        <p className="text-xs text-gray-500">
                          by {activity.user.firstName} {activity.user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                      </div>
                    </motion.div>
                  ))}
                  {dashboardData?.recentActivity.payroll.slice(0, 2).map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index + 3) * 0.1 + 0.2 }}
                      className="flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-bisu-purple-deep">
                          Payroll {activity.isPaid ? 'paid' : 'processed'}
                        </p>
                        <p className="text-xs text-gray-500">
                          for {activity.user.firstName} {activity.user.lastName} - {formatCurrency(activity.netPay)}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(activity.createdAt)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
