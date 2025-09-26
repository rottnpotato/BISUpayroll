"use client"

import { FC, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FolderOpen, FileText, RefreshCw, Download, Filter } from "lucide-react"
import type { PayrollGroup, PayrollFile } from "../../types"

type FilterType = "all" | "groups" | "files"

interface RecentActivityProps {
  groups: PayrollGroup[]
  files: PayrollFile[]
  onRefresh?: () => void
  onExpand?: () => Promise<void> | void
  initialLimit?: number
}

export const RecentActivity: FC<RecentActivityProps> = ({
  groups,
  files,
  onRefresh,
  onExpand,
  initialLimit = 8
}) => {
  const [filter, setFilter] = useState<FilterType>("all")
  const [expanded, setExpanded] = useState(false)
  const [expanding, setExpanding] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDateTime = (date: string | Date) => {
    const d = new Date(date)
    return `${d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} • ${d.toLocaleTimeString("en-PH", { hour: '2-digit', minute: '2-digit' })}`
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const items = useMemo(() => {
    const groupItems = groups.map(g => ({
      id: `group-${g.id}`,
      type: "group" as const,
      date: new Date(g.generatedAt || g.payPeriodEnd),
      title: g.scheduleName || "Payroll Group",
      subtitle: `${g.employeeCount} employees • ${Array.isArray(g.departments) ? g.departments.join(", ") : ''}`,
      meta: `${formatCurrency(g.totalNetPay)} • ${g.fileCount} files`,
      status: g.status,
      payload: g
    }))

    const fileItems = files.map(f => ({
      id: `file-${f.id}`,
      type: "file" as const,
      date: new Date(f.generatedAt || f.payPeriodEnd),
      title: f.fileName,
      subtitle: `${f.reportType} • ${f.employeeCount} employees${f.department ? ` • ${f.department}` : ""}`,
      meta: `${formatFileSize(f.fileSize)}`,
      status: f.status,
      payload: f
    }))

    const merged = [...groupItems, ...fileItems]
    merged.sort((a, b) => b.date.getTime() - a.date.getTime())
    return merged
  }, [groups, files])

  const filteredItems = items.filter(item => {
    if (filter === "groups") return item.type === "group"
    if (filter === "files") return item.type === "file"
    return true
  })

  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, initialLimit)

  const getStatusBadge = (type: "group" | "file", status?: string) => {
    if (!status) return { label: "", color: "bg-gray-100 text-gray-800" }
    if (type === "group") {
      switch (status) {
        case "COMPLETED":
          return { label: "Completed", color: "bg-green-100 text-green-800" }
        case "APPROVED":
          return { label: "Approved", color: "bg-blue-100 text-blue-800" }
        case "PROCESSING":
          return { label: "Processing", color: "bg-yellow-100 text-yellow-800" }
        default:
          return { label: "Generated", color: "bg-gray-100 text-gray-800" }
      }
    }
    // file
    switch (status) {
      case "APPROVED":
        return { label: "Approved", color: "bg-green-100 text-green-800" }
      case "ARCHIVED":
        return { label: "Archived", color: "bg-gray-100 text-gray-800" }
      default:
        return { label: "Generated", color: "bg-blue-100 text-blue-800" }
    }
  }

  const handleToggleExpand = async () => {
    if (!expanded && onExpand) {
      try {
        setExpanding(true)
        await onExpand()
      } catch (_e) {
        // ignore
      } finally {
        setExpanding(false)
      }
    }
    setExpanded(prev => !prev)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
            <FolderOpen className="h-5 w-5" />
            Recent Payroll Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex rounded-full bg-bisu-purple-extralight p-1">
              <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className={filter === "all" ? "h-7 px-3 bg-bisu-purple-deep text-white" : "h-7 px-3"} onClick={() => setFilter("all")}>All</Button>
              <Button variant={filter === "groups" ? "default" : "ghost"} size="sm" className={filter === "groups" ? "h-7 px-3 bg-bisu-purple-deep text-white" : "h-7 px-3"} onClick={() => setFilter("groups")}>Groups</Button>
              <Button variant={filter === "files" ? "default" : "ghost"} size="sm" className={filter === "files" ? "h-7 px-3 bg-bisu-purple-deep text-white" : "h-7 px-3"} onClick={() => setFilter("files")}>Files</Button>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="text-bisu-purple-deep border-bisu-purple-medium hover:bg-bisu-yellow-light">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">No Recent Activity</h3>
            <p className="text-sm text-gray-500">Generated groups and payroll files will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const isGroup = item.type === "group"
              const Icon = isGroup ? FolderOpen : FileText
              const status = getStatusBadge(item.type, item.status as string)
              const payload: any = (item as any).payload
              const rightPrimary = isGroup
                ? formatCurrency(payload?.totalNetPay || 0)
                : (payload?.fileSize ? formatFileSize(payload.fileSize) : "")
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between p-4 rounded-lg border border-gray-200/70 hover:border-bisu-purple-medium/50 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-bisu-purple-light/40 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-bisu-purple-deep" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate text-gray-900">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(item.date as Date)}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-gray-900">{rightPrimary}</div>
                      <div className="text-[11px] text-muted-foreground">{isGroup ? `${(item as any).payload.fileCount} files` : `Downloads: ${(item as any).payload.downloadCount || 0}`}</div>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <Badge className={status.color}>{status.label}</Badge>
                        {!isGroup && (
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {filteredItems.length > initialLimit && (
              <div className="pt-2 flex justify-center">
                <Button onClick={handleToggleExpand} variant="outline" size="sm" className="border-bisu-purple-medium text-bisu-purple-deep hover:bg-bisu-yellow-light min-w-[140px]">
                  {expanding ? (
                    <span className="flex items-center"><span className="animate-spin h-4 w-4 border-2 border-bisu-purple-medium border-t-transparent rounded-full mr-2" />Loading...</span>
                  ) : expanded ? "Show less" : "See more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


