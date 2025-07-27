"use client"

import { FC } from 'react'
import { DashboardData } from './types'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CircleCheck, ArrowRight, Calendar, Users, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface PayrollOverviewProps {
  data: DashboardData | null
  isLoading: boolean
  companyName: string
}

const PayrollOverview: FC<PayrollOverviewProps> = ({ data, isLoading, companyName }) => {
  // Use actual data from dashboard API
  const startDate = "Oct 14"
  const endDate = "Dec 05"
  const totalAmount = data?.overview?.thisMonthPayroll?.total || 0
  const employeeCount = data?.overview?.thisMonthPayroll?.count || 0
  const activeEmployees = data?.overview?.activeEmployees || 0
  
  // Example payroll stats using real data
  const stats = [
    { 
      label: "Total Employees", 
      value: activeEmployees, 
      icon: <Users className="h-4 w-4" />, 
      change: `+${data?.overview?.newEmployeesThisMonth || 0}`, 
      color: "blue" 
    },
    { 
      label: "Processing Time", 
      value: "3 days", 
      icon: <Calendar className="h-4 w-4" />, 
      change: "-1", 
      color: "green" 
    },
    { 
      label: "Avg. Payroll", 
      value: employeeCount > 0 ? formatCurrency(totalAmount / employeeCount) : formatCurrency(0), 
      icon: <DollarSign className="h-4 w-4" />, 
      change: "+4.5%", 
      color: "purple" 
    }
  ]

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md p-6 mb-6 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-50 rounded-full opacity-50"></div>
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-50 rounded-full opacity-30"></div>
      
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {/* BISU logo/icon with enhanced styling */}
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-200 shadow-sm">
                <img 
                  src="/bisu-seal.png" 
                  alt="BISU Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">BISU Payroll Main</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{companyName}</span>
                <span className="text-gray-300">•</span>
                <span className="font-medium">{startDate} - {endDate}</span>
              </div>
            </div>
          </div>
          
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 flex items-center gap-1 px-3 py-1.5 text-sm font-medium">
            <CircleCheck className="h-4 w-4" />
            <span>Finalized & Ready for Payment</span>
          </Badge>
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 border border-gray-100 shadow-sm hover:shadow transition-shadow bg-gradient-to-br from-white to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                    <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full bg-${stat.color === 'green' ? 'green' : stat.color === 'blue' ? 'blue' : 'purple'}-50 text-${stat.color === 'green' ? 'green' : stat.color === 'blue' ? 'blue' : 'purple'}-600`}>
                  {stat.change}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Enhanced Timeline section */}
        <div className="my-8 relative">
          <div className="h-1.5 bg-gradient-to-r from-purple-200 via-green-300 to-purple-200 w-full rounded-full absolute top-1/2 -translate-y-1/2"></div>
          <div className="flex justify-between relative z-10">
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 rounded-full bg-purple-100 border-4 border-white shadow-md flex items-center justify-center text-xs mb-1"
              >
                <span className="text-purple-700 font-medium">14</span>
              </motion.div>
              <div className="text-xs font-medium text-purple-700">Oct</div>
              <div className="mt-4 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                <div className="text-xs font-medium">Oct 14</div>
                <div className="text-xs text-gray-500">Payroll run starts</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-10 h-10 rounded-full bg-green-500 border-4 border-white shadow-md flex items-center justify-center text-xs mb-1"
              >
                <span className="text-white font-medium">09</span>
              </motion.div>
              <div className="text-xs font-medium text-green-600">Nov</div>
              <div className="mt-4 bg-white p-2 rounded-lg shadow-sm border border-green-100">
                <div className="text-xs font-medium">Nov 09</div>
                <div className="text-xs text-gray-500">Finalized</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-10 h-10 rounded-full bg-purple-100 border-4 border-white shadow-md flex items-center justify-center text-xs mb-1"
              >
                <span className="text-purple-700 font-medium">05</span>
              </motion.div>
              <div className="text-xs font-medium text-purple-700">Dec</div>
              <div className="mt-4 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                <div className="text-xs font-medium">Dec 05</div>
                <div className="text-xs text-gray-500">Payment date</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Total Amount */}
        <div className="flex justify-between items-center mt-6">
          <button className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors">
            View payroll details <ArrowRight className="h-4 w-4" />
          </button>
          
      
        </div>
      </div>
    </div>
  )
}

export default PayrollOverview
