"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SidebarItem = {
  href: string
  label: string
  icon: React.ElementType
}

type SidebarProps = {
  items: SidebarItem[]
  logo: React.ReactNode
  userInfo: {
    name: string
    role: string
  }
  onLogout: () => void
  onCollapsedChange?: (collapsed: boolean) => void
}

export function AnimatedSidebar({ items, logo, userInfo, onLogout, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const mobileView = window.innerWidth < 1024
      setIsMobile(mobileView)
      if (mobileView) {
        setIsCollapsed(true)
        setIsSidebarOpen(false)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Notify parent about collapsed state changes
  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed)
    }
  }, [isCollapsed, onCollapsedChange])

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-bisu-purple-deep to-bisu-purple-medium border-r border-bisu-yellow/20 shadow-xl transition-all duration-300 ease-in-out",
          isMobile ? `w-64 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}` : isCollapsed ? "w-24" : "w-64",
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-bectween h-20 px-4 border-b border-bisu-yellow/20">
          <div className={cn("overflow-hidden", isCollapsed && !isMobile ? "scale-100 ml-2" : "animate-fade-in")}>
            {logo}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "text-bisu-yellow hover:bg-bisu-purple-medium rounded-full transition-colors",
              "ml-auto"
            )}
          >
            {isMobile ? (
              <ChevronLeft size={20} />
            ) : isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {items.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <TooltipProvider key={item.href} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <li className="animate-slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                            isActive
                              ? "bg-white text-bisu-purple-deep font-bold shadow-md"
                              : "text-bisu-yellow-light hover:bg-bisu-purple-medium/50 hover:text-bisu-yellow",
                            isActive && !isCollapsed && "border-l-4 border-bisu-yellow pl-2" 
                          )}
                        >
                          <span className={cn(
                            "flex items-center justify-center", 
                            (isCollapsed && !isMobile) ? "mx-auto" : "mr-2",
                            isActive && "text-bisu-purple-deep"
                          )}>
                            <Icon size={20} />
                          </span>
                          {(!isCollapsed || (isMobile && isSidebarOpen)) && (
                            <span className="transition-opacity duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                              {item.label}
                            </span>
                          )}
                          {isActive && isCollapsed && !isMobile && (
                            <span className="absolute inset-y-0 left-0 w-1 bg-bisu-yellow rounded-r-full"></span>
                          )}
                        </Link>
                      </li>
                    </TooltipTrigger>
                    {isCollapsed && !isMobile && <TooltipContent side="right">{item.label}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="p-3 border-t border-bisu-yellow/20">
          {(!isCollapsed || (isMobile && isSidebarOpen)) && (
            <div className="bg-bisu-purple-medium/50 rounded-lg p-2 mb-3 animate-slide-up">
              <p className="text-bisu-yellow-light text-xs">{userInfo.role}</p>
              <p className="text-white font-semibold truncate">{userInfo.name}</p>
            </div>
          )}

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className={cn(
                    "border-bisu-yellow/50 text-bisu-yellow hover:bg-bisu-yellow hover:text-bisu-purple-deep transition-all duration-200 justify-center ",
                    isCollapsed && !isMobile ? "w-12 h-10 p-0 ml-2" : "w-full",
                  )}
                >
                  <LogOut size={isCollapsed && !isMobile ? 20 : 16} className={isCollapsed && !isMobile ? "mx-auto" : "mr-2"} />
                  {(!isCollapsed || (isMobile && isSidebarOpen)) && <span>Logout</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && !isMobile && <TooltipContent side="right">Logout</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* Mobile toggle button - Always visible on mobile */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
            className="fixed bottom-4 right-4 z-[60] w-12 h-12 rounded-full shadow-lg bg-bisu-purple-deep text-bisu-yellow border-bisu-yellow hover:bg-bisu-purple-medium touch-target"
          aria-label="Open menu"
        >
          <Menu size={28} />
        </Button>
      )}
    </>
  )
}
