import { motion } from "framer-motion"

export default function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-bisu-purple-deep via-bisu-purple-medium to-bisu-purple-light p-6 text-white"
    >
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-bisu-yellow">
            BISU Payroll Dashboard
          </h1>
          <p className="text-bisu-yellow-light/90 mb-4 md:mb-0">
            Comprehensive payroll management system for Bohol Island State University
          </p>
        </div>
        <div className="hidden md:block">
          <div className="text-right">
            <div className="text-2xl font-bold text-bisu-yellow">
              {new Date().toLocaleDateString('en-PH', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="text-bisu-yellow-light/80">
              {new Date().toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-bisu-yellow/10 rounded-full"></div>
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-bisu-yellow/10 rounded-full"></div>
    </motion.div>
  )
}
