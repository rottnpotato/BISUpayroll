import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Briefcase, AlertTriangle } from "lucide-react"
import { formatCurrency } from "./utils"
import { DashboardData } from "./types"

interface DepartmentPerformanceProps {
  dashboardData: DashboardData | null
}

export default function DepartmentPerformance({ dashboardData }: DepartmentPerformanceProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="bg-gradient-to-r from-bisu-purple-extralight to-bisu-yellow-extralight">
        <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
          <Briefcase className="h-5 w-5" />
          Department Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!dashboardData || !dashboardData.departmentStats.length ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 text-sm">No department data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboardData.departmentStats.slice(0, 5).map((dept, index) => (
              <motion.div
                key={dept.department}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-bisu-purple-deep"></div>
                  <div>
                    <p className="font-medium text-bisu-purple-deep">{dept.department}</p>
                    <p className="text-sm text-gray-600">{dept._count.id} employees</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {dept.attendanceRate}% attendance
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {formatCurrency(dept.avgSalary)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
