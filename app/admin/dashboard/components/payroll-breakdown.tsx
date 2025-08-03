"use client"

import { FC } from 'react'
import { DashboardData } from './types'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { PhilippinePeso, TrendingUp, Award, Users, Building } from 'lucide-react'
import { motion } from 'framer-motion'
import EmptyState from './EmptyState'

interface PayrollBreakdownProps {
  data: DashboardData | null
  isLoading: boolean
}

const PayrollBreakdown: FC<PayrollBreakdownProps> = ({ data, isLoading }) => {
  const router = useRouter()
  //  actual data from dashboard API
  const totalAmount = data?.overview?.thisMonthPayroll?.total || 0
  const payrollBreakdown = data?.payrollDetails?.breakdown
  const payrollTrends = data?.payrollTrends || []
  
  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-200"></div>
              <div className="p-3 space-y-2">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data || totalAmount === 0) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payroll Breakdown</h2>
          <button 
          onClick={() => router.push('/admin/payroll#reports')}
          className="text-sm text-bisu-purple-deep hover:text-bisu-purple-medium font-medium">
            View detailed report
          </button>
        </div>
        <EmptyState
          icon={PhilippinePeso}
          title="No Payroll Data Available"
          description="Payroll breakdown will be displayed here once payroll processing begins for BISU employees."
          variant="default"
        />
      </div>
    )
  }
  
  const salary = payrollBreakdown?.salary || totalAmount * 0.7
  const benefits = payrollBreakdown?.benefits || totalAmount * 0.15
  const incentives = payrollBreakdown?.incentives || totalAmount * 0.1
  const employerContributions = payrollBreakdown?.employerContributions || totalAmount * 0.05
  const activeEmployees = data?.overview?.activeEmployees || 35
  
  // Calculate real percentage changes using payroll trends
  const calculateGrowthPercentage = (currentValue: number, categoryType: 'total' | 'salary' | 'benefits' | 'incentives' | 'contributions') => {
    if (!payrollTrends || payrollTrends.length < 2) return "0.0"
    
    // Get current month and previous month data
    const currentMonth = payrollTrends[payrollTrends.length - 1]
    const previousMonth = payrollTrends[payrollTrends.length - 2]
    
    if (!currentMonth || !previousMonth) return "0.0"
    
    let currentAmount = 0
    let previousAmount = 0
    
    switch (categoryType) {
      case 'total':
        currentAmount = currentMonth.total
        previousAmount = previousMonth.total
        break
      case 'salary':
        currentAmount = currentMonth.total * 0.7
        previousAmount = previousMonth.total * 0.7
        break
      case 'benefits':
        currentAmount = currentMonth.total * 0.15
        previousAmount = previousMonth.total * 0.15
        break
      case 'incentives':
        currentAmount = currentMonth.total * 0.1
        previousAmount = previousMonth.total * 0.1
        break
      case 'contributions':
        currentAmount = currentMonth.total * 0.05
        previousAmount = previousMonth.total * 0.05
        break
    }
    
    if (previousAmount === 0) return "0.0"
    
    const growth = ((currentAmount - previousAmount) / previousAmount) * 100
    return growth.toFixed(1)
  }
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    }
  }
  
  const cardData = [
    { 
      title: 'Total Payroll', 
      amount: totalAmount, 
      icon: <PhilippinePeso className="h-5 w-5" />, 
      bgColor: 'bg-bisu-purple-deep',
      accentColor: 'border-bisu-purple-deep',
      progressColor: 'bg-bisu-purple-deep',
      percentage: calculateGrowthPercentage(totalAmount, 'total') + '%',
      isMain: true
    },
    { 
      title: 'Base Salary', 
      amount: salary, 
      icon: <Users className="h-5 w-5" />, 
      bgColor: 'bg-bisu-yellow-600',
      accentColor: 'border-bisu-yellow-600',
      progressColor: 'bg-bisu-yellow-600',
      percentage: calculateGrowthPercentage(salary, 'salary') + '%'
    },
    { 
      title: 'Benefits Package', 
      amount: benefits, 
      icon: <Building className="h-5 w-5" />, 
      bgColor: 'bg-bisu-purple-medium',
      accentColor: 'border-bisu-purple-medium',
      progressColor: 'bg-bisu-purple-medium',
      percentage: calculateGrowthPercentage(benefits, 'benefits') + '%'
    },
    { 
      title: 'Performance Incentives', 
      amount: incentives, 
      icon: <Award className="h-5 w-5" />, 
      bgColor: 'bg-bisu-yellow-600',
      accentColor: 'border-bisu-yellow-600',
      progressColor: 'bg-bisu-yellow-600',
      percentage: calculateGrowthPercentage(incentives, 'incentives') + '%'
    },
    { 
      title: 'Employer Contributions', 
      amount: employerContributions, 
      icon: <TrendingUp className="h-5 w-5" />, 
      bgColor: 'bg-bisu-purple-light',
      accentColor: 'border-bisu-purple-light',
      progressColor: 'bg-bisu-purple-light',
      percentage: calculateGrowthPercentage(employerContributions, 'contributions') + '%'
    }
  ]
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payroll Breakdown</h2>
          <p className="text-sm text-gray-600 mt-1">Financial distribution overview for BISU employees</p>
        </div>
        <button className="text-sm text-bisu-purple-deep hover:text-bisu-purple-medium font-medium transition-colors">
          View detailed report
        </button>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cardData.map((card, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className={`overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300 h-48 flex flex-col ${card.isMain ? 'ring-1 ring-bisu-purple-light' : ''}`}>
              {/* Header Section */}
              <div className={`${card.bgColor} p-4 text-white`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-medium">{card.title}</div>
                  <div className="p-1.5 bg-white/20 rounded">
                    {card.icon}
                  </div>
                </div>
                <div className="text-xl font-bold">{formatCurrency(card.amount)}</div>
                <div className="flex items-center mt-2 text-xs">
                  <div className={`flex items-center ${Number(card.percentage) >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                    {Number(card.percentage) >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                    )}
                    {card.percentage}
                  </div>
                  <div className="ml-1 text-white/80">vs last month</div>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full ${card.progressColor} transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${totalAmount > 0 ? Math.min((card.amount / totalAmount) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
                
                {/* Stats */}
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>
                    {totalAmount > 0 ? ((card.amount / totalAmount) * 100).toFixed(1) : '0'}% of total
                  </span>
                  <span className="font-medium text-gray-700">
                    {activeEmployees > 0 ? formatCurrency(card.amount / activeEmployees) : formatCurrency(0)}/emp
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default PayrollBreakdown
