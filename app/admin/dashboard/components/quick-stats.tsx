import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, AlertTriangle } from "lucide-react"
import { DashboardData } from "./types"

interface QuickStatsProps {
  dashboardData: DashboardData | null
}

export default function QuickStats({ dashboardData }: QuickStatsProps) {
  if (!dashboardData) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-bisu-yellow-extralight to-bisu-purple-extralight">
          <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
            <Star className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 text-sm">No statistics available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: "On-time Rate",
      value: `${dashboardData.quickStats.onTimeRate}%`,
      color: "text-green-600"
    },
    {
      label: "Absent Today",
      value: dashboardData.quickStats.absentToday,
      color: "text-red-600"
    },
    {
      label: "Upcoming Holidays",
      value: dashboardData.quickStats.upcomingHolidays,
      color: "text-blue-600"
    },
    {
      label: "Attendance Rate",
      value: `${dashboardData.overview.attendanceRate}%`,
      color: "text-green-600"
    }
  ]

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-bisu-yellow-extralight to-bisu-purple-extralight">
        <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
          <Star className="h-5 w-5" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{stat.label}</span>
            <span className={`font-semibold ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
