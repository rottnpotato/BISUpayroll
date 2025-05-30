"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, LogOut, CheckCircle, AlertCircle } from "lucide-react"

export function TimeLogger() {
  const [isTimedIn, setIsTimedIn] = useState(false)
  const [lastActionTime, setLastActionTime] = useState<string | null>(null)

  const handleTimeLog = () => {
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" })

    setIsTimedIn(!isTimedIn)
    setLastActionTime(`${isTimedIn ? "Timed Out" : "Timed In"} at ${timeString}`)
    // Add actual API call logic here
  }

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="text-lg text-bisu-green-800 dark:text-bisu-green-200">Time Clock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleTimeLog}
          className={`w-full ${isTimedIn ? "bg-bisu-gold-500 hover:bg-bisu-gold-600" : "bg-bisu-green-600 hover:bg-bisu-green-700"} text-white`}
        >
          {isTimedIn ? <LogOut className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
          {isTimedIn ? "Time Out" : "Time In"}
        </Button>
        {lastActionTime && (
          <div
            className={`flex items-center space-x-2 text-sm p-2 rounded-md ${isTimedIn ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"}`}
          >
            {isTimedIn ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{lastActionTime}</span>
          </div>
        )}
        {!lastActionTime && <p className="text-sm text-muted-foreground">No activity yet today.</p>}
      </CardContent>
    </Card>
  )
}
