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
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { EarningsModal } from "@/components/earnings-modal"

// Define employee dashboard data type
interface DashboardData {
  currentSalaryRate: string
  dailyRate: string
  hourlyRate: string
  prospectedSalary: string
  latesThisMonth: number
  absencesThisMonth: number
  hoursWorkedToday: number
  totalHoursThisMonth: number
  expectedHoursThisMonth: number
  overtimeHoursThisMonth: number
  grossPayThisMonth: string
  deductionsThisMonth: string
  isTimedIn: boolean
  lastTimeAction: string | null
}

export default function EmployeeDashboard() {
  const { userName } = useAuth()
  const router = useRouter()
  
  const [currentTimePHT, setCurrentTimePHT] = useState("")
  const [isTimedIn, setIsTimedIn] = useState(false)
  const [lastActionTime, setLastActionTime] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isTimeActionLoading, setIsTimeActionLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  
  // Time action confirmation dialog states
  const [isTimeActionDialogOpen, setIsTimeActionDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'time-in' | 'time-out' | null>(null)
  
  // Earnings modal states
  const [isEarningsModalOpen, setIsEarningsModalOpen] = useState(false)
  const [timeoutEarningsData, setTimeoutEarningsData] = useState<any>(null)
  
  // Time window validation states
  const [isWithinTimeWindow, setIsWithinTimeWindow] = useState(true)
  const [timeWindowMessage, setTimeWindowMessage] = useState("")

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/employee/dashboard')
        const result = await response.json()
        
        if (result.success && result.data) {
          setDashboardData(result.data)
          setIsTimedIn(result.data.isTimedIn)
          setLastActionTime(result.data.lastTimeAction)
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load dashboard data",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "An error occurred while fetching dashboard data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Check time window status
  const checkTimeWindow = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute
    
    const morningStartTime = 6 * 60 // 6:00 AM
    const morningEndTime = 12 * 60 + 59 // 12:59 PM
    
    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
    }
    
    if (currentTime < morningStartTime) {
      // Too early
      const minutesUntilStart = morningStartTime - currentTime
      const hoursUntil = Math.floor(minutesUntilStart / 60)
      const minsUntil = minutesUntilStart % 60
      
      setIsWithinTimeWindow(false)
      setTimeWindowMessage(
        `Time-in opens at 6:00 AM. ${hoursUntil > 0 ? `${hoursUntil}h ` : ''}${minsUntil}m remaining.`
      )
    } else if (currentTime > morningEndTime) {
      // Too late
      setIsWithinTimeWindow(false)
      setTimeWindowMessage(
        `Time-in window closed at 12:59 PM. Please contact your supervisor if you need to record attendance.`
      )
    } else {
      // Within allowed time
      const minutesRemaining = morningEndTime - currentTime
      const hoursRemaining = Math.floor(minutesRemaining / 60)
      const minsRemaining = minutesRemaining % 60
      
      setIsWithinTimeWindow(true)
      setTimeWindowMessage(
        `Time-in available until 12:59 PM. ${hoursRemaining > 0 ? `${hoursRemaining}h ` : ''}${minsRemaining}m remaining.`
      )
    }
  }

  // Update current time every second and check time window
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
      
      // Check time window status every second
      checkTimeWindow()
    }, 1000)
    
    // Initial check
    checkTimeWindow()
    
    return () => clearInterval(timer)
  }, [])

  const handleTimeLogClick = () => {
    const action = isTimedIn ? 'time-out' : 'time-in'
    
    // Check time restrictions for time-in
    if (action === 'time-in') {
      if (!isWithinTimeWindow) {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentTime = currentHour * 60 + currentMinute
        const morningStartTime = 6 * 60 // 6:00 AM
        const morningEndTime = 12 * 60 + 59 // 12:59 PM
        
        let detailedMessage = ""
        let title = ""
        
        if (currentTime < morningStartTime) {
          const minutesUntilStart = morningStartTime - currentTime
          const hoursUntil = Math.floor(minutesUntilStart / 60)
          const minsUntil = minutesUntilStart % 60
          
          title = "Time-in Not Available Yet"
          detailedMessage = `Time-in opens at 6:00 AM. Please wait ${hoursUntil > 0 ? `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} and ` : ''}${minsUntil} minute${minsUntil > 1 ? 's' : ''}.`
        } else {
          title = "Time-in Window Closed"
          detailedMessage = "Time-in is only allowed between 6:00 AM and 12:59 PM (PHT). The window has closed for today. Please contact your supervisor if you need to record your attendance."
        }
        
        toast({
          title: title,
          description: detailedMessage,
          variant: "destructive",
          duration: 6000
        })
        return
      }
    }
    
    // Additional validation to prevent inappropriate actions
    if (action === 'time-in' && isTimedIn) {
      toast({
        title: "Already Timed In",
        description: `You are already timed in for today. ${lastActionTime || ''}`,
        variant: "destructive"
      })
      return
    }
    
    if (action === 'time-out' && !isTimedIn) {
      toast({
        title: "Cannot Time Out",
        description: "You must time in first before you can time out.",
        variant: "destructive"
      })
      return
    }
    
    setPendingAction(action)
    setIsTimeActionDialogOpen(true)
  }

  const confirmTimeAction = async () => {
    if (!pendingAction) return
    
    setIsTimeActionLoading(true)

    try {
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: pendingAction }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        const currentTime = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        
        setIsTimedIn(!isTimedIn)
        setLastActionTime(
          pendingAction === 'time-in' 
            ? `Timed In at ${currentTime}` 
            : `Timed Out at ${currentTime}`
        )
        
        // Show enhanced success notification
        toast({
          title: "Success",
          description: `${pendingAction === 'time-in' ? 'Time-in' : 'Time-out'} recorded successfully at ${currentTime}`,
          variant: "default",
        })
        
        // If this is a time-out and we have earnings data, show the earnings modal
        if (pendingAction === 'time-out' && result.data?.earnings) {
          setTimeoutEarningsData(result.data)
          setIsEarningsModalOpen(true)
        }
        
        // Refresh dashboard data after successful action
        setTimeout(() => {
          router.refresh()
        }, 1000)
        
      } else {
        // Handle specific API error messages for already timed in/out scenarios
        if (result.message.includes('Already timed in')) {
          toast({
            title: "Already Timed In",
            description: `You are already timed in for today. Last time-in was at ${result.data?.time || 'unknown time'}.`,
            variant: "destructive"
          })
          setIsTimedIn(true) // Update local state to match server state
        } else if (result.message.includes('Already timed out')) {
          toast({
            title: "Already Timed Out",
            description: `You have already timed out for today. Last time-out was at ${result.data?.time || 'unknown time'}.`,
            variant: "destructive"
          })
          setIsTimedIn(false) // Update local state to match server state
        } else if (result.message.includes('Cannot time-out without first timing in')) {
          toast({
            title: "Cannot Time Out",
            description: "You must time in first before you can time out.",
            variant: "destructive"
          })
          setIsTimedIn(false) // Update local state to match server state
        } else {
          toast({
            title: "Failed",
            description: result.message || `Failed to record ${pendingAction}. Please try again.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Error during time action:', error)
      toast({
        title: "Error",
        description: `An error occurred while recording ${pendingAction}. Please check your connection and try again.`,
        variant: "destructive",
      })
    } finally {
      setIsTimeActionLoading(false)
      setIsTimeActionDialogOpen(false)
      setPendingAction(null)
    }
  }

  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Navigation handlers for quick action buttons
  const handleNavigateToAttendance = () => router.push('/employee/attendance')
  const handleNavigateToPayslip = () => router.push('/employee/payroll')
  const handleNavigateToProfile = () => router.push('/employee/profile')
  const handleNavigateToLeave = () => router.push('/employee/attendance')

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
      {/* Time Action Confirmation Dialog */}
      <AlertDialog open={isTimeActionDialogOpen} onOpenChange={setIsTimeActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-bisu-purple-deep">
              <Clock className="mr-2 h-5 w-5" />
              Confirm {pendingAction === 'time-in' ? 'Time In' : 'Time Out'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to record your{' '}
              <span className="font-semibold text-bisu-purple-deep">
                {pendingAction === 'time-in' ? 'TIME IN' : 'TIME OUT'}
              </span>{' '}
              at this time?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 px-6">
            <div className="text-center py-4">
              <div className="text-2xl font-mono font-bold text-bisu-purple-deep mb-2">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
              <div className="text-sm text-gray-600">
                {getCurrentTime().split(', ')[0]}, {getCurrentTime().split(', ')[1]}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {pendingAction === 'time-in' && (
                <span className="text-xs text-amber-600 block">
                  ⚠️ Note: Late arrivals after 8:00 AM will be marked as late.
                </span>
              )}
              
              {pendingAction === 'time-out' && (
                <span className="text-xs text-blue-600 block">
                  ✓ Your work hours will be calculated automatically.
                </span>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTimeActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTimeAction}
              disabled={isTimeActionLoading}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium"
            >
              {isTimeActionLoading ? 'Recording...' : `Confirm ${pendingAction === 'time-in' ? 'Time In' : 'Time Out'}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-6 bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium rounded-lg text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-bisu-yellow mb-2">Hello, {userName}!</h1>
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
              className="mt-2 bg-bisu-yellow hover:bg-bisu-yellow-dark text-bisu-purple-deep print:hidden"
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
              <Card className={`border-l-4 shadow-md hover:shadow-lg transition-all duration-300 ${
                isWithinTimeWindow || isTimedIn ? 'border-l-bisu-yellow-500' : 'border-l-red-500'
              }`}>
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                  <CardTitle className="text-bisu-purple-deep flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Time Clock
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  {/* Time Window Status */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`flex items-center space-x-2 text-sm p-3 rounded-md ${
                      isWithinTimeWindow 
                        ? "bg-green-100 text-green-700 border border-green-200" 
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    {isWithinTimeWindow ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-600" />
                    )}
                    <span className="flex-1">{timeWindowMessage}</span>
                  </motion.div>

                  <Button
                    onClick={handleTimeLogClick}
                    disabled={isTimeActionLoading || (!isWithinTimeWindow && !isTimedIn)}
                    className={`w-full py-6 text-lg font-semibold transition-all ${
                      isTimedIn
                        ? "bg-bisu-yellow hover:bg-bisu-yellow-dark text-bisu-purple-deep"
                        : isWithinTimeWindow
                        ? "bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
                        : "bg-gray-400 text-gray-600 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isTimeActionLoading ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : isTimedIn ? (
                      <LogOut className="mr-2 h-5 w-5" />
                    ) : !isWithinTimeWindow ? (
                      <Clock className="mr-2 h-5 w-5" />
                    ) : (
                      <LogIn className="mr-2 h-5 w-5" />
                    )}
                    {isTimedIn 
                      ? "Time Out" 
                      : !isWithinTimeWindow 
                      ? "Time-in Restricted" 
                      : "Time In"
                    }
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
                  
                  {!lastActionTime && !isWithinTimeWindow && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-sm text-center p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                    >
                      <p>📋 Time-in Hours: 6:00 AM - 12:59 PM (PHT)</p>
                      <p className="text-xs mt-1 text-blue-600">Please ensure you're within the allowed time window to record attendance.</p>
                    </motion.div>
                  )}
                  
                  {!lastActionTime && isWithinTimeWindow && (
                    <p className="text-sm text-gray-500 text-center">No activity yet today</p>
                  )}
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
                      selected: "bg-bisu-yellow text-bisu-purple-deep hover:bg-bisu-yellow-dark",
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
                <Card className="border-l-4 border-l-red-500 card-hover hover:bg-red-50 hover:text-red-700 transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Lates This Month</CardTitle>
                    <AlertTriangle
                      className={`h-4 w-4 ${(dashboardData?.latesThisMonth || 0) > 0 ? "text-red-500" : "text-green-500"}`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{dashboardData?.latesThisMonth || 0}</div>
                    <p
                      className={`text-xs mt-1 ${(dashboardData?.latesThisMonth || 0) > 0 ? "text-red-500" : "text-green-500"}`}
                    >
                      {(dashboardData?.latesThisMonth || 0) > 0 ? "Be mindful of punctuality" : "Great job on punctuality!"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 card-hover hover:bg-green-50 hover:text-green-700 transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Absences This Month</CardTitle>
                    <AlertTriangle
                      className={`h-4 w-4 ${(dashboardData?.absencesThisMonth || 0) > 0 ? "text-red-500" : "text-green-500"}`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{dashboardData?.absencesThisMonth || 0}</div>
                    <p className={`text-xs mt-1 ${(dashboardData?.absencesThisMonth || 0) > 0 ? "text-red-500" : "text-green-500"}`}>
                      {(dashboardData?.absencesThisMonth || 0) > 0 ? "Improve your attendance" : "Keep up the good attendance"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Salary Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-bisu-yellow-500 card-hover hover:bg-bisu-yellow-extralight hover:text-bisu-yellow-dark transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Current Salary Rate</CardTitle>
                    <DollarSign className="h-4 w-4 text-bisu-yellow-dark" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{dashboardData?.currentSalaryRate || "₱0.00"}</div>
                    <p className="text-xs text-gray-500 mt-1">Per day</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-bisu-purple-deep card-hover hover:bg-bisu-purple-extralight hover:text-bisu-purple-deep transition-colors duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Prospected Salary</CardTitle>
                    <DollarSign className="h-4 w-4 text-bisu-purple-deep" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bisu-purple-deep">{dashboardData?.prospectedSalary || "₱0.00"}</div>
                    <p className="text-xs text-gray-500 mt-1">Current period estimate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="shadow-md hover:shadow-lg hover:bg-bisu-purple-extralight transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
                  <CardTitle className="text-bisu-yellow-300">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <Button 
                    variant="outline" 
                    className="btn-outline-primary group justify-between"
                    onClick={handleNavigateToAttendance}
                  >
                    <span>View Attendance History</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="btn-outline-secondary group justify-between"
                    onClick={handleNavigateToPayslip}
                  >
                    <span>Download Payslip</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="btn-outline-primary group justify-between"
                    onClick={handleNavigateToProfile}
                  >
                    <span>Update Profile</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="btn-outline-secondary group justify-between"
                    onClick={handleNavigateToLeave}
                  >
                    <span>Request Leave</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Time Action Confirmation Dialog */}
      <AlertDialog open={isTimeActionDialogOpen} onOpenChange={setIsTimeActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {pendingAction === 'time-in' ? 'Time In' : 'Time Out'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingAction === 'time-in' ? 'time in' : 'time out'} at {currentTimePHT}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTimeAction} disabled={isTimeActionLoading}>
              {isTimeActionLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Earnings Modal */}
      {timeoutEarningsData && (
        <EarningsModal
          isOpen={isEarningsModalOpen}
          onClose={() => {
            setIsEarningsModalOpen(false)
            setTimeoutEarningsData(null)
          }}
          timeoutData={timeoutEarningsData}
        />
      )}
    </div>
  )
}
