"use client"

import { Calendar } from "@/components/ui/calendar" // Assuming shadcn/ui calendar
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export function MiniCalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="text-lg text-bisu-green-800 dark:text-bisu-green-200">Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center p-0 sm:p-2 md:p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
          // Apply custom styles to make it compact if needed via CSS or props
          // For example, you might need to adjust font sizes or padding in the Calendar component itself
          // or wrap it and control its container size.
          // This example uses default shadcn Calendar styling.
          // To make it truly "mini", you might need a custom calendar or heavily style this one.
          // For now, we'll assume it fits reasonably.
          styles={{
            caption_label: { fontSize: "0.875rem" }, // Example: make month/year smaller
            head_cell: { width: "2rem", fontSize: "0.75rem" }, // Example: make day headers smaller
            cell: { width: "2rem", height: "2rem", fontSize: "0.75rem" }, // Example: make date cells smaller
            day: { width: "2rem", height: "2rem" },
          }}
          modifiersClassNames={{
            selected: "bg-bisu-gold-500 text-bisu-gold-foreground hover:bg-bisu-gold-600 focus:bg-bisu-gold-600",
            today: "bg-bisu-green-200 text-bisu-green-800 dark:bg-bisu-green-700 dark:text-bisu-green-100",
          }}
        />
      </CardContent>
    </Card>
  )
}
