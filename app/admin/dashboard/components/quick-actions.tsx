import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  Settings,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { animationVariants } from "./utils"

const quickActions = [
  {
    href: "/admin/users",
    title: "Manage Users",
    description: "Add, edit, or remove employee accounts",
    icon: Users,
    iconBg: "bg-bisu-purple-extralight",
    iconColor: "text-bisu-purple-deep",
    hoverColor: "hover:border-bisu-purple-light",
    hoverBg: "group-hover:bg-bisu-yellow-light group-hover:text-white",
    hoverIcon: "group-hover:text-white",
    hoverChevron: "group-hover:text-bisu-purple-medium"
  },
  {
    href: "/admin/payroll",
    title: "Payroll Rules",
    description: "Configure payroll calculations",
    icon: DollarSign,
    iconBg: "bg-bisu-yellow-extralight",
    iconColor: "text-bisu-yellow-dark",
    hoverColor: "hover:border-bisu-yellow",
    hoverBg: "group-hover:bg-bisu-yellow group-hover:text-bisu-purple-deep",
    hoverIcon: "group-hover:text-bisu-purple-deep",
    hoverChevron: "group-hover:text-bisu-yellow-dark"
  },
  {
    href: "/admin/attendance",
    title: "Attendance",
    description: "Monitor employee attendance",
    icon: Calendar,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    hoverColor: "hover:border-blue-500",
    hoverBg: "group-hover:bg-blue-500 group-hover:text-white",
    hoverIcon: "group-hover:text-white",
    hoverChevron: "group-hover:text-blue-600"
  },
  {
    href: "/admin/payroll#reports",
    title: "Reports",
    description: "Generate comprehensive reports",
    icon: FileText,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    hoverColor: "hover:border-green-500",
    hoverBg: "group-hover:bg-green-500 group-hover:text-white",
    hoverIcon: "group-hover:text-white",
    hoverChevron: "group-hover:text-green-600"
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "System configuration",
    icon: Settings,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    hoverColor: "hover:border-purple-500",
    hoverBg: "group-hover:bg-purple-500 group-hover:text-white",
    hoverIcon: "group-hover:text-white",
    hoverChevron: "group-hover:text-purple-600"
  }
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quickActions.map((action, index) => (
        <motion.div key={action.href} variants={animationVariants.item}>
          <Link href={action.href}>
            <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 border-transparent ${action.hoverColor}`}>
              <CardContent className="p-6 text-center">
                <div className={`mx-auto w-12 h-12 ${action.iconBg} rounded-lg flex items-center justify-center ${action.hoverBg} transition-all mb-4`}>
                  <action.icon className={`h-6 w-6 ${action.iconColor} ${action.hoverIcon}`} />
                </div>
                <h3 className="font-semibold text-bisu-purple-deep mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <ChevronRight className={`h-4 w-4 mx-auto text-gray-400 ${action.hoverChevron} transition-colors`} />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
