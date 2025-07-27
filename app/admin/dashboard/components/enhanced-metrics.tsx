import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { 
  Users, 
  DollarSign,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  CheckCircle
} from "lucide-react"
import { formatCurrency } from "./utils"
import { DashboardData } from "./types"

interface EnhancedMetricsProps {
  dashboardData: DashboardData | null
  isLoading: boolean
}

export default function EnhancedMetrics({ dashboardData, isLoading }: EnhancedMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="col-span-full">
          <CardContent className="p-6 text-center">
            <div className="text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-sm">Unable to load dashboard metrics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const priorityTasks = [
    {
      title: "Prioritized tasks",
      value: "83%",
      subtitle: "Avg. Completed",
      connections: dashboardData.overview.totalEmployees,
      gradient: "from-purple-500 via-purple-400 to-pink-400",
      icon: Target,
      badge: "Priority"
    },
    {
      title: "Additional tasks", 
      value: "56%",
      subtitle: "Avg. Completed",
      connections: dashboardData.overview.unpaidPayroll,
      gradient: "from-blue-500 via-blue-400 to-cyan-400",
      icon: CheckCircle,
      badge: "Progress"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {priorityTasks.map((task, index) => (
        <motion.div
          key={task.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${task.gradient} text-white border-0`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <task.icon className="h-6 w-6" />
                </div>
                <div className="text-sm bg-white/20 px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {task.badge}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold">{task.value}</span>
                <span className="text-sm opacity-80">{task.subtitle}</span>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-80">
                <Users className="h-4 w-4" />
                <span>{task.connections} active connections</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
