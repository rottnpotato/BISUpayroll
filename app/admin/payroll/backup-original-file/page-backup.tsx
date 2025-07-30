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
  ToggleLeft, Percent, Clock, CalendarDays, Users, User as UserIcon,
  Calculator, AlertTriangle, Calendar, Timer, Moon, Sun, TrendingUp
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

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
  category?: string
  computationBasis?: string
  minAmount?: number
  maxAmount?: number
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
  cutoffDays?: number[]
  paymentMethod?: string
}

interface HolidayType {
  id: string
  name: string
  date: string
  type: 'regular' | 'special'
  payMultiplier: number
  isActive: boolean
  isRecurring: boolean
  description?: string
}

interface LateDeductionRule {
  id: string
  name: string
  basis: 'per_minute' | 'per_hour' | 'fixed_amount'
  amount: number
  graceMinutes: number
  isActive: boolean
  description?: string
}

// Enhanced payroll data with comprehensive rules
const payrollRules: PayrollRule[] = [
  { 
    id: "1", 
    name: "Basic Salary", 
    type: "base", 
    amount: 25000, 
    isPercentage: false,
    isActive: true,
    description: "Base monthly salary for regular government employees",
    applyToAll: true,
    category: "base_pay"
  },
  { 
    id: "2", 
    name: "Overtime Rate", 
    type: "additional",
    amount: 1.25, 
    isPercentage: true,
    isActive: true,
    description: "Government overtime pay - 125% of regular rate for first 2 hours",
    applyToAll: true,
    category: "overtime"
  },
  { 
    id: "3", 
    name: "Overtime Rate (Beyond 2 Hours)", 
    type: "additional",
    amount: 1.5, 
    isPercentage: true,
    isActive: true,
    description: "Government overtime pay - 150% of regular rate beyond 2 hours",
    applyToAll: true,
    category: "overtime"
  },
  { 
    id: "4", 
    name: "Night Differential", 
    type: "additional",
    amount: 10, 
    isPercentage: true,
    isActive: true,
    description: "Additional 10% for work between 10PM and 6AM (Government rate)",
    applyToAll: true,
    category: "differential"
  },
  { 
    id: "5", 
    name: "Holiday Differential (Regular)", 
    type: "additional",
    amount: 100, 
    isPercentage: true,
    isActive: true,
    description: "100% additional pay for work on regular holidays",
    applyToAll: true,
    category: "holiday_pay"
  },
  { 
    id: "6", 
    name: "Holiday Differential (Special)", 
    type: "additional",
    amount: 30, 
    isPercentage: true,
    isActive: true,
    description: "30% additional pay for work on special non-working holidays",
    applyToAll: true,
    category: "holiday_pay"
  },
  { 
    id: "7", 
    name: "GSIS Contribution", 
    type: "deduction",
    amount: 9, 
    isPercentage: true,
    isActive: true,
    description: "Government Service Insurance System - 9% employee share",
    applyToAll: true,
    category: "mandatory_contribution",
    computationBasis: "basic_salary"
  },
  { 
    id: "8", 
    name: "PhilHealth", 
    type: "deduction",
    amount: 2.75, 
    isPercentage: true,
    isActive: true,
    description: "PhilHealth premium - 2.75% employee share (5.5% total)",
    applyToAll: true,
    category: "mandatory_contribution",
    minAmount: 200,
    maxAmount: 1750
  },
  { 
    id: "9", 
    name: "Pag-IBIG", 
    type: "deduction",
    amount: 2, 
    isPercentage: true,
    isActive: true,
    description: "Pag-IBIG Fund contribution - 2% employee share",
    applyToAll: true,
    category: "mandatory_contribution",
    minAmount: 24,
    maxAmount: 200
  },
  { 
    id: "10", 
    name: "Withholding Tax", 
    type: "deduction",
    amount: 0, 
    isPercentage: true,
    isActive: true,
    description: "Income tax withheld based on BIR tax table (TRAIN Law)",
    applyToAll: true,
    category: "tax",
    computationBasis: "taxable_income"
  },
  { 
    id: "11", 
    name: "13th Month Pay", 
    type: "additional",
    amount: 8.33, 
    isPercentage: true,
    isActive: true,
    description: "Prorated 13th month pay allocation (1/12 of annual salary)",
    applyToAll: true,
    category: "mandatory_benefit"
  },
  { 
    id: "12", 
    name: "Service Incentive Leave", 
    type: "additional",
    amount: 5, 
    isPercentage: false,
    isActive: true,
    description: "5 days paid service incentive leave credit per year",
    applyToAll: true,
    category: "leave_benefit"
  },
  { 
    id: "13", 
    name: "Late Deduction (Per Minute)", 
    type: "deduction",
    amount: 0, 
    isPercentage: false,
    isActive: true,
    description: "Deduction for tardiness - computed per minute basis",
    applyToAll: true,
    category: "attendance",
    computationBasis: "per_minute"
  },
  { 
    id: "14", 
    name: "Sick Leave", 
    type: "additional",
    amount: 7, 
    isPercentage: false,
    isActive: true,
    description: "7 days paid sick leave credit per year",
    applyToAll: true,
    category: "leave_benefit"
  },
  { 
    id: "15", 
    name: "Vacation Leave", 
    type: "additional",
    amount: 15, 
    isPercentage: false,
    isActive: true,
    description: "15 days paid vacation leave credit per year",
    applyToAll: true,
    category: "leave_benefit"
  }
]

// Enhanced payroll schedule options
const payrollSchedules: PayrollSchedule[] = [
  { 
    id: "1", 
    name: "Monthly (End of Month)", 
    days: [30], 
    isActive: true, 
    processHour: 9, 
    processMinute: 0,
    cutoffDays: [15],
    paymentMethod: "bank_transfer"
  },
  { 
    id: "2", 
    name: "Semi-Monthly (15th & 30th)", 
    days: [15, 30], 
    isActive: false, 
    processHour: 9, 
    processMinute: 0,
    cutoffDays: [7, 22],
    paymentMethod: "bank_transfer"
  },
  { 
    id: "3", 
    name: "Bi-Weekly", 
    days: [14, 28], 
    isActive: false, 
    processHour: 9, 
    processMinute: 0,
    cutoffDays: [7, 21],
    paymentMethod: "bank_transfer"
  }
]

// Philippines government holidays for 2024-2025
const philippineHolidays: HolidayType[] = [
  { id: "1", name: "New Year's Day", date: "2025-01-01", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "2", name: "Maundy Thursday", date: "2025-04-17", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: false },
  { id: "3", name: "Good Friday", date: "2025-04-18", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: false },
  { id: "4", name: "Araw ng Kagitingan", date: "2025-04-09", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "5", name: "Labor Day", date: "2025-05-01", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "6", name: "Independence Day", date: "2025-06-12", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "7", name: "National Heroes Day", date: "2025-08-25", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "8", name: "Bonifacio Day", date: "2025-11-30", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "9", name: "Christmas Day", date: "2025-12-25", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "10", name: "Rizal Day", date: "2025-12-30", type: "regular", payMultiplier: 2.0, isActive: true, isRecurring: true },
  { id: "11", name: "Black Saturday", date: "2025-04-19", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: false },
  { id: "12", name: "EDSA People Power Revolution", date: "2025-02-25", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "13", name: "Ninoy Aquino Day", date: "2025-08-21", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "14", name: "All Saints' Day", date: "2025-11-01", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "15", name: "Christmas Eve", date: "2025-12-24", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true },
  { id: "16", name: "New Year's Eve", date: "2025-12-31", type: "special", payMultiplier: 1.3, isActive: true, isRecurring: true }
]

// Tax brackets based on TRAIN Law (2024 rates)
const taxBrackets = [
  { min: 0, max: 20833, rate: 0, description: "₱0 - ₱250,000 annually" },
  { min: 20834, max: 33333, rate: 20, description: "₱250,001 - ₱400,000 annually" },
  { min: 33334, max: 66667, rate: 25, description: "₱400,001 - ₱800,000 annually" },
  { min: 66668, max: 166667, rate: 30, description: "₱800,001 - ₱2,000,000 annually" },
  { min: 166668, max: 666667, rate: 32, description: "₱2,000,001 - ₱8,000,000 annually" },
  { min: 666668, max: Infinity, rate: 35, description: "Above ₱8,000,000 annually" }
]

export default function PayrollRulesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [rules, setRules] = useState<PayrollRule[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [schedules, setSchedules] = useState<PayrollSchedule[]>([])
  const [holidays, setHolidays] = useState<HolidayType[]>(philippineHolidays)
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false)
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false)
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false)
  const [isAddHolidayDialogOpen, setIsAddHolidayDialogOpen] = useState(false)
  const [isTaxBracketDialogOpen, setIsTaxBracketDialogOpen] = useState(false)
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
    selectedUserIds: [] as string[],
    category: "",
    computationBasis: "",
    minAmount: "",
    maxAmount: ""
  })

  // Schedule form state
  const [scheduleFormData, setScheduleFormData] = useState({
    name: "",
    days: [] as number[],
    isActive: false,
    processHour: 9,
    processMinute: 0,
    cutoffDays: [] as number[],
    paymentMethod: "bank_transfer"
  })

  // Holiday form state
  const [holidayFormData, setHolidayFormData] = useState({
    name: "",
    date: "",
    type: "regular" as "regular" | "special",
    payMultiplier: 2.0,
    isRecurring: false,
    description: ""
  })

  // Working hours configuration
  const [workingHoursConfig, setWorkingHoursConfig] = useState({
    dailyHours: 8,
    weeklyHours: 40,
    overtimeThreshold: 8,
    nightShiftStart: 22,
    nightShiftEnd: 6,
    lateGraceMinutes: 15,
    lateDeductionBasis: "per_minute" as "per_minute" | "per_hour" | "fixed_amount",
    lateDeductionAmount: 0
  })

  // Rates and differentials configuration
  const [ratesConfig, setRatesConfig] = useState({
    overtimeRate1: 1.25, // First 2 hours
    overtimeRate2: 1.5,  // Beyond 2 hours
    nightDifferential: 10, // Percentage
    regularHolidayRate: 200, // Percentage
    specialHolidayRate: 130  // Percentage
  })

  // Leave benefits configuration
  const [leaveBenefitsConfig, setLeaveBenefitsConfig] = useState({
    vacationLeave: 15,
    sickLeave: 7,
    serviceIncentiveLeave: 5
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
          selectedUserIds: [],
          category: "",
          computationBasis: "",
          minAmount: "",
          maxAmount: ""
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
      selectedUserIds: rule.assignedUsers?.map(assignment => assignment.userId) || [],
      category: rule.category || "",
      computationBasis: rule.computationBasis || "",
      minAmount: rule.minAmount?.toString() || "",
      maxAmount: rule.maxAmount?.toString() || ""
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
          selectedUserIds: [],
          category: "",
          computationBasis: "",
          minAmount: "",
          maxAmount: ""
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
          processMinute: 0,
          cutoffDays: [],
          paymentMethod: "bank_transfer"
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
    <div className="p-6 max-w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Payroll Rules & Configuration</h1>
        <p className="text-gray-600">Configure comprehensive payroll calculation rules, schedules, and policies</p>
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
          <motion.div variants={itemVariants} className="w-full">
            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <CardTitle className="text-bisu-yellow text-xl">Payroll Rules</CardTitle>
                    <CardDescription className="text-bisu-yellow-light">Manage salary computation rules and deductions</CardDescription>
                  </div>
                  <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-bisu-yellow text-bisu-purple-deep hover:bg-bisu-yellow-light hover:text-bisu-purple-medium border-2 border-bisu-yellow-light shadow-md">
                        <Plus size={16} className="mr-2" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-bisu-purple-deep">Add New Payroll Rule</DialogTitle>
                        <DialogDescription>
                          Create a comprehensive payroll rule with detailed configuration options.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="name" className="text-right font-medium">
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
                          <label className="text-right font-medium">Category</label>
                          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="base_pay">Base Pay</SelectItem>
                              <SelectItem value="overtime">Overtime</SelectItem>
                              <SelectItem value="differential">Differential</SelectItem>
                              <SelectItem value="holiday_pay">Holiday Pay</SelectItem>
                              <SelectItem value="leave_benefit">Leave Benefit</SelectItem>
                              <SelectItem value="mandatory_contribution">Mandatory Contribution</SelectItem>
                              <SelectItem value="mandatory_benefit">Mandatory Benefit</SelectItem>
                              <SelectItem value="tax">Tax</SelectItem>
                              <SelectItem value="attendance">Attendance</SelectItem>
                              <SelectItem value="allowance">Allowance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="type" className="text-right font-medium">
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
                          <label htmlFor="amount" className="text-right font-medium">
                            Amount
                          </label>
                          <Input 
                            id="amount" 
                            name="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleFormChange}
                            placeholder={formData.isPercentage ? "e.g. 5.5" : "e.g. 1000"} 
                            className="col-span-3" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right font-medium">
                            Value Type
                          </label>
                          <div className="flex items-center space-x-2 col-span-3">
                            <Switch 
                              id="isPercentage" 
                              name="isPercentage"
                              checked={formData.isPercentage}
                              onCheckedChange={(checked) => setFormData({...formData, isPercentage: checked})}
                            />
                            <Label htmlFor="isPercentage">
                              {formData.isPercentage ? "Percentage (%)" : "Fixed Amount (₱)"}
                            </Label>
                          </div>
                        </div>
                        
                        {formData.isPercentage && (
                          <>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="minAmount" className="text-right font-medium">
                                Min Amount
                              </label>
                              <Input 
                                id="minAmount" 
                                name="minAmount"
                                type="number"
                                step="0.01"
                                value={formData.minAmount}
                                onChange={handleFormChange}
                                placeholder="Minimum amount (optional)" 
                                className="col-span-3" 
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="maxAmount" className="text-right font-medium">
                                Max Amount
                              </label>
                              <Input 
                                id="maxAmount" 
                                name="maxAmount"
                                type="number"
                                step="0.01"
                                value={formData.maxAmount}
                                onChange={handleFormChange}
                                placeholder="Maximum amount (optional)" 
                                className="col-span-3" 
                              />
                            </div>
                          </>
                        )}
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right font-medium">Computation Basis</label>
                          <Select value={formData.computationBasis} onValueChange={(value) => setFormData({...formData, computationBasis: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select computation basis" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic_salary">Basic Salary</SelectItem>
                              <SelectItem value="gross_salary">Gross Salary</SelectItem>
                              <SelectItem value="taxable_income">Taxable Income</SelectItem>
                              <SelectItem value="per_minute">Per Minute</SelectItem>
                              <SelectItem value="per_hour">Per Hour</SelectItem>
                              <SelectItem value="per_day">Per Day</SelectItem>
                              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-4 items-start gap-4">
                          <label htmlFor="description" className="text-right font-medium pt-2">
                            Description
                          </label>
                          <Textarea 
                            id="description" 
                            name="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Detailed description of this rule, its purpose, and computation method" 
                            className="col-span-3 min-h-[80px]" 
                          />
                        </div>
                        
                        {/* User Assignment Section */}
                        <div className="grid grid-cols-4 items-start gap-4">
                          <label className="text-right pt-2 font-medium">
                            Apply To
                          </label>
                          <div className="col-span-3 space-y-3">
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="applyToAll" 
                                checked={formData.applyToAll}
                                onCheckedChange={(checked) => setFormData({...formData, applyToAll: checked})}
                              />
                              <Label htmlFor="applyToAll" className="font-medium">
                                Apply to all employees
                              </Label>
                            </div>
                            
                            {!formData.applyToAll && (
                              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
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
                        <Button onClick={handleAddRule} className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium">
                          <Save size={16} className="mr-2" />
                          Add Rule
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Enhanced Tab Navigation */}
                <Tabs defaultValue="all" className="mt-6" onValueChange={setActiveTab}>
                  <TabsList className="bg-bisu-purple-light border-bisu-yellow/30 text-bisu-yellow-light grid grid-cols-2 lg:grid-cols-5 w-full lg:w-auto">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
                    >
                      All Rules
                    </TabsTrigger>
                    <TabsTrigger 
                      value="base" 
                      className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
                    >
                      Base Pay
                    </TabsTrigger>
                    <TabsTrigger 
                      value="additional" 
                      className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
                    >
                      Additions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="deduction" 
                      className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
                    >
                      Deductions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="tax" 
                      className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
                    >
                      Tax & Benefits
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Applies To</TableHead>
                        <TableHead className="max-w-[250px]">Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                            No rules found in this category
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRules.map((rule) => (
                          <TableRow key={rule.id} className="transition-colors hover:bg-gray-50">
                            <TableCell className="font-medium">{rule.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {rule.category?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {rule.type === "base" && <Badge className="bg-blue-500">Base Pay</Badge>}
                              {rule.type === "additional" && <Badge className="bg-green-500">Addition</Badge>}
                              {rule.type === "deduction" && <Badge className="bg-red-500">Deduction</Badge>}
                            </TableCell>
                            <TableCell className="flex items-center gap-1">
                              {formatAmount(rule.amount, rule.isPercentage)}
                              {rule.isPercentage && <Percent size={14} />}
                              {rule.minAmount && rule.maxAmount && (
                                <span className="text-xs text-gray-500 ml-2">
                                  (₱{rule.minAmount} - ₱{rule.maxAmount})
                                </span>
                              )}
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
                            <TableCell className="text-gray-600 max-w-[250px] truncate">
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
                                  className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                  onClick={() => handleEditRule(rule)}
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-red-500 hover:bg-red-50"
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
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Payroll Schedule Configuration */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-2 h-full">
                <CardHeader className="bg-gradient-to-r from-bisu-yellow to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays size={20} />
                        Payroll Schedule
                      </CardTitle>
                      <CardDescription className="text-bisu-purple-medium">Configure processing schedules and cutoff dates</CardDescription>
                    </div>
                    <Dialog open={isAddScheduleDialogOpen} onOpenChange={setIsAddScheduleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-bisu-purple-deep text-bisu-yellow-light hover:bg-bisu-purple-medium border border-bisu-purple-deep">
                          <Plus size={16} className="mr-1" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Payroll Schedule</DialogTitle>
                          <DialogDescription>
                            Create a new payroll processing schedule with cutoff periods.
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
                              placeholder="e.g. Monthly End" 
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
                              <p className="text-xs text-gray-400 mt-1">Auto-adjusts for weekends and holidays</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <label className="text-right pt-2">
                              Cutoff Days
                            </label>
                            <div className="col-span-3 space-y-2">
                              <p className="text-sm text-gray-500">Attendance cutoff days</p>
                              <div className="flex flex-wrap gap-2">
                                {[7, 15, 22, 30].map((day) => (
                                  <Button
                                    key={`cutoff-${day}`}
                                    type="button"
                                    variant={scheduleFormData.cutoffDays.includes(day) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      const cutoffDays = [...scheduleFormData.cutoffDays]
                                      const index = cutoffDays.indexOf(day)
                                      if (index === -1) {
                                        cutoffDays.push(day)
                                      } else {
                                        cutoffDays.splice(index, 1)
                                      }
                                      setScheduleFormData({...scheduleFormData, cutoffDays})
                                    }}
                                    className={scheduleFormData.cutoffDays.includes(day) 
                                      ? "bg-bisu-yellow text-bisu-purple-deep" 
                                      : "border-bisu-yellow text-bisu-yellow-dark"
                                    }
                                  >
                                    {day}
                                  </Button>
                                ))}
                              </div>
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
                        <div key={schedule.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <CalendarDays className="h-5 w-5 text-bisu-purple-deep" />
                            <div>
                              <p className="font-medium text-bisu-purple-deep">{schedule.name}</p>
                              <p className="text-xs text-gray-500">
                                Pay: {schedule.days.join(', ')} | Cutoff: {schedule.cutoffDays?.join(', ') || 'Not set'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {schedule.paymentMethod?.replace('_', ' ').toUpperCase() || 'BANK TRANSFER'}
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
                      <div className="border-t pt-4 mt-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <Clock className="h-5 w-5 text-bisu-purple-deep" />
                          <h3 className="font-medium text-bisu-purple-deep">Processing Time</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="processHour" className="text-xs font-medium">Hour (24h)</Label>
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
                            <Label htmlFor="processMinute" className="text-xs font-medium">Minute</Label>
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
                        <Button 
                          className="w-full mt-4 bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium"
                          onClick={handleSaveProcessingTime}
                          disabled={!schedules.some(s => s.isActive)}
                        >
                          <Save size={16} className="mr-2" />
                          Save Processing Time
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Working Hours & Attendance Configuration */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-2 h-full">
                <CardHeader className="bg-gradient-to-r from-bisu-purple-light to-bisu-purple-medium text-white rounded-t-lg">
                  <CardTitle className="text-bisu-yellow flex items-center gap-2">
                    <Timer size={20} />
                    Working Hours & Attendance
                  </CardTitle>
                  <CardDescription className="text-bisu-yellow-light">Configure work schedules and attendance policies</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Daily Hours</Label>
                      <Input 
                        type="number"
                        value={workingHoursConfig.dailyHours.toString()}
                        onChange={(e) => setWorkingHoursConfig({...workingHoursConfig, dailyHours: Math.max(1, parseInt(e.target.value) || 8)})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Weekly Hours</Label>
                      <Input 
                        type="number"
                        value={workingHoursConfig.weeklyHours.toString()}
                        onChange={(e) => setWorkingHoursConfig({...workingHoursConfig, weeklyHours: Math.max(1, parseInt(e.target.value) || 40)})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
                      <Moon size={16} />
                      Night Shift Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Start Time (24h)</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="23"
                          value={workingHoursConfig.nightShiftStart.toString()}
                          onChange={(e) => setWorkingHoursConfig({...workingHoursConfig, nightShiftStart: Math.min(23, Math.max(0, parseInt(e.target.value) || 22))})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">End Time (24h)</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="23"
                          value={workingHoursConfig.nightShiftEnd.toString()}
                          onChange={(e) => setWorkingHoursConfig({...workingHoursConfig, nightShiftEnd: Math.min(23, Math.max(0, parseInt(e.target.value) || 6))})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Late Policy Configuration
                    </h4>
                    <div>
                      <Label className="text-sm">Grace Period (Minutes)</Label>
                      <Input 
                        type="number"
                        value={workingHoursConfig.lateGraceMinutes.toString()}
                        onChange={(e) => setWorkingHoursConfig({...workingHoursConfig, lateGraceMinutes: Math.max(0, parseInt(e.target.value) || 15)})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Deduction Basis</Label>
                      <Select value={workingHoursConfig.lateDeductionBasis} onValueChange={(value: any) => setWorkingHoursConfig({...workingHoursConfig, lateDeductionBasis: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_minute">Per Minute</SelectItem>
                          <SelectItem value="per_hour">Per Hour</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Deduction Amount (₱)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={workingHoursConfig.lateDeductionAmount.toString()}
                        onChange={(e) => setWorkingHoursConfig({...workingHoursConfig, lateDeductionAmount: Math.max(0, parseFloat(e.target.value) || 0)})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button className="w-full bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium">
                    <Save size={16} className="mr-2" />
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Rates & Differentials Configuration */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-2 h-full">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} />
                    Rates & Differentials Configuration
                  </CardTitle>
                  <CardDescription className="text-orange-100">Configure overtime rates, night differentials, and holiday pay rates</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-orange-700 flex items-center gap-2">
                      <Clock size={16} />
                      Overtime Rates
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">First 2 Hours Rate (×)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          min="1"
                          max="3"
                          value={ratesConfig.overtimeRate1.toString()}
                          onChange={(e) => setRatesConfig({...ratesConfig, overtimeRate1: Math.max(1, parseFloat(e.target.value) || 1.25)})}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-600 mt-1">Default: 1.25 (125%)</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Beyond 2 Hours Rate (×)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          min="1"
                          max="3"
                          value={ratesConfig.overtimeRate2.toString()}
                          onChange={(e) => setRatesConfig({...ratesConfig, overtimeRate2: Math.max(1, parseFloat(e.target.value) || 1.5)})}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-600 mt-1">Default: 1.5 (150%)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-orange-700 flex items-center gap-2">
                      <Moon size={16} />
                      Night Differential
                    </h4>
                    <div>
                      <Label className="text-sm font-medium">Night Differential (%)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="50"
                        value={ratesConfig.nightDifferential.toString()}
                        onChange={(e) => setRatesConfig({...ratesConfig, nightDifferential: Math.max(0, parseFloat(e.target.value) || 10)})}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">Default: 10% additional pay for night shifts (10PM-6AM)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-orange-700 flex items-center gap-2">
                      <Calendar size={16} />
                      Holiday Pay Rates
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Regular Holiday Rate (%)</Label>
                        <Input 
                          type="number"
                          min="100"
                          max="300"
                          value={ratesConfig.regularHolidayRate.toString()}
                          onChange={(e) => setRatesConfig({...ratesConfig, regularHolidayRate: Math.max(100, parseFloat(e.target.value) || 200)})}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-600 mt-1">Default: 200% (double pay)</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Special Holiday Rate (%)</Label>
                        <Input 
                          type="number"
                          min="100"
                          max="200"
                          value={ratesConfig.specialHolidayRate.toString()}
                          onChange={(e) => setRatesConfig({...ratesConfig, specialHolidayRate: Math.max(100, parseFloat(e.target.value) || 130)})}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-600 mt-1">Default: 130% (30% additional)</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-orange-600 text-white hover:bg-orange-700">
                    <Save size={16} className="mr-2" />
                    Save Rates Configuration
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Leave Benefits Configuration */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-2 h-full">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    Leave Benefits Configuration
                  </CardTitle>
                  <CardDescription className="text-teal-100">Configure annual leave entitlements for government employees</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Vacation Leave (days/year)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="30"
                        value={leaveBenefitsConfig.vacationLeave.toString()}
                        onChange={(e) => setLeaveBenefitsConfig({...leaveBenefitsConfig, vacationLeave: Math.max(0, parseInt(e.target.value) || 15)})}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">Government standard: 15 days</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sick Leave (days/year)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="15"
                        value={leaveBenefitsConfig.sickLeave.toString()}
                        onChange={(e) => setLeaveBenefitsConfig({...leaveBenefitsConfig, sickLeave: Math.max(0, parseInt(e.target.value) || 7)})}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">Government standard: 7 days</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Service Incentive Leave (days/year)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="10"
                        value={leaveBenefitsConfig.serviceIncentiveLeave.toString()}
                        onChange={(e) => setLeaveBenefitsConfig({...leaveBenefitsConfig, serviceIncentiveLeave: Math.max(0, parseInt(e.target.value) || 5)})}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">Government standard: 5 days</p>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-teal-600 text-white hover:bg-teal-700">
                    <Save size={16} className="mr-2" />
                    Save Leave Benefits Configuration
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Holiday Configuration */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-2 h-full">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar size={20} />
                        Holiday Configuration
                      </CardTitle>
                      <CardDescription className="text-green-100">Manage government holidays and pay multipliers</CardDescription>
                    </div>
                    <Dialog open={isAddHolidayDialogOpen} onOpenChange={setIsAddHolidayDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-white text-green-700 hover:bg-green-50">
                          <Plus size={16} className="mr-1" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Holiday</DialogTitle>
                          <DialogDescription>
                            Add a new holiday with corresponding pay multiplier.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right">Name</label>
                            <Input 
                              value={holidayFormData.name}
                              onChange={(e) => setHolidayFormData({...holidayFormData, name: e.target.value})}
                              placeholder="e.g. Independence Day" 
                              className="col-span-3" 
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right">Date</label>
                            <Input 
                              type="date"
                              value={holidayFormData.date}
                              onChange={(e) => setHolidayFormData({...holidayFormData, date: e.target.value})}
                              className="col-span-3" 
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right">Type</label>
                            <Select value={holidayFormData.type} onValueChange={(value: any) => setHolidayFormData({...holidayFormData, type: value})}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="regular">Regular Holiday (200% pay)</SelectItem>
                                <SelectItem value="special">Special Holiday (130% pay)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right">Pay Multiplier</label>
                            <Input 
                              type="number"
                              step="0.1"
                              value={holidayFormData.payMultiplier}
                              onChange={(e) => setHolidayFormData({...holidayFormData, payMultiplier: parseFloat(e.target.value)})}
                              className="col-span-3" 
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right">Recurring</label>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={holidayFormData.isRecurring}
                                onCheckedChange={(checked) => setHolidayFormData({...holidayFormData, isRecurring: checked})}
                              />
                              <Label>Annual holiday</Label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddHolidayDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => {
                            // Handle add holiday logic here
                            setIsAddHolidayDialogOpen(false)
                            toast.success("Holiday added successfully")
                          }}>
                            Add Holiday
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-4">
                  <div className="space-y-3 max-h-[28rem] overflow-y-auto">
                    {holidays.map((holiday) => (
                      <div key={holiday.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{holiday.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(holiday.date).toLocaleDateString()} • {holiday.payMultiplier}x pay
                            </p>
                            <Badge 
                              variant={holiday.type === 'regular' ? 'default' : 'secondary'} 
                              className="text-xs mt-1"
                            >
                              {holiday.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <Switch checked={holiday.isActive} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Tax Configuration & Summary */}
          <motion.div variants={itemVariants} className="w-full">
            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator size={20} />
                      Tax Configuration & Summary
                    </CardTitle>
                    <CardDescription className="text-red-100">
                      Philippines government tax brackets and contribution summary
                    </CardDescription>
                  </div>
                  <Dialog open={isTaxBracketDialogOpen} onOpenChange={setIsTaxBracketDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-red-700 hover:bg-red-50">
                        <Calculator size={16} className="mr-2" />
                        View Tax Calculator
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Philippines Tax Brackets (TRAIN Law)</DialogTitle>
                        <DialogDescription>
                          Current income tax rates for Filipino government employees
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Annual Income Range</TableHead>
                              <TableHead>Monthly Equivalent</TableHead>
                              <TableHead>Tax Rate</TableHead>
                              <TableHead>Tax Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {taxBrackets.map((bracket, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {bracket.description}
                                </TableCell>
                                <TableCell>
                                  ₱{bracket.min.toLocaleString()} - {bracket.max === Infinity ? '∞' : `₱${bracket.max.toLocaleString()}`}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={bracket.rate === 0 ? "secondary" : "default"}>
                                    {bracket.rate}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {bracket.rate === 0 ? "Tax-free" : `${bracket.rate}% income tax`}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Tax Summary */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText size={16} />
                      Tax Configuration
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useWithholding" className="text-sm">Withholding Tax</Label>
                        <Switch id="useWithholding" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showBreakdown" className="text-sm">Show Breakdown</Label>
                        <Switch id="showBreakdown" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoCompute" className="text-sm">Auto Compute</Label>
                        <Switch id="autoCompute" defaultChecked />
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Contributions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign size={16} />
                      Mandatory Contributions
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>GSIS (Employee):</span>
                        <span className="font-medium">9%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PhilHealth:</span>
                        <span className="font-medium">2.75%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pag-IBIG:</span>
                        <span className="font-medium">2%</span>
                      </div>
                      <div className="border-t pt-2 font-medium">
                        <div className="flex justify-between">
                          <span>Total Contributions:</span>
                          <span>13.75%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overtime & Differentials */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock size={16} />
                      Rates & Differentials
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Overtime (1-2 hrs):</span>
                        <span className="font-medium">125%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime ({'>'}2 hrs):</span>
                        <span className="font-medium">150%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Night Differential:</span>
                        <span className="font-medium">+10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Regular Holiday:</span>
                        <span className="font-medium">200%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Special Holiday:</span>
                        <span className="font-medium">130%</span>
                      </div>
                    </div>
                  </div>

                  {/* Leave Benefits */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar size={16} />
                      Leave Benefits
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Vacation Leave:</span>
                        <span className="font-medium">15 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sick Leave:</span>
                        <span className="font-medium">7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Incentive:</span>
                        <span className="font-medium">5 days</span>
                      </div>
                      <div className="border-t pt-2 font-medium">
                        <div className="flex justify-between">
                          <span>Total Leave Credits:</span>
                          <span>27 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium">
                      <Save size={16} className="mr-2" />
                      Save All Configurations
                    </Button>
                    <Button variant="outline" className="border-bisu-purple-deep text-bisu-purple-deep hover:bg-bisu-purple-light">
                      <FileText size={16} className="mr-2" />
                      Export Configuration
                    </Button>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <Calculator size={16} className="mr-2" />
                      Test Payroll Calculation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 