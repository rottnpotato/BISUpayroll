import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface SummaryCardProps {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  iconColorClass?: string
}

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconColorClass = "text-bisu-green-600 dark:text-bisu-green-400",
}: SummaryCardProps) {
  return (
    <Card className="shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-bisu-green-800 dark:text-bisu-green-200">{title}</CardTitle>
        <Icon size={20} className={`text-muted-foreground ${iconColorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
