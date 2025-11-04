import { FC } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, DollarSign, Clock, Calendar } from "lucide-react"
import { PayrollOverviewSummary } from "../../types"

interface OverviewStatsProps {
  summary: PayrollOverviewSummary
  formatCurrency: (amount: number) => string
}

export const OverviewStats: FC<OverviewStatsProps> = ({ summary, formatCurrency }) => {
  const stats = [
    {
      label: "Total Employees",
      value: summary.totalEmployees.toString(),
      icon: Users,
      accent: "from-bisu-purple-medium/20 border-bisu-purple-medium/30",
      iconColor: "text-bisu-purple-deep",
      sub: "Active employees",
    },
    {
      label: "Monthly Payroll",
      value: formatCurrency(summary.monthlyPayrollTotal),
      icon: DollarSign,
      accent: "from-bisu-yellow/20 border-bisu-yellow/30",
      iconColor: "text-bisu-yellow-dark",
      sub: "Estimated total",
    },
    {
      label: "Completed Payrolls",
      value: summary.completedPayrolls.toString(),
      icon: Clock,
      accent: "from-green-500/20 border-green-500/30",
      iconColor: "text-green-600",
      sub: "Successfully processed",
    },
    {
      label: "Next Pay Date",
      value: summary.upcomingPayDate || "Not Set",
      icon: Calendar,
      accent: "from-green-500/20 border-green-500/30",
      iconColor: "text-green-600",
      sub: "Scheduled generation",
    },
  ] as const

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon
        return (
          <Card key={s.label} className={`relative overflow-hidden border ${s.accent} bg-white`}> 
            <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} pointer-events-none`} />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-2xl font-semibold text-bisu-purple-deep mt-1">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
                </div>
                <div className={`h-10 w-10 rounded-xl bg-white/70 border ${s.accent} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


