"use client"

import { motion } from "framer-motion"

interface ReportsHeaderProps {
  title: string
  description: string
}

export const ReportsHeader = ({ title, description }: ReportsHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  )
} 