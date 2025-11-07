"use client"

import { motion } from "framer-motion"
import { PayrollScheduleCard } from '../components'
import { usePayrollData } from '../hooks/usePayrollData'

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
} as const

export default function PayrollSchedulesPage() {
  const { schedules, isLoading, loadData } = usePayrollData()

  const handleScheduleRefresh = () => {
    loadData()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <motion.div variants={itemVariants}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">
            Payroll Schedules
          </h1>
          <p className="text-muted-foreground">
            Manage payroll processing schedules and periods
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <PayrollScheduleCard
          schedules={schedules}
          onRefresh={handleScheduleRefresh}
        />
      </motion.div>
    </motion.div>
  )
}
