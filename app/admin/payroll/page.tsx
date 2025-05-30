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
  ToggleLeft, Percent, Clock, CalendarDays
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface PayrollRule {
  id: number
  name: string
  type: string
  amount: number
  isPercentage: boolean
  isActive: boolean
  description: string
}

interface PayrollSchedule {
  id: number
  name: string
  days: number[]
  isActive: boolean
}

// Mock payroll data
const payrollRules: PayrollRule[] = [
  { 
    id: 1, 
    name: "Basic Salary", 
    type: "base", 
    amount: 25000, 
    isPercentage: false,
    isActive: true,
    description: "Base monthly salary for regular employees"
  },
  { 
    id: 2, 
    name: "Overtime Rate", 
    type: "additional",
    amount: 1.5, 
    isPercentage: true,
    isActive: true,
    description: "Overtime pay calculated at 1.5x regular rate"
  },
  { 
    id: 3, 
    name: "Night Differential", 
    type: "additional",
    amount: 10, 
    isPercentage: true,
    isActive: true,
    description: "Additional pay for work between 10PM and 6AM"
  },
  { 
    id: 4, 
    name: "SSS Contribution", 
    type: "deduction",
    amount: 3.63, 
    isPercentage: true,
    isActive: true,
    description: "Mandatory SSS contribution"
  },
  { 
    id: 5, 
    name: "PhilHealth", 
    type: "deduction",
    amount: 2.75, 
    isPercentage: true,
    isActive: true,
    description: "Mandatory PhilHealth contribution"
  },
  { 
    id: 6, 
    name: "Pag-IBIG", 
    type: "deduction",
    amount: 2, 
    isPercentage: true,
    isActive: true,
    description: "Mandatory Pag-IBIG contribution"
  },
  { 
    id: 7, 
    name: "Withholding Tax", 
    type: "deduction",
    amount: 0, 
    isPercentage: true,
    isActive: true,
    description: "Income tax withheld based on tax table"
  },
  { 
    id: 8, 
    name: "13th Month Pay", 
    type: "additional",
    amount: 8.33, 
    isPercentage: true,
    isActive: true,
    description: "Prorated 13th month pay allocation"
  }
]

// Payroll schedule options
const payrollSchedules: PayrollSchedule[] = [
  { id: 1, name: "Monthly", days: [30], isActive: true },
  { id: 2, name: "Semi-Monthly", days: [15, 30], isActive: false },
  { id: 3, name: "Weekly", days: [7, 14, 21, 28], isActive: false }
]

export default function PayrollRulesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [rules, setRules] = useState<PayrollRule[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [schedules, setSchedules] = useState<PayrollSchedule[]>([])
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "additional",
    amount: "",
    isPercentage: false,
    description: ""
  })

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
      setRules(payrollRules)
      setSchedules(payrollSchedules)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleSubmit = () => {
    // Would typically handle form submission to API here
    setIsAddRuleDialogOpen(false)
    // Reset form
    setFormData({
      name: "",
      type: "additional",
      amount: "",
      isPercentage: false,
      description: ""
    })
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
                      <Button className="bg-bisu-yellow-DEFAULT text-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light">
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
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                          Add Rule
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
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
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-500">
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
                          <TableCell className="text-gray-600 max-w-[200px] truncate">
                            {rule.description}
                          </TableCell>
                          <TableCell>
                            <Switch checked={rule.isActive} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500">
                                <Edit size={16} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
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
                  <CardTitle>Payroll Schedule</CardTitle>
                  <CardDescription>Configure when payroll is processed</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
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
                        <Switch checked={schedule.isActive} />
                      </div>
                    ))}
                    
                    <div className="flex flex-col gap-4 mt-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-bisu-purple-deep" />
                        <h3 className="font-medium text-bisu-purple-deep">Processing Time</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="processHour" className="text-xs">Hour</Label>
                          <Input id="processHour" defaultValue="9" className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="processMinute" className="text-xs">Minute</Label>
                          <Input id="processMinute" defaultValue="00" className="mt-1" />
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full mt-4">
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