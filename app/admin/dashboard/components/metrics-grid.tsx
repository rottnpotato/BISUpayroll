import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { 
  Users, 
  DollarSign,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { formatCurrency, animationVariants } from "./utils"
import { DashboardData } from "./types"

interface MetricsGridProps {
  dashboardData: DashboardData | null
  isLoading: boolean
}

const getTrendIcon = (value: number) => {
  return value > 0 ? (
    <ArrowUpRight className="h-4 w-4 text-green-600" />
  ) : (
    <ArrowDownRight className="h-4 w-4 text-red-600" />
  )
}

export default function MetricsGrid({ dashboardData, isLoading }: MetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-full">
          <CardContent className="p-6 text-center">
            <div className="text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-sm">Unable to load dashboard metrics. Please check if there is data in the system.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metrics = [
    {
      title: "Total Employees",
      value: dashboardData.overview.totalEmployees,
      icon: Users,
      badge: `+${dashboardData.overview.newEmployeesThisMonth} this month`,
      badgeColor: "text-green-600 border-green-200",
      iconBg: "bg-bisu-purple-extralight",
      iconColor: "text-bisu-purple-deep",
      borderColor: "border-l-bisu-purple-deep",
      trend: {
        value: dashboardData.overview.totalEmployees > 0 
          ? +((dashboardData.overview.newEmployeesThisMonth / dashboardData.overview.totalEmployees) * 100).toFixed(1)
          : 0,
        label: `${dashboardData.overview.activeEmployees} active employees`
      }
    },
    {
      title: "Monthly Payroll",
      value: formatCurrency(dashboardData.overview.thisMonthPayroll.total),
      icon: DollarSign,
      badge: `${dashboardData.overview.thisMonthPayroll.count} records`,
      badgeColor: "text-blue-600 border-blue-200",
      iconBg: "bg-bisu-yellow-extralight",
      iconColor: "text-bisu-yellow-dark",
      borderColor: "border-l-bisu-yellow-DEFAULT",
      trend: {
        value: 5.2,
        label: `Net: ${formatCurrency(dashboardData.overview.thisMonthPayroll.netTotal)}`
      }
    },
    {
      title: "Attendance Rate",
      value: `${dashboardData.overview.attendanceRate}%`,
      icon: UserCheck,
      badge: `${dashboardData.quickStats.lateEmployees} late today`,
      badgeColor: "text-orange-600 border-orange-200",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      borderColor: "border-l-blue-500",
      trend: {
        value: 2.1,
        label: `${dashboardData.overview.todayAttendance} present today`,
        showProgress: true,
        progressValue: dashboardData.overview.attendanceRate
      }
    },
    {
      title: "Unpaid Payroll",
      value: dashboardData.overview.unpaidPayroll,
      icon: AlertTriangle,
      badge: "Requires attention",
      badgeColor: "text-red-600 border-red-200",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      borderColor: "border-l-red-500",
      trend: {
        value: -1,
        label: `${dashboardData.quickStats.pendingReports} pending reports`,
        isUrgent: true
      }
    }
  ]

  return (
    <motion.div
      variants={animationVariants.container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {metrics.map((metric, index) => (
        <motion.div key={metric.title} variants={animationVariants.item}>
          <Card className={`relative overflow-hidden border-l-4 ${metric.borderColor} hover:shadow-lg transition-all duration-300 group`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${metric.iconBg} rounded-lg group-hover:bg-opacity-80 transition-colors`}>
                  <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
                <Badge variant="outline" className={metric.badgeColor}>
                  {metric.badge}
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-bisu-purple-deep">
                    {metric.value}
                  </span>
                  {metric.trend.isUrgent ? (
                    <div className="flex items-center text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Urgent</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-green-600">
                      {getTrendIcon(metric.trend.value)}
                      <span>{metric.trend.value}%</span>
                    </div>
                  )}
                  
                </div>
                {metric.trend.showProgress ? (
                  <div className="space-y-1">
                    <Progress value={metric.trend.progressValue} className="h-2" />
                    <p className="text-xs text-gray-500">{metric.trend.label}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="h-2" />
                  <p className="text-xs text-gray-500">{metric.trend.label}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
