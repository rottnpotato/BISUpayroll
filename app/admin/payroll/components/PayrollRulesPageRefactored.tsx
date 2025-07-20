"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { PayrollRulesTable } from "./PayrollRulesTable"
import { PayrollRuleDialog } from "./PayrollRuleDialog"
import { PayrollScheduleCard } from "./PayrollScheduleCard"
import { WorkingHoursCard } from "./WorkingHoursCard"
import { RatesConfigCard } from "./RatesConfigCard"
import { usePayrollData } from "../hooks/usePayrollData"
import { usePayrollRules } from "../hooks/usePayrollRules"
import { usePayrollConfig } from "../hooks/usePayrollConfig"
import { PayrollFormData, ScheduleFormData, PayrollSchedule } from "../types"
import { toast } from "sonner"

export default function PayrollRulesPage() {
  const { 
    isLoading, 
    rules, 
    users, 
    schedules, 
    isUsersLoading, 
    fetchRules, 
    fetchSchedules 
  } = usePayrollData()

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
  } = usePayrollRules(fetchRules)

  const {
    workingHoursConfig,
    setWorkingHoursConfig,
    ratesConfig,
    setRatesConfig,
    leaveBenefitsConfig,
    setLeaveBenefitsConfig
  } = usePayrollConfig()

  // Dialog states
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false)
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false)

  // Schedule form state
  const [scheduleFormData, setScheduleFormData] = useState<ScheduleFormData>({
    name: "",
    days: [],
    isActive: false,
    processHour: 9,
    processMinute: 0,
    cutoffDays: [],
    paymentMethod: "bank_transfer"
  })

  // Set processing time from active schedule
  useEffect(() => {
    const activeSchedule = schedules.find(s => s.isActive)
    if (activeSchedule) {
      setScheduleFormData(prev => ({
        ...prev,
        processHour: activeSchedule.processHour,
        processMinute: activeSchedule.processMinute
      }))
    }
  }, [schedules])

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

  // Schedule handlers
  const handleScheduleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setScheduleFormData({
      ...scheduleFormData,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleToggleScheduleStatus = async (schedule: PayrollSchedule) => {
    try {
      const response = await fetch(`/api/admin/payroll/schedules/${schedule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...schedule,
          isActive: !schedule.isActive
        })
      })

      if (response.ok) {
        toast.success(`Schedule ${schedule.isActive ? "disabled" : "enabled"} successfully`)
        await fetchSchedules()
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update schedule status")
        return false
      }
    } catch (error) {
      console.error("Error updating schedule status:", error)
      toast.error("Failed to update schedule status")
      return false
    }
  }

  const handleSaveProcessingTime = async () => {
    try {
      const activeSchedule = schedules.find(s => s.isActive)
      
      if (!activeSchedule) {
        toast.error("No active schedule found")
        return
      }
      
      const response = await fetch(`/api/admin/payroll/schedules/${activeSchedule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...activeSchedule,
          processHour: parseInt(scheduleFormData.processHour.toString()),
          processMinute: parseInt(scheduleFormData.processMinute.toString())
        })
      })

      if (response.ok) {
        toast.success("Processing time updated successfully")
        await fetchSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update processing time")
      }
    } catch (error) {
      console.error("Error updating processing time:", error)
      toast.error("Failed to update processing time")
    }
  }

  // Form handlers for dialogs
  const handleOpenAddDialog = () => {
    resetForm()
    setIsAddRuleDialogOpen(true)
  }

  const handleOpenEditDialog = (rule: any) => {
    handleEditRule(rule)
    setIsEditRuleDialogOpen(true)
  }

  const handleCloseAddDialog = () => {
    setIsAddRuleDialogOpen(false)
    resetForm()
  }

  const handleCloseEditDialog = () => {
    setIsEditRuleDialogOpen(false)
    resetForm()
  }

  const handleFormSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="p-6 max-w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">
          Payroll Rules & Configuration
        </h1>
        <p className="text-gray-600">
          Configure comprehensive payroll calculation rules, schedules, and policies
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard lines={6} />
          <SkeletonCard lines={6} />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Main Payroll Rules Section */}
          <PayrollRulesTable
            rules={rules}
            onEdit={handleOpenEditDialog}
            onDelete={handleDeleteRule}
            onToggleStatus={handleToggleRuleStatus}
            onAdd={handleOpenAddDialog}
          />

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Payroll Schedule Configuration */}
            <PayrollScheduleCard
              schedules={schedules}
              onToggleStatus={handleToggleScheduleStatus}
              onSaveProcessingTime={handleSaveProcessingTime}
              scheduleFormData={scheduleFormData}
              onScheduleFormChange={handleScheduleFormChange}
            />
            
            {/* Working Hours & Attendance Configuration */}
            <WorkingHoursCard
              config={workingHoursConfig}
              onConfigChange={setWorkingHoursConfig}
            />
            
            {/* Rates & Differentials Configuration */}
            <RatesConfigCard
              config={ratesConfig}
              onConfigChange={setRatesConfig}
            />
          </div>
        </motion.div>
      )}

      {/* Add Rule Dialog */}
      <PayrollRuleDialog
        isOpen={isAddRuleDialogOpen}
        onClose={handleCloseAddDialog}
        onSubmit={handleAddRule}
        formData={formData}
        onFormChange={handleFormChange}
        onSelectChange={handleFormSelectChange}
        onUserSelection={handleUserSelection}
        onSelectAllUsers={(checked) => handleSelectAllUsers(checked, users)}
        users={users}
        isUsersLoading={isUsersLoading}
        title="Add New Payroll Rule"
      />

      {/* Edit Rule Dialog */}
      <PayrollRuleDialog
        isOpen={isEditRuleDialogOpen}
        onClose={handleCloseEditDialog}
        onSubmit={handleUpdateRule}
        formData={formData}
        onFormChange={handleFormChange}
        onSelectChange={handleFormSelectChange}
        onUserSelection={handleUserSelection}
        onSelectAllUsers={(checked) => handleSelectAllUsers(checked, users)}
        users={users}
        isUsersLoading={isUsersLoading}
        isEdit={true}
        title="Edit Payroll Rule"
      />
    </div>
  )
}
