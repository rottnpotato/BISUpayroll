"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Clock, DollarSign, AlertTriangle, CheckCircle, LogIn, LogOut, ChevronRight, Printer } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Spinner } from "@/components/ui/spinner"

// Mock data
const employeeData = {
  currentSalaryRate: "₱1,200.00",
  prospectedSalary: "₱25,200.00",
  latesThisMonth: 3,
  absencesThisMonth: 0,
  hoursWorkedToday: 0,
  isTimedIn: false,
  lastTimeAction: null as string | null,
}

export default function EmployeeDashboard() {
  const { userName } = useAuth()
  const [currentTimePHT, setCurrentTimePHT] = useState("")
  const [isTimedIn, setIsTimedIn] = useState(employeeData.isTimedIn)
  const [lastActionTime, setLastActionTime] = useState<string | null>(employeeData.lastTimeAction)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isTimeActionLoading, setIsTimeActionLoading] = useState(false)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTimePHT(
        now.toLocaleString("en-US", {
          timeZone: "Asia/Manila",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTimeLog = () => {
    setIsTimeActionLoading(true)

    // Simulate API call
    setTimeout(() => {
      const now = new Date()
      const timeString = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
      })

      setIsTimedIn(!isTimedIn)
      setLastActionTime(`${isTimedIn ? "Timed Out" : "Timed In"} at ${timeString}`)
      setIsTimeActionLoading(false)
    }, 1000)
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

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-6 bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium rounded-lg text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-bisu-yellow-DEFAULT mb-2">Hello, {userName}!</h1>
            <p className="text-bisu-purple-extralight">Welcome to your payroll dashboard</p>
          </div>
          <div className="text-right flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2 text-bisu-yellow-light">
              <Clock size={20} />
              <span className="text-lg font-mono">{currentTimePHT || "Loading..."}</span>
            </div>
            <p className="text-sm text-bisu-purple-extralight">Philippine Standard Time</p>
            <Button 
              onClick={() => window.print()} 
              size="sm"
              className="mt-2 bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep print:hidden"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Dashboard
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isLoading ? "hidden" : "visible"}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column */}
        <motion.div variants={itemVariants} className="space-y-6">
          {isLoading ? (
            <>
              <SkeletonCard hasHeader={true} lines={3} />
              <SkeletonCard hasHeader={true} lines={5} />
            </>
          ) : (
            <>
              {/* Time Clock */}
              <Card className="border-l-4 border-l-bisu-yellow-DEFAULT shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                  <CardTitle className="text-bisu-purple-deep flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Time Clock
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <Button
                    onClick={handleTimeLog}
                    disabled={isTimeActionLoading}
                    className={`w-full py-6 text-lg font-semibold ${
                      isTimedIn
                        ? "bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep"
                        : "bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
                    }`}
                  >
                    {isTimeActionLoading ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : isTimedIn ? (
                      <LogOut className="mr-2 h-5 w-5" />
                    ) : (
                      <LogIn className="mr-2 h-5 w-5" />
                    )}
                    {isTimedIn ? "Time Out" : "Time In"}
                  </Button>
                  {lastActionTime && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`flex items-center space-x-2 text-sm p-3 rounded-md ${
                        isTimedIn ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isTimedIn ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      <span>{lastActionTime}</span>
                    </motion.div>
                  )}
                  {!lastActionTime && <p className="text-sm text-gray-500 text-center">No activity yet today</p>}
                </CardContent>
              </Card>

              {/* Mini Calendar */}
              <Card className="shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                  <CardTitle className="text-bisu-purple-deep">Calendar</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-4">
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
            </>
          )}
        </motion.div>

        {/* Right Column */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonCard hasHeader={false} lines={2} />
                <SkeletonCard hasHeader={false} lines={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonCard hasHeader={false} lines={2} />
                <SkeletonCard hasHeader={false} lines={2} />
              </div>
              <SkeletonCard hasHeader={true} lines={4} />
            </>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-red-500 card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Lates This Month</CardTitle>
                    <AlertTriangle
                      className={`h-4 w-4 ${employeeData.latesThisMonth > 0 ? "text-red-500" : "text-green-500"}`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{employeeData.latesThisMonth}</div>
                    <p
                      className={`text-xs mt-1 ${employeeData.latesThisMonth > 0 ? "text-red-500" : "text-green-500"}`}
                    >
                      {employeeData.latesThisMonth > 0 ? "Be mindful of punctuality" : "Great job on punctuality!"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Absences This Month</CardTitle>
                    <AlertTriangle
                      className={`h-4 w-4 ${employeeData.absencesThisMonth > 0 ? "text-red-500" : "text-green-500"}`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{employeeData.absencesThisMonth}</div>
                    <p className="text-xs text-green-500 mt-1">Keep up the good attendance</p>
                  </CardContent>
                </Card>
              </div>

              {/* Salary Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-bisu-yellow-DEFAULT card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Current Salary Rate</CardTitle>
                    <DollarSign className="h-4 w-4 text-bisu-yellow-dark" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{employeeData.currentSalaryRate}</div>
                    <p className="text-xs text-gray-500 mt-1">Per day</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-bisu-purple-deep card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Prospected Salary</CardTitle>
                    <DollarSign className="h-4 w-4 text-bisu-purple-deep" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{employeeData.prospectedSalary}</div>
                    <p className="text-xs text-gray-500 mt-1">Current period estimate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
                  <CardTitle className="text-bisu-yellow-DEFAULT">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <Button variant="outline" className="btn-outline-primary group justify-between">
                    <span>View Attendance History</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button variant="outline" className="btn-outline-secondary group justify-between">
                    <span>Download Payslip</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button variant="outline" className="btn-outline-primary group justify-between">
                    <span>Update Profile</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button variant="outline" className="btn-outline-secondary group justify-between">
                    <span>Request Leave</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
