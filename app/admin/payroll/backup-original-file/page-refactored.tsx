"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { 
  Calculator, 
  Clock, 
  CalendarDays, 
  DollarSign,
  Percent,
  FileText
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
  TaxConfigSummaryCard
} from '../components'

import { usePayrollData } from '../hooks/usePayrollData'
import { usePayrollRules } from '../hooks/usePayrollRules'
import { usePayrollConfig } from '../hooks/usePayrollConfig'
import type { PayrollRule, PayrollSchedule } from '../types'

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
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PayrollRule | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<PayrollSchedule | null>(null)

  const {
    formData,
    setFormData,
    selectedRule,
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
    setWorkingHoursConfig,
    setRatesConfig,
    setLeaveBenefitsConfig
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
            <p className="text-muted-foreground">
              Configure payroll rules, schedules, and processing parameters
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
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Configure payroll rules, schedules, and processing parameters
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Payroll Rules
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Payroll Rules Management
                </CardTitle>
              </CardHeader>
              <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Payroll Schedules
                </CardTitle>
                <CardDescription>
                  Manage payroll processing schedules and timing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Schedule management functionality coming soon...</p>
                  <p className="text-sm mt-2">Currently {schedules.length} schedules configured</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <motion.div 
            className="grid gap-6 md:grid-cols-2"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <WorkingHoursCard
                config={workingHoursConfig}
                onConfigChange={setWorkingHoursConfig}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <RatesConfigCard
                config={ratesConfig}
                onConfigChange={setRatesConfig}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <LeaveBenefitsCard
                config={leaveBenefitsConfig}
                onConfigChange={setLeaveBenefitsConfig}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <HolidayConfigCard />
            </motion.div>

            <motion.div className="md:col-span-2" variants={itemVariants}>
              <TaxConfigSummaryCard
                ratesConfig={ratesConfig}
                leaveBenefitsConfig={leaveBenefitsConfig}
              />
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Payroll Rule Dialog */}
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
          setFormData(prev => ({ ...prev, [field]: value }))
        }}
        onUserSelection={handleUserSelection}
        onSelectAllUsers={handleSelectAllUsersWrapper}
        users={users}
        isUsersLoading={false}
        isEdit={!!editingRule}
        title={editingRule ? "Edit Payroll Rule" : "Add New Payroll Rule"}
      />
    </motion.div>
  )
}
