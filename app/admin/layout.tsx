"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context"
import { BisuLogo } from "@/components/bisu-logo"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { LayoutDashboard, Users, Activity, FileText, Calendar, DollarSign, Clock, ChevronRight, ChevronDown, Eye, Calculator, CalendarRange, Settings, BookOpen, PhilippinePeso  } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "@/components/simple-motion"
import { PageLoading } from "@/components/ui/page-loading"
import Link from "next/link"

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Employee Management", icon: Users },
  { 
    href: "/admin/payroll/overview", 
    label: "Payroll Management", 
    icon: PhilippinePeso,
    submenu: [
      { href: "/admin/payroll/calculations", label: "Payroll Calculations", icon: Calculator },
      { href: "/admin/payroll/schedules", label: "Schedules", icon: CalendarRange },
      { href: "/admin/payroll/configuration", label: "Configuration", icon: Settings },
      { href: "/admin/payroll/ledger", label: "Ledger", icon: BookOpen },
    ]
  },
  { href: "/admin/attendance", label: "Attendance", icon: Calendar },
  { href: "/admin/overtime", label: "Overtime Requests", icon: Clock },
  { href: "/admin/settings", label: "System Logs", icon: Activity },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { userRole, userName, logout } = useAuth()
  const { isCollapsed, setCollapsed, isMobile } = useSidebar()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-bisu-purple-deep to-bisu-purple-medium text-bisu-yellow">
        <div className="text-center p-8 rounded-lg glass-effect">
          <h2 className="text-2xl font-bold mb-4 text-gradient">Access Denied</h2>
          <p className="mb-6">You need administrator privileges to access this area.</p>
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
    <div className="admin-light-scope flex h-screen bg-gray-50">
      <AnimatedSidebar
        items={adminNavItems}
        logo={<BisuLogo size="md" variant="light" showText={!isCollapsed || !isMobile} />}
        userInfo={{
          name: userName || "Admin User",
          role: "Administrator",
        }}
        onLogout={logout}
        onCollapsedChange={setCollapsed}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'ml-0 w-full' : (isCollapsed ? 'ml-24' : 'ml-64')}`}
      >
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 pt-4 px-2 sm:px-2 md:px-6 w-full mx-auto mr-0 max-w-[1460px] pb-5">
          {isLoading ? <PageLoading message="Loading admin dashboard..." /> : children}
        </main>
      </motion.div>
    </div>
  )
}
