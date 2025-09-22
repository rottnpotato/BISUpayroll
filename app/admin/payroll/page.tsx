"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Button } from "@/components/ui/button"
import { 
  Calculator, 
  Clock, 
  CalendarDays,
  FileText,
  BarChart3,
  Settings,
  Save,
  AlertCircle
} from "lucide-react"

// Import our modular components and hooks
import {
  PayrollRulesTable,
  PayrollRuleDialog,
  PayrollScheduleCard,
  WorkingHoursCard,
  RatesConfigCard,
  LeaveBenefitsCard,
  HolidayConfigCard,
  TaxConfigSummaryCard,
  ContributionsConfigCard,
  TaxBracketsConfigCard,
  PayrollOverview,
  ReportsHeader,
  RecentReportsTable,
  PayrollPreviewDialog,
  ConfigurationLayout,
  MonthlyPayrollGenerator
} from './components'

import { UnsavedChangesDialog } from './components/UnsavedChangesDialog'
import { usePayrollData } from './hooks/usePayrollData'
import { usePayrollRules } from './hooks/usePayrollRules'
import { usePayrollConfig } from './hooks/usePayrollConfig'
import { useReportsState, usePayrollGeneration, usePrintPayroll } from './hooks'
import { reportTemplateData } from './constants'
import { filterReports, generatePrintHTML, parseSavedLedgerJsonToPayrollData } from './utils/reports'
import type { PayrollRule, Report } from './types'
import { useToast } from "@/hooks/use-toast"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

export default function PayrollPage() {
  // Use our custom hooks for data and state management
  const { rules, users, schedules, isLoading, loadData } = usePayrollData()
  const { toast } = useToast()
  
  // Tab state management with URL hash support
  const [activeTab, setActiveTab] = useState("overview")
  
  // Handle URL hash for tab navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const normalized = hash === 'reports' ? 'ledger' : hash
    if (normalized && ['overview', 'rules', 'schedules', 'configuration', 'ledger'].includes(normalized)) {
      setActiveTab(normalized)
    }
  }, [])
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PayrollRule | null>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  // Reports state management
  const {
    isLoading: reportsLoading,
    reports,
    searchTerm,
    setSearchTerm,
    selectedReportType,
    setSelectedReportType,
    selectedTab: reportsTab,
    setSelectedTab: setReportsTab,
    dateRange,
    setDateRange,
    templateDateRanges,
    updateTemplateDateRange,
    selectedDepartment,
    setSelectedDepartment
  } = useReportsState()

  const {
    isGenerating,
    payrollData,
    selectedTemplate,
    generatePayroll,
    clearPayrollData
  } = usePayrollGeneration()

  const { printPayroll } = usePrintPayroll()

  // UI state for reports
  const [showPreview, setShowPreview] = useState(false)

  const {
    formData,
    handleFormChange,
    handleUserSelection,
    handleSelectAllUsers,
    handleAddRule,
    handleEditRule,
    handleUpdateRule,
    handleDeleteRule,
    handleToggleRuleStatus,
    resetForm
  } = usePayrollRules(loadData)

  const {
    workingHoursConfig,
    ratesConfig,
    leaveBenefitsConfig,
    contributionsConfig,
    taxBracketsConfig,
    setWorkingHoursConfig,
    setRatesConfig,
    setLeaveBenefitsConfig,
    setContributionsConfig,
    setTaxBracketsConfig,
    loadConfigurations,
    saveAllConfigurations,
    saveWorkingHoursConfig,
    saveRatesConfig,
    saveLeaveBenefitsConfig,
    saveContributionsConfig,
    saveTaxBracketsConfig,
    fetchExternalData,
    unsavedChanges,
    hasUnsavedChanges,
    isAutoSaving
  } = usePayrollConfig()

  // Handle opening edit dialog
  const handleEditRuleClick = (rule: PayrollRule) => {
    handleEditRule(rule)
    setEditingRule(rule)
    setIsDialogOpen(true)
  }

  // Handle opening add dialog
  const handleAddRuleClick = () => {
    resetForm()
    setEditingRule(null)
    setIsDialogOpen(true)
  }

  // Handle form submission
  const handleSubmitRule = async (): Promise<boolean> => {
    const success = editingRule ? await handleUpdateRule() : await handleAddRule()
    if (success) {
      setIsDialogOpen(false)
      setEditingRule(null)
    }
    return success
  }

  // Handle select all users - wrapper to match expected signature
  const handleSelectAllUsersWrapper = (checked: boolean) => {
    handleSelectAllUsers(checked, users)
  }

  // Handle refresh for schedules
  const handleScheduleRefresh = () => {
    loadData()
  }

  // Handle tab change with unsaved changes check
  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    }
  }

  // Handle manual save all configurations
  const handleSaveAll = async () => {
    return await saveAllConfigurations()
  }

  // Test beforeunload dialog (for debugging)
  const testBeforeUnload = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave? This simulates page refresh behavior.')
      if (confirmLeave) {
        // User confirmed, they would lose changes
        console.log('User confirmed leaving with unsaved changes')
      }
    }
  }

  // Get list of changed sections for dialog
  const getChangedSections = () => {
    const sections = []
    if (unsavedChanges.workingHours) sections.push('workingHours')
    if (unsavedChanges.rates) sections.push('rates')
    if (unsavedChanges.leaveBenefits) sections.push('leaveBenefits')
    return sections
  }

  // Filter reports based on search criteria for reports tab
  const filteredReports = filterReports(reports, searchTerm, selectedReportType)

  // Handle payroll generation for reports tab
  const handleGenerateMonthlyPayroll = async () => {
    const monthlyTemplate = reportTemplateData.find(t => t.type === 'monthly')
    if (!monthlyTemplate) return
    const templateDateRange = templateDateRanges[monthlyTemplate.id]
    const result = await generatePayroll(
      { ...monthlyTemplate, icon: null } as any,
      templateDateRange!,
      selectedDepartment
    )
    if (result) setShowPreview(true)
  }

  // Handle print for reports tab
  const handlePrint = async () => {
    const templateDateRange = selectedTemplate ? templateDateRanges[selectedTemplate.id] : undefined
    const success = await printPayroll(
      payrollData, 
      templateDateRange, 
      selectedTemplate?.type || 'custom',
      undefined, // scheduleId - you can get this from the active schedule if needed
      undefined,  // scheduleName - you can get this from the active schedule if needed
      selectedTemplate
    )
    if (success) {
      setShowPreview(false)
    }
  }

  // Handle printing of an already-saved ledger from Recent Reports
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
        // Already HTML
        htmlContent = content
      } else {
        // Likely JSON ledger → transform to printable HTML
        const { payrollData: parsedData, dateRange } = parseSavedLedgerJsonToPayrollData(content)
        htmlContent = generatePrintHTML(parsedData, dateRange, null)
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

  if (isLoading) {
    return (
  <div className="space-y-6 xl:ml-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll Management Configuration</h1>
            <p className="text-muted-foreground">
              Configure payroll calculations, schedules, and processing parameters
            </p>
          </div>
        </div>
        <div className="grid gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6 xl:ml-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Normal header - not sticky */}
      <motion.div 
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-bisu-purple-deep">
            Payroll Management Configuration
          </h1>
          <p className="text-muted-foreground">
            Configure payroll calculations, schedules, and processing parameters for BISU
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAutoSaving && (
            <div className="flex items-center gap-2 text-sm text-bisu-purple-medium">
              <div className="animate-spin h-4 w-4 border-2 border-bisu-purple-medium border-t-transparent rounded-full" />
              Auto-saving...
            </div>
          )}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                Unsaved changes ({getChangedSections().length} section{getChangedSections().length !== 1 ? 's' : ''})
              </div>
              <Button 
                onClick={handleSaveAll}
                size="sm"
                className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
            </div>
          )}
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-500 ml-2">
            {hasUnsavedChanges ? '🔴 Protected' : '🟢 Clean'}
          </div>
          {/* Test button for beforeunload - remove in production */}
          {hasUnsavedChanges && (
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Test Reload Protection
            </Button>
          )}
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-bisu-purple-extralight">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white">
            <Calculator className="h-4 w-4" />
            Payroll Calculations
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white">
            <CalendarDays className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger 
            value="configuration" 
            className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white relative"
          >
            <Settings className="h-4 w-4" />
            Configuration
            {hasUnsavedChanges && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-2 text-bisu-purple-deep data-[state=active]:bg-bisu-purple-deep data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PayrollOverview
            rules={rules}
            schedules={schedules}
            workingHoursConfig={workingHoursConfig}
            ratesConfig={ratesConfig}
            leaveBenefitsConfig={leaveBenefitsConfig}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="bg-bisu-purple-extralight">
                <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                  <Calculator className="h-5 w-5" />
                  Payroll Calculations Management
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <PayrollRulesTable
                  rules={rules}
                  onEdit={handleEditRuleClick}
                  onDelete={handleDeleteRule}
                  onToggleStatus={handleToggleRuleStatus}
                  onAdd={handleAddRuleClick}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <motion.div variants={itemVariants}>
            <PayrollScheduleCard
              schedules={schedules}
              onRefresh={handleScheduleRefresh}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="configuration" className="p-0">
          <ConfigurationLayout
            workingHoursConfig={workingHoursConfig}
            ratesConfig={ratesConfig}
            leaveBenefitsConfig={leaveBenefitsConfig}
            contributionsConfig={contributionsConfig}
            taxBracketsConfig={taxBracketsConfig}
            setWorkingHoursConfig={setWorkingHoursConfig}
            setRatesConfig={setRatesConfig}
            setLeaveBenefitsConfig={setLeaveBenefitsConfig}
            setContributionsConfig={setContributionsConfig}
            setTaxBracketsConfig={setTaxBracketsConfig}
            saveWorkingHoursConfig={saveWorkingHoursConfig}
            saveRatesConfig={saveRatesConfig}
            saveLeaveBenefitsConfig={saveLeaveBenefitsConfig}
            saveContributionsConfig={saveContributionsConfig}
            saveTaxBracketsConfig={saveTaxBracketsConfig}
            fetchExternalData={fetchExternalData}
            unsavedChanges={unsavedChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            isAutoSaving={isAutoSaving}
            saveAllConfigurations={saveAllConfigurations}
          />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          <motion.div variants={itemVariants}>
            {reportsLoading ? (
              <SkeletonCard lines={8} />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <MonthlyPayrollGenerator
                  dateRange={templateDateRanges[reportTemplateData.find(t => t.type === 'monthly')!.id]}
                  onDateRangeChange={(range) => {
                    const monthly = reportTemplateData.find(t => t.type === 'monthly')!
                    updateTemplateDateRange(monthly.id, range)
                  }}
                  selectedDepartment={selectedDepartment}
                  onDepartmentChange={setSelectedDepartment}
                  onGenerate={handleGenerateMonthlyPayroll}
                  isGenerating={isGenerating}
                  schedules={schedules}
                />

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
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
                </motion.div>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Payroll Calculation Dialog */}
      <PayrollRuleDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingRule(null)
        }}
        onSubmit={handleSubmitRule}
        formData={formData}
        onFormChange={handleFormChange}
        onSelectChange={(field: string, value: string) => {
          handleFormChange({ target: { name: field, value } } as any)
        }}
        onUserSelection={handleUserSelection}
        onSelectAllUsers={handleSelectAllUsersWrapper}
        users={users}
        isUsersLoading={false}
        isEdit={!!editingRule}
        title={editingRule ? "Edit Payroll Calculation" : "Add New Payroll Calculation"}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onSave={saveAllConfigurations}
        onDiscard={() => {
          // Reload configurations to discard changes
          loadConfigurations()
        }}
        changedSections={getChangedSections()}
      />

      {/* Payroll Preview Dialog */}
      <PayrollPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        payrollData={payrollData}
        templateDateRange={selectedTemplate ? templateDateRanges[selectedTemplate.id] : undefined}
        selectedTemplate={selectedTemplate}
        onPrint={handlePrint}
      />

      {/* Fixed Save Button - Always visible when there are unsaved changes */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button 
              onClick={handleSaveAll}
              size="lg"
              className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium shadow-2xl border-2 border-white rounded-full px-6 py-4 min-w-[200px]"
            >
              <Save className="h-5 w-5 mr-2" />
              Save All Changes
              <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                {getChangedSections().length}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
