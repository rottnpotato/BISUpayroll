"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { useToast } from "@/hooks/use-toast"
import { 
  RecentReportsTable, 
  MonthlyPayrollGenerator, 
  PayrollPreviewDialog,
  PayrollDebugModal
} from '../components'
import { useReportsState, usePayrollGeneration, usePrintPayroll } from '../hooks'
import { usePayrollData } from '../hooks/usePayrollData'
import { reportTemplateData } from '../constants'
import { filterReports, generatePrintHTML, parseSavedLedgerJsonToPayrollData } from '../utils/reports'
import type { Report } from '../types'

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
} as const

export default function PayrollLedgerPage() {
  const { toast } = useToast()
  const { schedules } = usePayrollData()

  const {
    isLoading: reportsLoading,
    reports,
    searchTerm,
    setSearchTerm,
    selectedReportType,
    setSelectedReportType,
    dateRange,
    setDateRange,
    templateDateRanges,
    updateTemplateDateRange,
    selectedDepartment,
    setSelectedDepartment,
    selectedEmploymentStatus,
    setSelectedEmploymentStatus
  } = useReportsState()

  const {
    isGenerating,
    payrollData,
    selectedTemplate,
    generatePayroll
  } = usePayrollGeneration()

  const [showPreview, setShowPreview] = useState(false)

  const { printPayroll } = usePrintPayroll()

  const filteredReports = filterReports(reports, searchTerm, selectedReportType)

  const handleGenerateMonthlyPayroll = async () => {
    const monthlyTemplate = reportTemplateData.find(t => t.type === 'monthly')
    if (!monthlyTemplate) return
    const templateDateRange = templateDateRanges[monthlyTemplate.id]
    const result = await generatePayroll(
      { ...monthlyTemplate, icon: null } as any,
      templateDateRange!,
      selectedDepartment,
      selectedEmploymentStatus
    )
    if (result) setShowPreview(true)
  }

  const handlePrint = async () => {
    const templateDateRange = selectedTemplate ? templateDateRanges[selectedTemplate.id] : undefined
    const success = await printPayroll(
      payrollData, 
      templateDateRange, 
      selectedTemplate?.type || 'custom',
      undefined,
      undefined,
      selectedTemplate,
      selectedEmploymentStatus
    )
    if (success) {
      setShowPreview(false)
    }
  }

  const handlePrintSavedReport = async (report: Report) => {
    try {
      if (!report?.id) {
        toast({ title: "Invalid report", description: "Missing report identifier.", variant: "destructive" })
        return
      }

      const res = await fetch(`/api/admin/payroll/files/${report.id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' })
      })

      if (!res.ok) {
        throw new Error(`Failed to load report content (${res.status})`)
      }

      const data = await res.json()
      const content: string = data?.content || ''

      let htmlContent = ''
      if (content.trim().startsWith('<')) {
        htmlContent = content
      } else {
        const { payrollData: parsedData, dateRange, employmentStatus } = parseSavedLedgerJsonToPayrollData(content)
        htmlContent = generatePrintHTML(parsedData, dateRange, null, employmentStatus || selectedEmploymentStatus)
      }

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({ title: "Print Blocked", description: "Allow popups to print the ledger.", variant: "destructive" })
        return
      }

      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      setTimeout(() => {
        try {
          printWindow.print()
          setTimeout(() => { printWindow.close() }, 1000)
        } catch (e) {
          console.error('Print error:', e)
          toast({ title: "Print Error", description: "Unable to print the ledger.", variant: "destructive" })
        }
      }, 500)
    } catch (error) {
      console.error('Failed to print saved report:', error)
      toast({ title: "Print Error", description: "There was an issue printing the selected ledger.", variant: "destructive" })
    }
  }

  if (reportsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={8} />
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <motion.div variants={itemVariants}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">
            Payroll Ledger
          </h1>
          <p className="text-muted-foreground">
            Generate and manage payroll reports and ledgers
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="flex justify-end mb-3">
              <PayrollDebugModal 
                defaultStartDate={templateDateRanges[reportTemplateData.find(t => t.type === 'monthly')!.id]?.from}
                defaultEndDate={templateDateRanges[reportTemplateData.find(t => t.type === 'monthly')!.id]?.to}
              />
            </div>
            <MonthlyPayrollGenerator
              dateRange={templateDateRanges[reportTemplateData.find(t => t.type === 'monthly')!.id]}
              onDateRangeChange={(range) => {
                const monthly = reportTemplateData.find(t => t.type === 'monthly')!
                updateTemplateDateRange(monthly.id, range)
              }}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              selectedEmploymentStatus={selectedEmploymentStatus}
              onEmploymentStatusChange={setSelectedEmploymentStatus}
              onGenerate={handleGenerateMonthlyPayroll}
              isGenerating={isGenerating}
              schedules={schedules}
            />
          </div>

          <RecentReportsTable
            reports={filteredReports}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedReportType={selectedReportType}
            setSelectedReportType={setSelectedReportType}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onOpenReport={(report) => {
              if (report.downloadUrl) {
                window.open(report.downloadUrl, '_blank', 'noopener,noreferrer')
              }
            }}
            onDownload={(report) => {
              if (report.downloadUrl) {
                window.open(report.downloadUrl, '_blank', 'noopener,noreferrer')
              }
            }}
            onPrint={(report) => { handlePrintSavedReport(report) }}
          />
        </div>
      </motion.div>

      <PayrollPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        payrollData={payrollData}
        templateDateRange={selectedTemplate ? templateDateRanges[selectedTemplate.id] : undefined}
        selectedTemplate={selectedTemplate}
        onPrint={handlePrint}
        employmentStatus={selectedEmploymentStatus}
      />
    </motion.div>
  )
}
