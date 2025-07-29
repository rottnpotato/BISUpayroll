"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { BisuLogo } from "@/components/bisu-logo"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { LayoutDashboard, Users, Activity, FileText, Calendar, DollarSign } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "@/components/simple-motion"
import { PageLoading } from "@/components/ui/page-loading"

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Employee Management", icon: Users },
  { href: "/admin/payroll", label: "Payroll Management", icon: DollarSign },
  { href: "/admin/attendance", label: "Attendance", icon: Calendar },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "System Logs", icon: Activity },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-bisu-purple-deep to-bisu-purple-medium text-bisu-yellow-DEFAULT">
        <div className="text-center p-8 rounded-lg glass-effect">
          <h2 className="text-2xl font-bold mb-4 text-gradient">Access Denied</h2>
          <p className="mb-6">You need administrator privileges to access this area.</p>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-bisu-yellow-DEFAULT text-bisu-purple-deep rounded-lg hover:bg-bisu-yellow-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
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
    <div className="flex h-screen bg-gray-50">
      <AnimatedSidebar
        items={adminNavItems}
        logo={<BisuLogo size="sm" variant="light" showText={!sidebarCollapsed || !isMobile} />}
        userInfo={{
          name: userName || "Admin User",
          role: "Administrator",
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
        <main className="flex-1 overflow-auto bg-gray-50 pt-4 px-4 sm:px-6 md:px-8 w-full mx-auto max-w-[1200px]">
          {isLoading ? <PageLoading message="Loading admin dashboard..." /> : children}
        </main>
      </motion.div>
    </div>
  )
}
