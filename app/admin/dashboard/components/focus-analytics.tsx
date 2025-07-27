import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { DashboardData } from "./types"
import { ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"

interface FocusAnalyticsProps {
  dashboardData: DashboardData | null
  isLoading: boolean
}

export default function FocusAnalytics({ dashboardData, isLoading }: FocusAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'payroll'>('attendance')

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Get actual data from dashboard data
  const attendanceRate = dashboardData?.overview.attendanceRate || 0
  const attendanceTrend = dashboardData?.attendanceTrends || []
  const payrollTrend = dashboardData?.payrollTrends || []
  
  // Only use last 5 items from each trend for visualization
  const recentAttendance = attendanceTrend.slice(-5)
  const recentPayroll = payrollTrend.slice(-5)

  // Generate SVG path for attendance line
  let attendancePath = ""
  if (recentAttendance.length > 0) {
    const maxRate = 100 // Max possible attendance rate
    const width = 500
    const height = 150
    const step = width / (recentAttendance.length - 1)
    
    attendancePath = recentAttendance.reduce((path, point, index) => {
      const x = index * step
      // Invert y coordinate (SVG has 0,0 at top-left)
      const y = height - (point.rate / maxRate * height)
      return path + (index === 0 ? `M${x},${y}` : ` L${x},${y}`)
    }, "")
  }

  // Generate SVG path for payroll line
  let payrollPath = ""
  if (recentPayroll.length > 0) {
    const maxAmount = Math.max(...recentPayroll.map(p => p.total)) * 1.2 // 20% buffer
    const width = 500
    const height = 150
    const step = width / (recentPayroll.length - 1)
    
    payrollPath = recentPayroll.reduce((path, point, index) => {
      const x = index * step
      // Invert y coordinate (SVG has 0,0 at top-left)
      const y = height - (point.total / maxAmount * height)
      return path + (index === 0 ? `M${x},${y}` : ` L${x},${y}`)
    }, "")
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-medium text-gray-900">
              {activeTab === 'attendance' ? 'Attendance Analytics' : 'Payroll Trends'}
            </h3>
            <p className="text-xs text-gray-600">
              {activeTab === 'attendance' ? 'Employee attendance overview' : 'Monthly payroll disbursements'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'attendance' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                onClick={() => setActiveTab('attendance')}
              >
                Attendance
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'payroll' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                onClick={() => setActiveTab('payroll')}
              >
                Payroll
              </button>
            </div>
            <button className="bg-transparent text-gray-700 flex items-center text-xs">
              This Year <ChevronDown className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="relative h-64">
          {/* Chart area */}
          <div className="absolute inset-0">
            <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="2,2" />
              
              {activeTab === 'attendance' ? (
                <>
                  {/* Attendance trend line */}
                  <path
                    d={attendancePath || "M0,150 L500,150"}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                  
                  {/* Dot marker for latest point */}
                  {recentAttendance.length > 0 && (
                    <circle 
                      cx={(recentAttendance.length - 1) * (500 / (recentAttendance.length - 1))} 
                      cy={150 - (recentAttendance[recentAttendance.length - 1].rate / 100 * 150)} 
                      r="4" 
                      fill="#3B82F6" 
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Payroll trend line */}
                  <path
                    d={payrollPath || "M0,150 L500,150"}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  
                  {/* Dot marker for latest point */}
                  {recentPayroll.length > 0 && (
                    <circle 
                      cx={(recentPayroll.length - 1) * (500 / (recentPayroll.length - 1))} 
                      cy={150 - (recentPayroll[recentPayroll.length - 1].total / (Math.max(...recentPayroll.map(p => p.total)) * 1.2) * 150)} 
                      r="4" 
                      fill="#10B981" 
                    />
                  )}
                </>
              )}
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          {activeTab === 'attendance' 
            ? recentAttendance.map((item, i) => (
                <span key={i}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              ))
            : recentPayroll.map((item, i) => (
                <span key={i}>{item.month}</span>
              ))
          }
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${activeTab === 'attendance' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              <span className="text-gray-600">
                {activeTab === 'attendance' ? 'Attendance Rate' : 'Payroll Total'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            {activeTab === 'attendance' ? (
              <>
                <div className="text-4xl font-bold text-gray-900">{attendanceRate}%</div>
                <div className="text-sm text-gray-600">Average Rate</div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.overview.thisMonthPayroll?.total || 0)}
                </div>
                <div className="text-sm text-gray-600">Current Month</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
