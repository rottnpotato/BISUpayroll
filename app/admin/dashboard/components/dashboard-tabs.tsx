import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { BarChart3, Activity, Target } from "lucide-react"
import { animationVariants } from "./utils"
import { DashboardData } from "./types"
import DepartmentPerformance from "./department-performance"
import QuickStats from "./quick-stats"
import RecentActivity from "./recent-activity"
import QuickActions from "./quick-actions"

interface DashboardTabsProps {
  dashboardData: DashboardData | null
  isLoading: boolean
}

export default function DashboardTabs({ dashboardData, isLoading }: DashboardTabsProps) {
  return (
    <motion.div
      variants={animationVariants.container}
      initial="hidden"
      animate={isLoading ? "hidden" : "visible"}
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-bisu-purple-extralight">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white"
          >
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white"
          >
            <Target className="h-4 w-4" />
            Quick Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DepartmentPerformance dashboardData={dashboardData} />
            <QuickStats dashboardData={dashboardData} />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RecentActivity dashboardData={dashboardData} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <QuickActions />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
