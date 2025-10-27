"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  CheckCircle,
  Clock,
  Printer,
  Plus
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface PayrollRecord {
  id: string
  payPeriodStart: string
  payPeriodEnd: string
  dailyRate: number
  overtime: number
  deductions: number
  bonuses: number
  grossPay: number
  netPay: number
  isPaid: boolean
  paidAt: string | null
  isGenerated: boolean
  generatedAt: string | null
  createdAt: string
}

interface PastPayslipsCardProps {
  payrollHistory: PayrollRecord[]
}

export function PastPayslipsCard({ payrollHistory }: PastPayslipsCardProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showPdf, setShowPdf] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null)
  const [showCustomPeriodDialog, setShowCustomPeriodDialog] = useState(false)
  const [customPeriodStart, setCustomPeriodStart] = useState('')
  const [customPeriodEnd, setCustomPeriodEnd] = useState('')
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPayrollStatus = (record: PayrollRecord) => {
    if (record.isPaid) return { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    if (record.isGenerated) return { label: 'Awaiting Payment', color: 'bg-orange-100 text-orange-800', icon: Clock }
    return null
  }

  const handleViewPayslip = async (record: PayrollRecord) => {
    if (!record.isGenerated) {
      toast.error('Payslip not yet generated for this period')
      return
    }

    try {
      setIsGenerating(record.id)
      setSelectedPayslip(record)
      toast.message('Generating payslip…')
      
      const res = await fetch(`/api/employee/payslip/${record.id}?format=pdf`)
      if (!res.ok) {
        toast.error('Failed to generate payslip')
        setIsGenerating(null)
        return
      }
      
      const blob = await res.blob()
      const isPdf = blob.type === 'application/pdf'
      
      if (isPdf) {
        const objectUrl = URL.createObjectURL(blob)
        const printWindow = window.open(objectUrl, '_blank')
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
            }, 250)
          }
          toast.success('Payslip opened for printing')
        } else {
          // Fallback if popup blocked
          setPdfUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return objectUrl
          })
          setShowPdf(true)
          toast.success('Payslip ready')
        }
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
      } else {
        // Fallback to download if PDF not produced
        const ext = 'docx'
        const fileName = `Payslip_${record.payPeriodStart}_${record.payPeriodEnd}.${ext}`
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        toast.success('Payslip (DOCX) download started')
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error generating payslip')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleDownloadPayslip = async (record: PayrollRecord) => {
    if (!record.isGenerated) {
      toast.error('Payslip not yet generated for this period')
      return
    }

    try {
      setIsGenerating(record.id)
      toast.message('Downloading payslip…')
      
      const res = await fetch(`/api/employee/payslip/${record.id}?format=pdf`)
      if (!res.ok) {
        toast.error('Failed to download payslip')
        setIsGenerating(null)
        return
      }
      
      const blob = await res.blob()
      const isPdf = blob.type === 'application/pdf'
      const ext = isPdf ? 'pdf' : 'docx'
      const fileName = `Payslip_${record.payPeriodStart}_${record.payPeriodEnd}.${ext}`
      
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success('Payslip downloaded')
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
    } catch (err) {
      console.error(err)
      toast.error('Error downloading payslip')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleGenerateCustomPeriod = async () => {
    if (!customPeriodStart || !customPeriodEnd) {
      toast.error('Please select both start and end dates')
      return
    }

    const startDate = new Date(customPeriodStart)
    const endDate = new Date(customPeriodEnd)

    if (startDate > endDate) {
      toast.error('Start date must be before end date')
      return
    }

    if (endDate > new Date()) {
      toast.error('End date cannot be in the future')
      return
    }

    try {
      setIsGeneratingCustom(true)
      toast.message('Generating payslip for custom period…')
      
      const res = await fetch(`/api/employee/payslip/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payPeriodStart: startDate.toISOString(),
          payPeriodEnd: endDate.toISOString(),
          format: 'pdf'
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to generate payslip')
        return
      }
      
      const blob = await res.blob()
      const isPdf = blob.type === 'application/pdf'
      
      if (isPdf) {
        const objectUrl = URL.createObjectURL(blob)
        const printWindow = window.open(objectUrl, '_blank')
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
            }, 250)
          }
          setShowCustomPeriodDialog(false)
          toast.success('Payslip opened for printing')
        } else {
          // Fallback if popup blocked
          setPdfUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return objectUrl
          })
          setShowPdf(true)
          setShowCustomPeriodDialog(false)
          toast.success('Payslip generated successfully')
        }
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
      } else {
        // Fallback to download if PDF not produced
        const ext = 'docx'
        const fileName = `Payslip_${customPeriodStart}_${customPeriodEnd}.${ext}`
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        toast.success('Payslip (DOCX) download started')
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
        setShowCustomPeriodDialog(false)
      }

      // Reset form
      setCustomPeriodStart('')
      setCustomPeriodEnd('')
    } catch (err) {
      console.error(err)
      toast.error('Error generating payslip')
    } finally {
      setIsGeneratingCustom(false)
    }
  }

  if (!payrollHistory || payrollHistory.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Payslips</h3>
          <p className="text-gray-500 text-center">
            Your payslip history will appear here once payroll is generated and processed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <FileText className="h-5 w-5" />
                Past Payslips
              </CardTitle>
              <CardDescription>View and download your historical payslips</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCustomPeriodDialog(true)}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate for Period
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollHistory.map((record, index) => {
                  const status = getPayrollStatus(record)
                  const StatusIcon = status?.icon
                  
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{formatDate(record.payPeriodStart)}</div>
                            <div className="text-xs text-gray-500">to {formatDate(record.payPeriodEnd)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.generatedAt ? formatDate(record.generatedAt) : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-700">
                        {formatCurrency(record.grossPay)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-700">
                        {formatCurrency(record.deductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-bisu-purple-deep">
                        {formatCurrency(record.netPay)}
                      </TableCell>
                      <TableCell>
                        {status && StatusIcon && (
                          <Badge className={`${status.color} rounded-full px-3 py-1 text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPayslip(record)}
                            disabled={!record.isGenerated || isGenerating === record.id}
                            className="text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight"
                          >
                            {isGenerating === record.id ? (
                              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-bisu-purple-deep animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPayslip(record)}
                            disabled={!record.isGenerated || isGenerating === record.id}
                            className="text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog 
        open={showPdf} 
        onOpenChange={(o) => { 
          if (!o) { 
            setShowPdf(false)
            setSelectedPayslip(null)
            if (pdfUrl) { 
              URL.revokeObjectURL(pdfUrl)
              setPdfUrl(null)
            } 
          } 
        }}
      >
        <DialogContent className="max-w-5xl w-full h-[90vh] p-4 flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between w-full">
              <span>
                Payslip Preview
                {selectedPayslip && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({formatDate(selectedPayslip.payPeriodStart)} - {formatDate(selectedPayslip.payPeriodEnd)})
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const iframe = document.getElementById('payslip-pdf-frame') as HTMLIFrameElement | null
                    try { 
                      iframe?.contentWindow?.focus()
                      iframe?.contentWindow?.print()
                    } catch {}
                  }}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 border rounded bg-muted overflow-hidden">
            {pdfUrl ? (
              <iframe
                id="payslip-pdf-frame"
                src={pdfUrl}
                className="w-full h-full"
                onLoad={(e) => {
                  // Auto attempt print once after load
                  setTimeout(() => {
                    try { 
                      const iframe = e.target as HTMLIFrameElement
                      if (iframe.contentWindow) {
                        iframe.contentWindow.focus()
                        iframe.contentWindow.print()
                      }
                    } catch {}
                  }, 400)
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading PDF…
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            If the print dialog does not appear automatically, click the Print button.
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Period Dialog */}
      <Dialog open={showCustomPeriodDialog} onOpenChange={setShowCustomPeriodDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-bisu-purple-deep">Generate Payslip for Custom Period</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select a date range to generate a payslip based on your attendance data for that period.
            </p>
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start Date</Label>
              <Input
                id="periodStart"
                type="date"
                value={customPeriodStart}
                onChange={(e) => setCustomPeriodStart(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End Date</Label>
              <Input
                id="periodEnd"
                type="date"
                value={customPeriodEnd}
                onChange={(e) => setCustomPeriodEnd(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={customPeriodStart}
              />
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This will generate a payslip based on your actual attendance data for the selected period, 
                regardless of whether payroll has been officially processed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomPeriodDialog(false)
                setCustomPeriodStart('')
                setCustomPeriodEnd('')
              }}
              disabled={isGeneratingCustom}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateCustomPeriod}
              disabled={isGeneratingCustom}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
            >
              {isGeneratingCustom ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Payslip
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
