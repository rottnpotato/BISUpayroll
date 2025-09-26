import { FC } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CalendarDays, RefreshCw } from "lucide-react"
import { PayrollOverviewSummary } from "../../types"

interface OverviewHeaderProps {
  title?: string
  summary: PayrollOverviewSummary
  onRefresh: () => void
}

export const OverviewHeader: FC<OverviewHeaderProps> = ({ title = "Payroll Overview", summary, onRefresh }) => {
  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-bisu-purple-extralight via-white to-white p-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-bisu-purple-light/40 border border-bisu-purple-medium/30 flex items-center justify-center">
            <CalendarDays className="h-6 w-6 text-bisu-purple-deep" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-bisu-purple-deep">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Next pay date: <span className="font-medium text-bisu-purple-deep">{summary.upcomingPayDate || "Not Set"}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onRefresh} className="border-bisu-purple-medium text-bisu-purple-deep hover:bg-bisu-yellow-light">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-bisu-purple-light to-transparent" />
    </Card>
  )
}


