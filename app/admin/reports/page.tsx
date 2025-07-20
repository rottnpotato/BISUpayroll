"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import modular components and hooks
import {
  ReportsHeader,
  RecentReportsTable,
  PayrollGenerationCard,
  PayrollPreviewDialog
} from './components'

import {
  useReportsState,
  usePayrollGeneration,
  usePrintPayroll
} from './hooks'

import { reportTemplateData } from './constants'
import { filterReports } from './utils'

export default function PayrollGenerationPage() {
  // Use custom hooks for state management
  const {
    isLoading,
    reports,
    searchTerm,
    setSearchTerm,
    selectedReportType,
    setSelectedReportType,
    selectedTab,
    setSelectedTab,
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
    testUsers,
    clearPayrollData
  } = usePayrollGeneration()

  const { printPayroll } = usePrintPayroll()

  // UI state
  const [showPreview, setShowPreview] = useState(false)

  // Filter reports based on search criteria
  const filteredReports = filterReports(reports, searchTerm, selectedReportType)

  // Handle payroll generation
  const handleGeneratePayroll = async (templateData: any) => {
    const templateDateRange = templateDateRanges[templateData.id]
    const result = await generatePayroll(
      { ...templateData, icon: null }, // Convert template data to ReportTemplate
      templateDateRange!,
      selectedDepartment
    )
    
    if (result) {
      setShowPreview(true)
    }
  }

  // Handle print
  const handlePrint = () => {
    const templateDateRange = selectedTemplate ? templateDateRanges[selectedTemplate.id] : undefined
    const success = printPayroll(payrollData, templateDateRange)
    if (success) {
      setShowPreview(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="p-6">
      <ReportsHeader 
        title="Payroll Generation"
        description="Generate comprehensive payroll reports with attendance integration"
      />

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="text-white w-full bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium border border-bisu-yellow-DEFAULT/20">
          <TabsTrigger 
            value="recent" 
            className="flex-1 data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-yellow-light"
          >
            Recent Reports
          </TabsTrigger>
          <TabsTrigger 
            value="generate" 
            className="flex-1 data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-yellow-light"
          >
            Generate Payroll
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <SkeletonCard lines={8} />
        ) : (
          <>
            <TabsContent value="recent" className="mt-6">
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
                  onTestUsers={testUsers}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="generate" className="mt-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={selectedTab === "generate" ? "visible" : "hidden"}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {reportTemplateData.map((template) => (
                  <PayrollGenerationCard
                    key={template.id}
                    template={template}
                    templateDateRange={templateDateRanges[template.id]}
                    onDateRangeChange={(range) => updateTemplateDateRange(template.id, range)}
                    selectedDepartment={selectedDepartment}
                    onDepartmentChange={setSelectedDepartment}
                    onGenerate={() => handleGeneratePayroll(template)}
                    isGenerating={isGenerating}
                  />
                ))}
              </motion.div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Payroll Preview Dialog */}
      <PayrollPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        payrollData={payrollData}
        templateDateRange={selectedTemplate ? templateDateRanges[selectedTemplate.id] : undefined}
        onPrint={handlePrint}
      />
    </div>
  )
} 