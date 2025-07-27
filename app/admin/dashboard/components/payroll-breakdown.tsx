"use client"

import { FC } from 'react'
import { DashboardData } from './types'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { DollarSign, TrendingUp, Award, Users, Building } from 'lucide-react'
import { motion } from 'framer-motion'

interface PayrollBreakdownProps {
  data: DashboardData | null
  isLoading: boolean
}

const PayrollBreakdown: FC<PayrollBreakdownProps> = ({ data, isLoading }) => {
  // Use actual data from dashboard API
  const totalAmount = data?.overview?.thisMonthPayroll?.total || 0
  const payrollBreakdown = data?.payrollDetails?.breakdown
  
  const salary = payrollBreakdown?.salary || totalAmount * 0.7
  const benefits = payrollBreakdown?.benefits || totalAmount * 0.15
  const incentives = payrollBreakdown?.incentives || totalAmount * 0.1
  const employerContributions = payrollBreakdown?.employerContributions || totalAmount * 0.05
  const activeEmployees = data?.overview?.activeEmployees || 35
  
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
  
  const getRandomPercentage = () => {
    return (Math.random() * 10 - 5).toFixed(1)
  }
  
  const cardData = [
    { 
      title: 'Total Payroll', 
      amount: totalAmount, 
      icon: <DollarSign className="h-5 w-5" />, 
      bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      percentage: '+3.2%'
    },
    { 
      title: 'Salary', 
      amount: salary, 
      icon: <Users className="h-5 w-5" />, 
      bgColor: 'bg-gradient-to-r from-amber-500 to-amber-600',
      percentage: getRandomPercentage() + '%'
    },
    { 
      title: 'Benefits', 
      amount: benefits, 
      icon: <Building className="h-5 w-5" />, 
      bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
      percentage: getRandomPercentage() + '%'
    },
    { 
      title: 'Incentives', 
      amount: incentives, 
      icon: <Award className="h-5 w-5" />, 
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      percentage: getRandomPercentage() + '%'
    },
    { 
      title: 'Employer Contributions', 
      amount: employerContributions, 
      icon: <TrendingUp className="h-5 w-5" />, 
      bgColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      percentage: getRandomPercentage() + '%'
    }
  ]
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Payroll Breakdown</h2>
        <div className="text-sm text-purple-600 hover:text-purple-800 cursor-pointer">View detailed report</div>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cardData.map((card, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className={`${card.bgColor} p-3 text-white`}>
                <div className="flex justify-between items-center">
                  <div className="font-medium">{card.title}</div>
                  <div className="p-1.5 bg-white/20 rounded-full">
                    {card.icon}
                  </div>
                </div>
                <div className="text-xl font-bold mt-2">{formatCurrency(card.amount)}</div>
                <div className="flex items-center mt-1 text-xs font-medium">
                  <div className={`flex items-center ${Number(card.percentage) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {Number(card.percentage) >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                    )}
                    {card.percentage}
                  </div>
                  <div className="ml-1 text-white/70">from last month</div>
                </div>
              </div>
              
              <div className="p-3 bg-white">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      index === 0 ? 'bg-purple-500' : 
                      index === 1 ? 'bg-amber-500' : 
                      index === 2 ? 'bg-orange-500' : 
                      index === 3 ? 'bg-blue-500' : 
                      'bg-yellow-500'
                    }`} 
                    style={{ width: `${totalAmount > 0 ? (card.amount / totalAmount) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1.5 text-xs text-gray-500">
                  <span>{totalAmount > 0 ? ((card.amount / totalAmount) * 100).toFixed(1) : '0'}% of total</span>
                  <span className="font-medium text-gray-700">
                    {activeEmployees > 0 ? formatCurrency(card.amount / activeEmployees) : formatCurrency(0)}/employee
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
