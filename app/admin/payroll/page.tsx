"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PayrollPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/payroll/overview")
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-bisu-purple-deep border-t-transparent rounded-full"></div>
    </div>
  )
}
