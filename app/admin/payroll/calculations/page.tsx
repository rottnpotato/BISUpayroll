"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator } from "lucide-react"
import { PayrollRulesTable, PayrollRuleDialog, ConfigurationStatusCard } from '../components'
import { usePayrollData } from '../hooks/usePayrollData'
import { usePayrollRules } from '../hooks/usePayrollRules'
import { usePayrollConfig } from '../hooks/usePayrollConfig'
import type { PayrollRule } from '../types'

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

export default function PayrollCalculationsPage() {
  const { rules, users, isLoading, isUsersLoading, loadData } = usePayrollData()
  const {
    workingHoursConfig,
    ratesConfig,
    leaveBenefitsConfig,
    contributionsConfig,
    taxBracketsConfig
  } = usePayrollConfig()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PayrollRule | null>(null)

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
    resetForm,
    handleBulkUserSelection
  } = usePayrollRules(loadData)

  const handleEditRuleClick = (rule: PayrollRule) => {
    handleEditRule(rule)
    setEditingRule(rule)
    setIsDialogOpen(true)
  }

  const handleAddRuleClick = () => {
    resetForm()
    setEditingRule(null)
    setIsDialogOpen(true)
  }

  const handleSubmitRule = async (): Promise<boolean> => {
    const success = editingRule ? await handleUpdateRule() : await handleAddRule()
    if (success) {
      setIsDialogOpen(false)
      setEditingRule(null)
    }
    return success
  }

  const handleSelectAllUsersWrapper = (checked: boolean) => {
    handleSelectAllUsers(checked, users)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
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
          <h1 className="text-3xl font-normal tracking-tight text-bisu-purple-deep">
            <b>Browse All </b>Payroll Calculations
          </h1>
          <p className="text-muted-foreground">
            Manage payroll calculation rules and formulas
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <ConfigurationStatusCard
          workingHoursConfig={workingHoursConfig}
          ratesConfig={ratesConfig}
          leaveBenefitsConfig={leaveBenefitsConfig}
          contributionsConfig={contributionsConfig}
          taxBracketsConfig={taxBracketsConfig}
        />
      </motion.div>

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
        onBulkUserSelection={handleBulkUserSelection}
        users={users}
        isUsersLoading={isUsersLoading}
        isEdit={!!editingRule}
        title={editingRule ? "Edit Payroll Calculation" : "Add New Payroll Calculation"}
      />
    </motion.div>
  )
}
