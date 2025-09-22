import { FC } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Download, CheckCircle, Archive } from "lucide-react"
import { PayrollFile } from "../../types"

interface FilesListProps {
  files: PayrollFile[]
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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const getFileStatus = (file: PayrollFile) => {
  switch (file.status) {
    case "APPROVED":
      return { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle }
    case "ARCHIVED":
      return { label: "Archived", color: "bg-gray-100 text-gray-800", icon: Archive }
    default:
      return { label: "Generated", color: "bg-blue-100 text-blue-800", icon: FileText }
  }
}

export const FilesList: FC<FilesListProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <div className="text-center py-10">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No Payroll Files</h3>
        <p className="text-sm text-gray-500">Generated payroll files will appear here when available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const status = getFileStatus(file)
        const StatusIcon = status.icon
        return (
          <Card key={file.id} className="border border-gray-200/70 hover:border-bisu-purple-medium/50 transition-colors">
            <div className="flex items-start justify-between p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-bisu-purple-light/40 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-bisu-purple-deep" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate text-gray-900">{file.fileName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {file.reportType} • {file.employeeCount} employees{file.department ? ` • ${file.department}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(file.generatedAt)} • {formatFileSize(file.fileSize)}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-gray-900">{formatCurrency(file.totalNetPay)}</div>
                <div className="text-[11px] text-muted-foreground">Downloads: {file.downloadCount}</div>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <Badge className={status.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}


