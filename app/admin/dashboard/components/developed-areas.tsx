import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { DashboardData } from "./types"
import { Circle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DevelopedAreasProps {
  dashboardData: DashboardData | null
  isLoading: boolean
}

export default function DevelopedAreas({ dashboardData, isLoading }: DevelopedAreasProps) {
  // If loading or no data, show placeholder
  if (isLoading || !dashboardData) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-1">Department Performance</h3>
          <p className="text-xs text-gray-600 mb-6">Attendance rates by department</p>
          
          <div className="space-y-4">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gray-300 animate-pulse" style={{width: '50%'}}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get department stats and sort by attendance rate
  const departments = [...(dashboardData.departmentStats || [])]
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5) // Only show top 5 departments

  // Map departments to UI format
  const departmentItems = departments.map(dept => ({
    name: dept.department || 'Unknown',
    progress: Math.round(dept.attendanceRate || 0),
    color: dept.attendanceRate >= 80 ? "bg-blue-500" : 
           dept.attendanceRate >= 60 ? "bg-green-500" : 
           dept.attendanceRate >= 40 ? "bg-orange-500" : "bg-red-500",
    hasCircle: dept.attendanceRate >= 75,
    avgSalary: dept.avgSalary || 0
  }))

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h3 className="font-medium text-gray-900 mb-1">Department Performance</h3>
        <p className="text-xs text-gray-600 mb-6">Attendance rates by department</p>
        
        <div className="space-y-4">
          {departmentItems.map((dept, index) => (
            <motion.div 
              key={dept.name} 
              className="space-y-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-800" title={`Avg. Salary: ${formatCurrency(dept.avgSalary)}`}>
                  {dept.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{dept.progress}%</span>
                  {dept.hasCircle && (
                    <Circle className={`h-4 w-4 ${dept.progress >= 75 ? "text-blue-500 fill-blue-500" : "text-orange-500 fill-orange-500"}`} />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${dept.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${dept.progress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                />
              </div>
            </motion.div>
          ))}

          {departmentItems.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No department data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
