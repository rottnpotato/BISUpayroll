import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Activity, AlertTriangle } from "lucide-react"
import { formatDate, formatCurrency } from "./utils"
import { DashboardData } from "./types"

interface RecentActivityProps {
  dashboardData: DashboardData | null
}

export default function RecentActivity({ dashboardData }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-bisu-yellow-extralight to-bisu-purple-extralight">
        <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!dashboardData || (!dashboardData.recentActivity.attendance.length && !dashboardData.recentActivity.payroll.length) ? (
          <div className="text-center py-8 px-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 text-sm">No recent activity found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {dashboardData.recentActivity.attendance.slice(0, 3).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-bisu-purple-deep">
                    Attendance recorded
                  </p>
                  <p className="text-xs text-gray-500">
                    by {activity.user.firstName} {activity.user.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                </div>
              </motion.div>
            ))}
            {dashboardData.recentActivity.payroll.slice(0, 2).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index + 3) * 0.1 + 0.2 }}
                className="flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-bisu-purple-deep">
                    Payroll {activity.isPaid ? 'paid' : 'processed'}
                  </p>
                  <p className="text-xs text-gray-500">
                    for {activity.user.firstName} {activity.user.lastName} - {formatCurrency(activity.netPay)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(activity.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
