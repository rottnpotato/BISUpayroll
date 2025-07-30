"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardRedirect() {
  const { userRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (userRole === "admin") {
        router.replace("/admin/dashboard")
      } else if (userRole === "employee") {
        router.replace("/employee/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [userRole, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bisu-purple-deep text-bisu-yellow">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bisu-yellow mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen bg-bisu-purple-deep text-bisu-yellow">
      <p>Redirecting...</p>
    </div>
  )
}
