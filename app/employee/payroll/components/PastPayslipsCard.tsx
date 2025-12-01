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
    try {
      setIsGenerating(record.id)
      setSelectedPayslip(record)
      toast.message('Loading payslip…')
      
      // Use on-demand generation API for all records
      const res = await fetch('/api/employee/payslip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payPeriodStart: new Date(record.payPeriodStart).toISOString(),
          payPeriodEnd: new Date(record.payPeriodEnd).toISOString(),
          format: 'pdf'
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to load payslip')
        setIsGenerating(null)
        return
      }
      
      const blob = await res.blob()
      const isPdf = blob.type === 'application/pdf'
      
      if (isPdf) {
        const objectUrl = URL.createObjectURL(blob)
        setPdfUrl(prev => {
          if (prev) URL.revokeObjectURL(prev)
          return objectUrl
        })
        setShowPdf(true)
        toast.success('Payslip loaded')
      } else {
        const fileName = `Payslip_${formatDate(record.payPeriodStart)}_to_${formatDate(record.payPeriodEnd)}.docx`
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        toast.success('Payslip downloaded as DOCX')
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error loading payslip')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleDownloadPayslip = async (record: PayrollRecord) => {
    try {
      setIsGenerating(record.id)
      toast.message('Preparing download…')
      
      // Use on-demand generation API for all records
      const res = await fetch('/api/employee/payslip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payPeriodStart: new Date(record.payPeriodStart).toISOString(),
          payPeriodEnd: new Date(record.payPeriodEnd).toISOString(),
          format: 'pdf'
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to download payslip')
        setIsGenerating(null)
        return
      }
      
      const blob = await res.blob()
      const isPdf = blob.type === 'application/pdf'
      const ext = isPdf ? 'pdf' : 'docx'
      const periodStart = formatDate(record.payPeriodStart).replace(/,?\s+/g, '-')
      const periodEnd = formatDate(record.payPeriodEnd).replace(/,?\s+/g, '-')
      const fileName = `Payslip_${periodStart}_to_${periodEnd}.${ext}`
      
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(`Payslip downloaded as ${ext.toUpperCase()}`)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
    } catch (err) {
      console.error(err)
      toast.error('Error downloading payslip')
    } finally {
      setIsGenerating(null)
    }
  }

  const handlePrintPayslip = () => {
    const iframe = document.getElementById('payslip-pdf-frame') as HTMLIFrameElement | null
    try { 
      iframe?.contentWindow?.focus()
      iframe?.contentWindow?.print()
    } catch {
      toast.error('Unable to print. Please use your browser\'s print function.')
    }
  }

  const handleDownloadFromPreview = () => {
    if (!pdfUrl || !selectedPayslip) return
    
    const periodStart = formatDate(selectedPayslip.payPeriodStart).replace(/,?\s+/g, '-')
    const periodEnd = formatDate(selectedPayslip.payPeriodEnd).replace(/,?\s+/g, '-')
    const fileName = `Payslip_${periodStart}_to_${periodEnd}.pdf`
    
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.success('Payslip downloaded')
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
      toast.message('Generating payslip…')
      
      const res = await fetch(`/api/employee/payslip/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        // Set a temporary payslip record for the custom period
        setSelectedPayslip({
          id: 'custom',
          payPeriodStart: customPeriodStart,
          payPeriodEnd: customPeriodEnd,
          dailyRate: 0,
          overtime: 0,
          deductions: 0,
          bonuses: 0,
          grossPay: 0,
          netPay: 0,
          isPaid: false,
          paidAt: null,
          isGenerated: true,
          generatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        })
        setPdfUrl(prev => {
          if (prev) URL.revokeObjectURL(prev)
          return objectUrl
        })
        setShowCustomPeriodDialog(false)
        setShowPdf(true)
        toast.success('Payslip generated successfully')
      } else {
        const periodStart = formatDate(customPeriodStart).replace(/,?\s+/g, '-')
        const periodEnd = formatDate(customPeriodEnd).replace(/,?\s+/g, '-')
        const fileName = `Payslip_${periodStart}_to_${periodEnd}.docx`
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        toast.success('Payslip downloaded as DOCX')
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
        setShowCustomPeriodDialog(false)
      }

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
                            disabled={isGenerating === record.id}
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
                            disabled={isGenerating === record.id}
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
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <FileText className="h-5 w-5" />
                Payslip Preview
                {selectedPayslip && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({formatDate(selectedPayslip.payPeriodStart)} - {formatDate(selectedPayslip.payPeriodEnd)})
                  </span>
                )}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadFromPreview}
                  className="text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrintPayslip}
                  className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 border rounded-lg bg-gray-100 overflow-hidden shadow-inner">
            {pdfUrl ? (
              <iframe
                id="payslip-pdf-frame"
                src={pdfUrl}
                className="w-full h-full"
                title="Payslip PDF Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-bisu-purple-deep animate-spin" />
                  <span>Loading payslip…</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-center">
            Use the buttons above to download or print your payslip.
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
