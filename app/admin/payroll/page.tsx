"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, Save, Plus, Edit, Trash2, FileText, 
  ToggleLeft, Percent, Clock, CalendarDays, Users, User as UserIcon
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { toast } from "sonner"

interface PayrollRule {
  id: string
  name: string
  type: string
  amount: number
  isPercentage: boolean
  isActive: boolean
  description: string | null
  applyToAll: boolean
  assignedUsers?: PayrollRuleAssignment[]
}

interface PayrollRuleAssignment {
  id: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  employeeId: string | null
  department: string | null
  role: string
  status: string
}

interface PayrollSchedule {
  id: string
  name: string
  days: number[]
  isActive: boolean
  processHour: number
  processMinute: number
}

// Mock payroll data
const payrollRules: PayrollRule[] = [
  { 
    id: "1", 
    name: "Basic Salary", 
    type: "base", 
    amount: 25000, 
    isPercentage: false,
    isActive: true,
    description: "Base monthly salary for regular employees",
    applyToAll: true
  },
  { 
    id: "2", 
    name: "Overtime Rate", 
    type: "additional",
    amount: 1.5, 
    isPercentage: true,
    isActive: true,
    description: "Overtime pay calculated at 1.5x regular rate",
    applyToAll: true
  },
  { 
    id: "3", 
    name: "Night Differential", 
    type: "additional",
    amount: 10, 
    isPercentage: true,
    isActive: true,
    description: "Additional pay for work between 10PM and 6AM",
    applyToAll: false
  },
  { 
    id: "4", 
    name: "SSS Contribution", 
    type: "deduction",
    amount: 3.63, 
    isPercentage: true,
    isActive: true,
    description: "Mandatory SSS contribution",
    applyToAll: true
  },
  { 
    id: "5", 
    name: "PhilHealth", 
    type: "deduction",
    amount: 2.75, 
    isPercentage: true,
    isActive: true,
    description: "Mandatory PhilHealth contribution",
    applyToAll: true
  },
  { 
    id: "6", 
    name: "Pag-IBIG", 
    type: "deduction",
    amount: 2, 
    isPercentage: true,
    isActive: true,
    description: "Mandatory Pag-IBIG contribution",
    applyToAll: true
  },
  { 
    id: "7", 
    name: "Withholding Tax", 
    type: "deduction",
    amount: 0, 
    isPercentage: true,
    isActive: true,
    description: "Income tax withheld based on tax table",
    applyToAll: true
  },
  { 
    id: "8", 
    name: "13th Month Pay", 
    type: "additional",
    amount: 8.33, 
    isPercentage: true,
    isActive: true,
    description: "Prorated 13th month pay allocation",
    applyToAll: true
  }
]

// Payroll schedule options
const payrollSchedules: PayrollSchedule[] = [
  { id: "1", name: "Monthly", days: [30], isActive: true, processHour: 9, processMinute: 0 },
  { id: "2", name: "Semi-Monthly", days: [15, 30], isActive: false, processHour: 9, processMinute: 0 },
  { id: "3", name: "Weekly", days: [7, 14, 21, 28], isActive: false, processHour: 9, processMinute: 0 }
]

export default function PayrollRulesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [rules, setRules] = useState<PayrollRule[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [schedules, setSchedules] = useState<PayrollSchedule[]>([])
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false)
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false)
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<PayrollRule | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "additional",
    amount: "",
    isPercentage: false,
    description: "",
    applyToAll: true,
    selectedUserIds: [] as string[]
  })

  // Schedule form state
  const [scheduleFormData, setScheduleFormData] = useState({
    name: "",
    days: [] as number[],
    isActive: false,
    processHour: 9,
    processMinute: 0
  })

  // Loading data
  const fetchRules = async () => {
    try {
      const response = await fetch("/api/admin/payroll/rules")
      const data = await response.json()
      if (data.rules) {
        setRules(data.rules)
      }
    } catch (error) {
      console.error("Error fetching rules:", error)
      toast.error("Failed to load payroll rules")
    }
  }

  const fetchUsers = async () => {
    try {
      setIsUsersLoading(true)
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      if (data.users) {
        setUsers(data.users.filter((user: User) => user.status === "ACTIVE"))
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsUsersLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/admin/payroll/schedules")
      const data = await response.json()
      if (data.schedules) {
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
      toast.error("Failed to load payroll schedules")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchRules(), fetchSchedules(), fetchUsers()])
      setIsLoading(false)
    }

    loadData()
  }, [])

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

  // Filter rules based on active tab
  const filteredRules = rules.filter(rule => {
    if (activeTab === "all") return true
    return rule.type === activeTab
  })

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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  // Format amount display
  const formatAmount = (amount: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${amount}%`
    } else {
      return `₱${amount.toLocaleString()}`
    }
  }

  // Rule form handlers
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

  const handleSelectAllUsers = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedUserIds: checked ? users.map(user => user.id) : []
    }))
  }

  const handleAddRule = async () => {
    try {
      if (!formData.name || !formData.type || !formData.amount) {
        toast.error("Please fill out all required fields")
        return
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
        setIsAddRuleDialogOpen(false)
        // Reset form
        setFormData({
          name: "",
          type: "additional",
          amount: "",
          isPercentage: false,
          description: "",
          applyToAll: true,
          selectedUserIds: []
        })
        // Refresh rules
        await fetchRules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add payroll rule")
      }
    } catch (error) {
      console.error("Error adding payroll rule:", error)
      toast.error("Failed to add payroll rule")
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
      selectedUserIds: rule.assignedUsers?.map(assignment => assignment.userId) || []
    })
    setIsEditRuleDialogOpen(true)
  }

  const handleUpdateRule = async () => {
    try {
      if (!selectedRule || !formData.name || !formData.type || !formData.amount) {
        toast.error("Please fill out all required fields")
        return
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
        setIsEditRuleDialogOpen(false)
        // Reset form
        setFormData({
          name: "",
          type: "additional",
          amount: "",
          isPercentage: false,
          description: "",
          applyToAll: true,
          selectedUserIds: []
        })
        setSelectedRule(null)
        // Refresh rules
        await fetchRules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update payroll rule")
      }
    } catch (error) {
      console.error("Error updating payroll rule:", error)
      toast.error("Failed to update payroll rule")
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/payroll/rules/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Payroll rule deleted successfully")
        // Refresh rules
        await fetchRules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete payroll rule")
      }
    } catch (error) {
      console.error("Error deleting payroll rule:", error)
      toast.error("Failed to delete payroll rule")
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
        // Refresh rules
        await fetchRules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update rule status")
      }
    } catch (error) {
      console.error("Error updating rule status:", error)
      toast.error("Failed to update rule status")
    }
  }

  // Schedule form handlers
  const handleScheduleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setScheduleFormData({
      ...scheduleFormData,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleDayToggle = (day: number) => {
    setScheduleFormData(prev => {
      const days = [...prev.days]
      const index = days.indexOf(day)
      
      if (index === -1) {
        days.push(day)
      } else {
        days.splice(index, 1)
      }
      
      return { ...prev, days }
    })
  }

  const handleAddSchedule = async () => {
    try {
      if (!scheduleFormData.name || scheduleFormData.days.length === 0) {
        toast.error("Please fill out all required fields")
        return
      }

      const response = await fetch("/api/admin/payroll/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(scheduleFormData)
      })

      if (response.ok) {
        toast.success("Payroll schedule added successfully")
        setIsAddScheduleDialogOpen(false)
        // Reset form
        setScheduleFormData({
          name: "",
          days: [],
          isActive: false,
          processHour: 9,
          processMinute: 0
        })
        // Refresh schedules
        await fetchSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add payroll schedule")
      }
    } catch (error) {
      console.error("Error adding payroll schedule:", error)
      toast.error("Failed to add payroll schedule")
    }
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
        // Refresh schedules
        await fetchSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update schedule status")
      }
    } catch (error) {
      console.error("Error updating schedule status:", error)
      toast.error("Failed to update schedule status")
    }
  }

  const handleSaveProcessingTime = async () => {
    try {
      // Find the active schedule
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
        // Refresh schedules
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

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Payroll Rules</h1>
        <p className="text-gray-600">Configure payroll calculation rules and schedules</p>
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
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Payroll Rules */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="shadow-md h-full">
              <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-bisu-yellow-DEFAULT">Payroll Rules</CardTitle>
                  <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-bisu-yellow-DEFAULT text-bisu-yellow-light hover:bg-bisu-yellow-light hover:text-bisu-black border-bisu-black">
                        <Plus size={16} className="mr-2" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Payroll Rule</DialogTitle>
                        <DialogDescription>
                          Create a new payroll rule for salary calculation.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="name" className="text-right">
                            Rule Name
                          </label>
                          <Input 
                            id="name" 
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            placeholder="e.g. Transportation Allowance" 
                            className="col-span-3" 
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="type" className="text-right">
                            Type
                          </label>
                          <div className="col-span-3">
                            <Tabs 
                              value={formData.type} 
                              onValueChange={(value) => setFormData({...formData, type: value})}
                              className="w-full"
                            >
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="base">Base</TabsTrigger>
                                <TabsTrigger value="additional">Addition</TabsTrigger>
                                <TabsTrigger value="deduction">Deduction</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="amount" className="text-right">
                            Amount
                          </label>
                          <Input 
                            id="amount" 
                            name="amount"
                            value={formData.amount}
                            onChange={handleFormChange}
                            placeholder={formData.isPercentage ? "e.g. 5.5" : "e.g. 1000"} 
                            className="col-span-3" 
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right">
                            Is Percentage
                          </label>
                          <div className="flex items-center space-x-2 col-span-3">
                            <Switch 
                              id="isPercentage" 
                              name="isPercentage"
                              checked={formData.isPercentage}
                              onCheckedChange={(checked) => setFormData({...formData, isPercentage: checked})}
                            />
                            <Label htmlFor="isPercentage">
                              {formData.isPercentage ? "Value is percentage" : "Value is fixed amount"}
                            </Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="description" className="text-right">
                            Description
                          </label>
                          <Input 
                            id="description" 
                            name="description"
                            value={formData.description}
                            onChange={handleFormChange}
                            placeholder="Brief description of this rule" 
                            className="col-span-3" 
                          />
                        </div>
                        
                        {/* User Assignment Section */}
                        <div className="grid grid-cols-4 items-start gap-4">
                          <label className="text-right pt-2">
                            Apply To
                          </label>
                          <div className="col-span-3 space-y-3">
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="applyToAll" 
                                checked={formData.applyToAll}
                                onCheckedChange={(checked) => setFormData({...formData, applyToAll: checked})}
                              />
                              <Label htmlFor="applyToAll">
                                Apply to all employees
                              </Label>
                            </div>
                            
                            {!formData.applyToAll && (
                              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Checkbox
                                    id="selectAll"
                                    checked={users.length > 0 && formData.selectedUserIds.length === users.length}
                                    onCheckedChange={handleSelectAllUsers}
                                  />
                                  <Label htmlFor="selectAll" className="font-medium">
                                    Select All ({users.length} employees)
                                  </Label>
                                </div>
                                
                                {isUsersLoading ? (
                                  <div className="text-sm text-gray-500">Loading employees...</div>
                                ) : (
                                  <div className="space-y-2">
                                    {users.map((user) => (
                                      <div key={user.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`user-${user.id}`}
                                          checked={formData.selectedUserIds.includes(user.id)}
                                          onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                                        />
                                        <Label htmlFor={`user-${user.id}`} className="text-sm flex-1">
                                          {user.firstName} {user.lastName}
                                          {user.employeeId && (
                                            <span className="text-gray-500 ml-1">({user.employeeId})</span>
                                          )}
                                          {user.department && (
                                            <span className="text-gray-400 ml-2 text-xs">{user.department}</span>
                                          )}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {!formData.applyToAll && formData.selectedUserIds.length > 0 && (
                                  <div className="mt-2 text-sm text-green-600">
                                    {formData.selectedUserIds.length} employee(s) selected
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddRule}>
                          Add Rule
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Edit Rule Dialog */}
                <Dialog open={isEditRuleDialogOpen} onOpenChange={setIsEditRuleDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Payroll Rule</DialogTitle>
                      <DialogDescription>
                        Update payroll rule settings.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-name" className="text-right">
                          Rule Name
                        </label>
                        <Input 
                          id="edit-name" 
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-type" className="text-right">
                          Type
                        </label>
                        <div className="col-span-3">
                          <Tabs 
                            value={formData.type} 
                            onValueChange={(value) => setFormData({...formData, type: value})}
                            className="w-full"
                          >
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="base">Base</TabsTrigger>
                              <TabsTrigger value="additional">Addition</TabsTrigger>
                              <TabsTrigger value="deduction">Deduction</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-amount" className="text-right">
                          Amount
                        </label>
                        <Input 
                          id="edit-amount" 
                          name="amount"
                          value={formData.amount}
                          onChange={handleFormChange}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right">
                          Is Percentage
                        </label>
                        <div className="flex items-center space-x-2 col-span-3">
                          <Switch 
                            id="edit-isPercentage" 
                            name="isPercentage"
                            checked={formData.isPercentage}
                            onCheckedChange={(checked) => setFormData({...formData, isPercentage: checked})}
                          />
                          <Label htmlFor="edit-isPercentage">
                            {formData.isPercentage ? "Value is percentage" : "Value is fixed amount"}
                          </Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="edit-description" className="text-right">
                          Description
                        </label>
                        <Input 
                          id="edit-description" 
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          className="col-span-3" 
                        />
                      </div>
                      
                      {/* User Assignment Section */}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <label className="text-right pt-2">
                          Apply To
                        </label>
                        <div className="col-span-3 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="edit-applyToAll" 
                              checked={formData.applyToAll}
                              onCheckedChange={(checked) => setFormData({...formData, applyToAll: checked})}
                            />
                            <Label htmlFor="edit-applyToAll">
                              Apply to all employees
                            </Label>
                          </div>
                          
                          {!formData.applyToAll && (
                            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                              <div className="flex items-center space-x-2 mb-3">
                                <Checkbox
                                  id="edit-selectAll"
                                  checked={users.length > 0 && formData.selectedUserIds.length === users.length}
                                  onCheckedChange={handleSelectAllUsers}
                                />
                                <Label htmlFor="edit-selectAll" className="font-medium">
                                  Select All ({users.length} employees)
                                </Label>
                              </div>
                              
                              {isUsersLoading ? (
                                <div className="text-sm text-gray-500">Loading employees...</div>
                              ) : (
                                <div className="space-y-2">
                                  {users.map((user) => (
                                    <div key={user.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`edit-user-${user.id}`}
                                        checked={formData.selectedUserIds.includes(user.id)}
                                        onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                                      />
                                      <Label htmlFor={`edit-user-${user.id}`} className="text-sm flex-1">
                                        {user.firstName} {user.lastName}
                                        {user.employeeId && (
                                          <span className="text-gray-500 ml-1">({user.employeeId})</span>
                                        )}
                                        {user.department && (
                                          <span className="text-gray-400 ml-2 text-xs">{user.department}</span>
                                        )}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {!formData.applyToAll && formData.selectedUserIds.length > 0 && (
                                <div className="mt-2 text-sm text-green-600">
                                  {formData.selectedUserIds.length} employee(s) selected
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditRuleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateRule}>
                        Update Rule
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Tabs defaultValue="all" className="mt-4" onValueChange={setActiveTab}>
                  <TabsList className="bg-bisu-purple-light border-bisu-yellow-DEFAULT/30 text-bisu-yellow-light hover:text-bisu-yellow-DEFAULT">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep"
                    >
                      All Rules
                    </TabsTrigger>
                    <TabsTrigger 
                      value="base" 
                      className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep"
                    >
                      Base Pay
                    </TabsTrigger>
                    <TabsTrigger 
                      value="additional" 
                      className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep"
                    >
                      Additions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="deduction" 
                      className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep"
                    >
                      Deductions
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                          No rules found in this category
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRules.map((rule) => (
                        <TableRow key={rule.id} className="transition-colors hover:bg-gray-50">
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>
                            {rule.type === "base" && <Badge className="bg-blue-500">Base Pay</Badge>}
                            {rule.type === "additional" && <Badge className="bg-green-500">Addition</Badge>}
                            {rule.type === "deduction" && <Badge className="bg-red-500">Deduction</Badge>}
                          </TableCell>
                          <TableCell className="flex items-center gap-1">
                            {formatAmount(rule.amount, rule.isPercentage)}
                            {rule.isPercentage && <Percent size={14} />}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {rule.applyToAll ? (
                                <>
                                  <Users size={14} className="text-blue-500" />
                                  <span className="text-sm text-blue-600">All Employees</span>
                                </>
                              ) : (
                                <>
                                  <UserIcon size={14} className="text-green-500" />
                                  <span className="text-sm text-green-600">
                                    {rule.assignedUsers?.length || 0} Selected
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 max-w-[200px] truncate">
                            {rule.description}
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={rule.isActive} 
                              onCheckedChange={() => handleToggleRuleStatus(rule)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-blue-500"
                                onClick={() => handleEditRule(rule)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payroll Settings */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="space-y-6">
              {/* Payroll Schedule */}
              <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-bisu-yellow-DEFAULT to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Payroll Schedule</CardTitle>
                      <CardDescription>Configure when payroll is processed</CardDescription>
                    </div>
                    <Dialog open={isAddScheduleDialogOpen} onOpenChange={setIsAddScheduleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-bisu-purple-deep text-bisu-yellow-light hover:bg-bisu-yellow-light hover:text-bisu-black border-bisu-black">
                          <Plus size={16} className="mr-1" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Payroll Schedule</DialogTitle>
                          <DialogDescription>
                            Create a new payroll processing schedule.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="scheduleName" className="text-right">
                              Schedule Name
                            </label>
                            <Input 
                              id="scheduleName" 
                              name="name"
                              value={scheduleFormData.name}
                              onChange={handleScheduleFormChange}
                              placeholder="e.g. Monthly" 
                              className="col-span-3" 
                            />
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <label className="text-right pt-2">
                              Pay Days
                            </label>
                            <div className="col-span-3 space-y-2">
                              <p className="text-sm text-gray-500">Select days of the month for payroll processing</p>
                              <div className="flex flex-wrap gap-2">
                                {[1, 5, 10, 15, 20, 25, 30].map((day) => (
                                  <Button
                                    key={day}
                                    type="button"
                                    variant={scheduleFormData.days.includes(day) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleDayToggle(day)}
                                    className={scheduleFormData.days.includes(day) 
                                      ? "bg-bisu-purple-deep text-white" 
                                      : "border-bisu-purple-light text-bisu-purple-deep"
                                    }
                                  >
                                    {day}
                                  </Button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">If the day falls on a weekend or holiday, payroll will process on the previous business day</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right">
                              Make Active
                            </label>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="scheduleActive" 
                                name="isActive"
                                checked={scheduleFormData.isActive}
                                onCheckedChange={(checked) => setScheduleFormData({...scheduleFormData, isActive: checked})}
                              />
                              <Label htmlFor="scheduleActive">
                                Activate this schedule
                              </Label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddScheduleDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddSchedule}>
                            Add Schedule
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {schedules.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No schedules configured. Create a new schedule to begin.
                      </div>
                    ) : (
                      schedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <CalendarDays className="h-5 w-5 text-bisu-purple-deep" />
                            <div>
                              <p className="font-medium text-bisu-purple-deep">{schedule.name}</p>
                              <p className="text-xs text-gray-500">
                                Pay days: {schedule.days.map((day) => `${day}`).join(', ')}
                              </p>
                            </div>
                          </div>
                          <Switch 
                            checked={schedule.isActive} 
                            onCheckedChange={() => handleToggleScheduleStatus(schedule)}
                          />
                        </div>
                      ))
                    )}
                    
                    {schedules.some(s => s.isActive) && (
                      <div className="flex flex-col gap-4 mt-6">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-bisu-purple-deep" />
                          <h3 className="font-medium text-bisu-purple-deep">Processing Time</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="processHour" className="text-xs">Hour (24h)</Label>
                            <Input 
                              id="processHour" 
                              name="processHour"
                              type="number"
                              min="0"
                              max="23" 
                              value={scheduleFormData.processHour}
                              onChange={handleScheduleFormChange}
                              className="mt-1" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="processMinute" className="text-xs">Minute</Label>
                            <Input 
                              id="processMinute" 
                              name="processMinute"
                              type="number"
                              min="0"
                              max="59" 
                              value={scheduleFormData.processMinute}
                              onChange={handleScheduleFormChange}
                              className="mt-1" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={handleSaveProcessingTime}
                      disabled={!schedules.some(s => s.isActive)}
                    >
                      <Save size={16} className="mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Tax Settings */}
              <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-light to-bisu-purple-medium text-white rounded-t-lg">
                  <CardTitle className="text-bisu-yellow-DEFAULT">Tax Configuration</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-bisu-purple-deep" />
                        <Label htmlFor="withholding">Use Tax Withholding</Label>
                      </div>
                      <Switch id="withholding" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ToggleLeft className="h-5 w-5 text-bisu-purple-deep" />
                        <Label htmlFor="showTaxBreakdown">Show Tax Breakdown</Label>
                      </div>
                      <Switch id="showTaxBreakdown" defaultChecked />
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <Button variant="outline" className="w-full">
                        <DollarSign size={16} className="mr-2" />
                        Configure Tax Brackets
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 