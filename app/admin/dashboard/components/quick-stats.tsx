import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { TrendingUp, Clock, AlertTriangle, Calendar, FileText } from "lucide-react"
import { DashboardData } from "./types"
import EmptyState from "./EmptyState"

interface QuickStatsProps {
  dashboardData: DashboardData | null
}

export default function QuickStats({ dashboardData }: QuickStatsProps) {
  if (!dashboardData) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-bisu-purple-extralight to-bisu-yellow-extralight">
          <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
            <TrendingUp className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={TrendingUp}
            title="Statistics Loading"
            description="BISU Payroll statistics will appear here once data is available."
            variant="default"
          />
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: "On-Time Rate",
      value: `${dashboardData.quickStats.onTimeRate}%`,
      icon: <Clock className="h-4 w-4" />,
      color: "green"
    },
    {
      label: "Late Today",
      value: dashboardData.quickStats.lateEmployees,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "orange"
    },
    {
      label: "Absent Today",
      value: dashboardData.quickStats.absentToday,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "red"
    },
    {
      label: "Upcoming Holidays",
      value: dashboardData.quickStats.upcomingHolidays,
      icon: <Calendar className="h-4 w-4" />,
      color: "blue"
    },
    {
      label: "Pending Reports",
      value: dashboardData.quickStats.pendingReports,
      icon: <FileText className="h-4 w-4" />,
      color: "purple"
    }
  ]

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-bisu-purple-extralight to-bisu-yellow-extralight">
        <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
          <TrendingUp className="h-5 w-5" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                  {stat.icon}
                </div>
                <span className="text-sm font-medium text-bisu-purple-deep">
                  {stat.label}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {stat.value}
              </span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
