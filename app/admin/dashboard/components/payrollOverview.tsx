"use client"

import { FC } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardData } from './types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CircleCheck, ArrowRight, Calendar, Users, PhilippinePeso, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface PayrollOverviewProps {
  data: DashboardData | null
  isLoading: boolean
  companyName: string
}

const PayrollOverview: FC<PayrollOverviewProps> = ({ data, isLoading, companyName }) => {
  const router = useRouter()
  
  // Use actual data from dashboard API
  const payrollPeriod = data?.payrollDetails?.period
  const startDate = payrollPeriod?.start ? new Date(payrollPeriod.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"
  const endDate = payrollPeriod?.end ? new Date(payrollPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"
  
  const totalAmount = data?.overview?.thisMonthPayroll?.total || 0
  const employeeCount = data?.overview?.thisMonthPayroll?.count || 0
  const activeEmployees = data?.overview?.activeEmployees || 0
  const newEmployeesThisMonth = data?.overview?.newEmployeesThisMonth || 0
  
  // Calculate timeline dates based on actual payroll period
  const getTimelineData = () => {
    if (!payrollPeriod?.start || !payrollPeriod?.end) {
      return {
        startDate: { day: "--", month: "---", label: "Start Date", description: "Period not set" },
        processDate: { day: "--", month: "---", label: "Processing", description: "In progress" },
        endDate: { day: "--", month: "---", label: "End Date", description: "Period end" }
      }
    }
    
    const start = new Date(payrollPeriod.start)
    const end = new Date(payrollPeriod.end)
    const today = new Date()
    
    // Calculate process date (midpoint between start and end)
    const processDate = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2)
    
    return {
      startDate: {
        day: start.getDate().toString().padStart(2, '0'),
        month: start.toLocaleDateString('en-US', { month: 'short' }),
        label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        description: "Payroll period start"
      },
      processDate: {
        day: processDate.getDate().toString().padStart(2, '0'),
        month: processDate.toLocaleDateString('en-US', { month: 'short' }),
        label: processDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        description: today >= processDate ? "Processing completed" : "Processing"
      },
      endDate: {
        day: end.getDate().toString().padStart(2, '0'),
        month: end.toLocaleDateString('en-US', { month: 'short' }),
        label: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        description: today >= end ? "Period completed" : "Period end"
      }
    }
  }
  
  const timelineData = getTimelineData()
  
  // Calculate real percentage changes using available data
  const calculateEmployeeGrowth = () => {
    return newEmployeesThisMonth > 0 ? `+${newEmployeesThisMonth}` : "0"
  }
  
  const calculateProcessingTimeChange = () => {
    // For now return neutral value since we don't have historical processing time data
    return "±0"
  }
  
  const calculatePayrollGrowth = () => {
    const payrollTrends = data?.payrollTrends || []
    if (payrollTrends.length < 2) return "+0.0%"
    
    const currentMonth = payrollTrends[payrollTrends.length - 1]
    const previousMonth = payrollTrends[payrollTrends.length - 2]
    
    if (!currentMonth || !previousMonth || previousMonth.total === 0) return "+0.0%"
    
    const growth = ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100
    const sign = growth >= 0 ? "+" : ""
    return `${sign}${growth.toFixed(1)}%`
  }
  
  // Stats using real data with BISU colors
  const stats = [
    { 
      label: "Total Employees", 
      value: activeEmployees, 
      icon: <Users className="h-4 w-4" />, 
      change: calculateEmployeeGrowth(), 
      color: "bisu-purple-deep",
      bgColor: "bg-bisu-purple-extralight"
    },
    { 
      label: "Processing Time", 
      value: "3 days", 
      icon: <Calendar className="h-4 w-4" />, 
      change: calculateProcessingTimeChange(), 
      color: "bisu-yellow",
      bgColor: "bg-yellow-50"
    },
    { 
      label: "Avg. Payroll", 
      value: employeeCount > 0 ? (totalAmount / employeeCount) : 0, 
      icon: <PhilippinePeso className="h-4 w-4" />, 
      change: calculatePayrollGrowth(), 
      color: "bisu-purple-medium",
      bgColor: "bg-purple-50"
    }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* BISU logo with clean styling */}
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img 
                src="/bisu-seal.png" 
                alt="BISU Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            {/* Status indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
              <CircleCheck className="h-2 w-2 text-white ml-0.5 mt-0.5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">BISU Payroll Main</h2>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-bisu-purple-medium" />
                <span>{companyName}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-bisu-purple-medium" />
                <span>{startDate} - {endDate}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-3 py-1 text-sm font-medium">
            <CircleCheck className="h-3 w-3" />
            <span>{data?.payrollDetails?.status || "Processing"}</span>
          </Badge>
          
          {/* Action Button */}
          <button className="text-sm text-bisu-purple-deep hover:text-bisu-purple-medium font-medium flex items-center gap-1 transition-colors">
            View Details
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 border border-gray-100 shadow-none hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${stat.bgColor} text-${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                </div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${stat.bgColor} text-${stat.color} font-medium`}>
                {stat.change}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Timeline section */}
      <div className="my-6 relative">
        <div className="h-1 bg-gray-200 w-full rounded-full absolute top-1/2 -translate-y-1/2"></div>
        <div className="flex justify-between relative z-10">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-lg bg-bisu-purple-deep border-2 border-white shadow-sm flex items-center justify-center text-xs font-semibold text-white mb-1">
              {timelineData.startDate.day}
            </div>
            <div className="text-xs font-medium text-bisu-purple-deep">{timelineData.startDate.month}</div>
            <div className="mt-3 bg-white p-2 rounded border border-gray-100 shadow-sm min-w-[100px]">
              <div className="text-xs font-medium text-gray-900 text-center">{timelineData.startDate.label}</div>
              <div className="text-xs text-gray-500 text-center">{timelineData.startDate.description}</div>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-lg bg-bisu-yellow border-2 border-white shadow-sm flex items-center justify-center text-xs font-semibold text-gray-800 mb-1">
              {timelineData.processDate.day}
            </div>
            <div className="text-xs font-medium text-yellow-700">{timelineData.processDate.month}</div>
            <div className="mt-3 bg-white p-2 rounded border border-gray-100 shadow-sm min-w-[100px]">
              <div className="text-xs font-medium text-gray-900 text-center">{timelineData.processDate.label}</div>
              <div className="text-xs text-gray-500 text-center">{timelineData.processDate.description}</div>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-lg bg-bisu-purple-medium border-2 border-white shadow-sm flex items-center justify-center text-xs font-semibold text-white mb-1">
              {timelineData.endDate.day}
            </div>
            <div className="text-xs font-medium text-bisu-purple-medium">{timelineData.endDate.month}</div>
            <div className="mt-3 bg-white p-2 rounded border border-gray-100 shadow-sm min-w-[100px]">
              <div className="text-xs font-medium text-gray-900 text-center">{timelineData.endDate.label}</div>
              <div className="text-xs text-gray-500 text-center">{timelineData.endDate.description}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Total Amount Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 bg-bisu-purple-extralight border border-bisu-purple-light rounded-lg">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="p-2 bg-bisu-purple-deep rounded-lg">
            <PhilippinePeso className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-bisu-purple-medium font-medium">Total Monthly Payroll</div>
            <div className="text-2xl font-bold text-bisu-purple-deep">{totalAmount}</div>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/admin/payroll')}
          className="flex items-center gap-2 px-4 py-2 bg-bisu-purple-deep text-white rounded-lg text-sm font-medium hover:bg-bisu-purple-medium transition-colors"
        >
          <span>View Payroll Details</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default PayrollOverview

