import { useState } from 'react'
import { toast } from 'sonner'
import { PayrollRule, PayrollFormData } from '../types'

export const usePayrollRules = (refetch: () => Promise<void>) => {
  const [formData, setFormData] = useState<PayrollFormData>({
    name: "",
    type: "additional",
    amount: "",
    isPercentage: false,
    description: "",
    applyToAll: true,
    selectedUserIds: [],
    category: "",
    computationBasis: "",
    minAmount: "",
    maxAmount: ""
  })

  const [selectedRule, setSelectedRule] = useState<PayrollRule | null>(null)

  const resetForm = () => {
    setFormData({
      name: "",
      type: "additional",
      amount: "",
      isPercentage: false,
      description: "",
      applyToAll: true,
      selectedUserIds: [],
      category: "",
      computationBasis: "",
      minAmount: "",
      maxAmount: ""
    })
    setSelectedRule(null)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    setFormData(prev => {
      const newSelectedUserIds = checked 
        ? [...prev.selectedUserIds, userId]
        : prev.selectedUserIds.filter(id => id !== userId)
      
      return {
        ...prev,
        selectedUserIds: newSelectedUserIds
      }
    })
  }

  const handleSelectAllUsers = (checked: boolean, allUsers: any[]) => {
    setFormData(prev => ({
      ...prev,
      selectedUserIds: checked ? allUsers.map(user => user.id) : []
    }))
  }

  const handleAddRule = async () => {
    try {
      if (!formData.name || !formData.type || !formData.amount) {
        toast.error("Please fill out all required fields")
        return false
      }

      const response = await fetch("/api/admin/payroll/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          amount: formData.amount,
          isPercentage: formData.isPercentage,
          description: formData.description,
          applyToAll: formData.applyToAll,
          selectedUserIds: formData.applyToAll ? [] : formData.selectedUserIds
        })
      })

      if (response.ok) {
        toast.success("Payroll rule added successfully")
        resetForm()
        await refetch()
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add payroll rule")
        return false
      }
    } catch (error) {
      console.error("Error adding payroll rule:", error)
      toast.error("Failed to add payroll rule")
      return false
    }
  }

  const handleEditRule = (rule: PayrollRule) => {
    setSelectedRule(rule)
    setFormData({
      name: rule.name,
      type: rule.type,
      amount: rule.amount.toString(),
      isPercentage: rule.isPercentage,
      description: rule.description || "",
      applyToAll: rule.applyToAll,
      selectedUserIds: rule.assignedUsers?.map(assignment => assignment.userId) || [],
      category: rule.category || "",
      computationBasis: rule.computationBasis || "",
      minAmount: rule.minAmount?.toString() || "",
      maxAmount: rule.maxAmount?.toString() || ""
    })
  }

  const handleUpdateRule = async () => {
    try {
      if (!selectedRule || !formData.name || !formData.type || !formData.amount) {
        toast.error("Please fill out all required fields")
        return false
      }

      const response = await fetch(`/api/admin/payroll/rules/${selectedRule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          amount: formData.amount,
          isPercentage: formData.isPercentage,
          isActive: selectedRule.isActive,
          description: formData.description,
          applyToAll: formData.applyToAll,
          selectedUserIds: formData.applyToAll ? [] : formData.selectedUserIds
        })
      })

      if (response.ok) {
        toast.success("Payroll rule updated successfully")
        resetForm()
        await refetch()
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update payroll rule")
        return false
      }
    } catch (error) {
      console.error("Error updating payroll rule:", error)
      toast.error("Failed to update payroll rule")
      return false
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) {
      return false
    }

    try {
      const response = await fetch(`/api/admin/payroll/rules/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Payroll rule deleted successfully")
        await refetch()
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete payroll rule")
        return false
      }
    } catch (error) {
      console.error("Error deleting payroll rule:", error)
      toast.error("Failed to delete payroll rule")
      return false
    }
  }

  const handleToggleRuleStatus = async (rule: PayrollRule) => {
    try {
      const response = await fetch(`/api/admin/payroll/rules/${rule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...rule,
          isActive: !rule.isActive
        })
      })

      if (response.ok) {
        toast.success(`Rule ${rule.isActive ? "disabled" : "enabled"} successfully`)
        await refetch()
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update rule status")
        return false
      }
    } catch (error) {
      console.error("Error updating rule status:", error)
      toast.error("Failed to update rule status")
      return false
    }
  }

  return {
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
  }
}
