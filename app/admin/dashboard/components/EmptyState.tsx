import { BisuLogo } from "@/components/bisu-logo"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  variant?: "default" | "large"
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  variant = "default" 
}: EmptyStateProps) {
  const containerClass = variant === "large" 
    ? "text-center py-16 px-8" 
    : "text-center py-8 px-4"
    
  const iconSize = variant === "large" ? "h-16 w-16" : "h-8 w-8"
  const titleSize = variant === "large" ? "text-xl" : "text-base"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={containerClass}
    >
      <div className="bg-gradient-to-br from-bisu-purple-extralight to-bisu-yellow-extralight rounded-2xl p-8 border border-bisu-purple-200">
        <div className="flex flex-col items-center space-y-4">
          {Icon && (
            <div className="relative">
              <div className="absolute inset-0 bg-bisu-purple-deep opacity-10 rounded-full animate-pulse"></div>
              <div className="relative bg-white rounded-full p-4 shadow-lg border border-bisu-purple-200">
                <Icon className={`${iconSize} text-bisu-purple-deep`} />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className={`${titleSize} font-semibold text-bisu-purple-deep`}>
              {title}
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              {description}
            </p>
          </div>
          
          <div className="pt-4 opacity-60">
            <BisuLogo size="sm" />
          </div>
        </div>
      </div>
    </motion.div>
  )
} 