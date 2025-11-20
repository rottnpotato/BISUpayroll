"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { BisuLogo } from "@/components/bisu-logo"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Calendar, DollarSign, User, Clock } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "@/components/simple-motion"
import { PageLoading } from "@/components/ui/page-loading"
import { NotificationProvider } from "@/components/ui/notification"

const employeeNavItems = [
  { href: "/employee/attendance", label: "Attendance", icon: Calendar },
  { href: "/employee/overtime", label: "Overtime", icon: Clock },
  { href: "/employee/payroll", label: "Payslip Details", icon: DollarSign },
  { href: "/employee/profile", label: "Profile", icon: User },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { userRole, userName, logout } = useAuth()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Simulate loading for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Handle sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 1024
      setIsMobile(mobileView)
      if (mobileView) {
        setSidebarCollapsed(true)
      }
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
  }

  if (userRole !== "employee") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-bisu-purple-deep to-bisu-purple-medium text-bisu-yellow">
        <div className="text-center p-8 rounded-lg glass-effect">
          <h2 className="text-2xl font-bold mb-4 text-bisu-yellow">Access Denied</h2>
          <p className="mb-6 text-white">You need employee access to view this area.</p>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-bisu-yellow text-bisu-purple-deep rounded-lg hover:bg-bisu-yellow-light transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={
              {
                "--tw-ring-color": "#FFC107",
              } as React.CSSProperties
            }
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50">
        <AnimatedSidebar
          items={employeeNavItems}
          logo={<BisuLogo size="sm" variant="light" showText={!sidebarCollapsed || !isMobile} />}
          userInfo={{
            name: userName || "Employee",
            role: "Staff Member",
          }}
          onLogout={logout}
          onCollapsedChange={handleSidebarToggle}
        />

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'ml-0 w-full' : (sidebarCollapsed ? 'ml-20' : 'ml-64')}`}
        >
          {/* Page content */}
          <main className="employee-light-cards flex-1 overflow-auto bg-gray-50 pt-4 px-4 sm:px-6 md:px-8 w-full mx-auto max-w-full">
            {isLoading ? <PageLoading message="Loading your attendance..." /> : children}
          </main>
        </motion.div>
      </div>
    </NotificationProvider>
  )
}
