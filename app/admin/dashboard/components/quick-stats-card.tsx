import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { DashboardData } from "./types"
import { formatCurrency } from "./utils"

interface QuickStatsCardProps {
  dashboardData: DashboardData | null
  isLoading: boolean
}

export default function QuickStatsCard({ dashboardData, isLoading }: QuickStatsCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-40 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: "Active Employees",
      value: dashboardData?.overview.activeEmployees || 0,
      icon: Users,
      color: "text-bisu-purple-deep",
      bgColor: "bg-bisu-purple-extralight"
    },
    {
      label: "Attendance Rate",
      value: `${dashboardData?.overview.attendanceRate || 0}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: { value: 2.1, positive: true }
    },
    {
      label: "Monthly Payroll",
      value: formatCurrency(dashboardData?.overview.thisMonthPayroll.total || 0),
      icon: TrendingUp,
      color: "text-bisu-yellow-dark",
      bgColor: "bg-bisu-yellow-extralight"
    },
    {
      label: "Pending Reports",
      value: dashboardData?.quickStats.pendingReports || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-gray-600 text-sm">{stat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${stat.color}`}>
                  {stat.value}
                </span>
                {stat.trend && (
                  <div className={`flex items-center text-xs ${
                    stat.trend.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend.positive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{stat.trend.value}%</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
