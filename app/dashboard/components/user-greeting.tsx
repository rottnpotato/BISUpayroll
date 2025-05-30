"use client"

import { useState, useEffect } from "react"
import { UserCircle, Clock } from "lucide-react"

export function UserGreeting({ userName }: { userName: string }) {
  const [currentTimePHT, setCurrentTimePHT] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTimePHT(
        now.toLocaleString("en-US", {
          timeZone: "Asia/Manila",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="p-4 bg-bisu-green-700 text-white rounded-lg shadow-md">
      <div className="flex items-center space-x-3">
        <UserCircle size={40} className="text-bisu-gold-300" />
        <div>
          <h2 className="text-xl font-semibold">Hello, {userName}!</h2>
          <p className="text-sm text-bisu-green-100">Welcome to your payroll dashboard.</p>
        </div>
      </div>
      <div className="mt-3 flex items-center space-x-2 text-sm text-bisu-gold-200">
        <Clock size={16} />
        <span>Philippine Standard Time (PHT): {currentTimePHT || "Loading..."}</span>
      </div>
    </div>
  )
}
