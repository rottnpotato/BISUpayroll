import { FC } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { FolderOpen, FileText, Clock, CheckCircle } from "lucide-react"
import { PayrollGroup } from "../../types"

interface GroupsListProps {
  groups: PayrollGroup[]
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount)
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const getGroupStatus = (group: PayrollGroup) => {
  switch (group.status) {
    case "COMPLETED":
      return { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle }
    case "APPROVED":
      return { label: "Approved", color: "bg-blue-100 text-blue-800", icon: CheckCircle }
    case "PROCESSING":
      return { label: "Processing", color: "bg-yellow-100 text-yellow-800", icon: Clock }
    default:
      return { label: "Generated", color: "bg-gray-100 text-gray-800", icon: FileText }
  }
}

export const GroupsList: FC<GroupsListProps> = ({ groups }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-10">
        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No Payroll Groups</h3>
        <p className="text-sm text-gray-500">Generated groups will show up here when available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const status = getGroupStatus(group)
        const StatusIcon = status.icon
        return (
          <Card key={group.id} className="border border-gray-200/70 hover:border-bisu-purple-medium/50 transition-colors">
            <div className="flex items-start justify-between p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-bisu-purple-light/40 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-bisu-purple-deep" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate text-gray-900">{group.scheduleName}</div>
                  <div className="text-xs text-muted-foreground truncate">{group.employeeCount} employees • {group.departments.join(", ")}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(group.payPeriodStart)} - {formatDate(group.payPeriodEnd)}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-gray-900">{formatCurrency(group.totalNetPay)}</div>
                <div className="text-[11px] text-muted-foreground">{group.fileCount} files</div>
                <div className="mt-1 inline-flex items-center">
                  <Badge className={status.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}


