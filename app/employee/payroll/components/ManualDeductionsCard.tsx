"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Edit, DollarSign, Info, AlertCircle, Shield, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Deduction {
  id: string
  name: string
  amount: number
  isPercentage: boolean
  description: string | null
  isActive: boolean
  createdAt: string
  type: string
  createdByRole?: string
  applyToAll?: boolean
}

interface DeductionFormData {
  name: string
  amount: string
  isPercentage: boolean
  description: string
}

interface ManualDeductionsCardProps {
  onDeductionChange?: () => void
}

export function ManualDeductionsCard({ onDeductionChange }: ManualDeductionsCardProps = {}) {
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [systemDeductions, setSystemDeductions] = useState<Deduction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null)
  const [formData, setFormData] = useState<DeductionFormData>({
    name: "",
    amount: "",
    isPercentage: false,
    description: ""
  })

  const fetchDeductions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employee/deductions')
      const data = await response.json()

      if (data.success) {
        setDeductions(data.deductions || [])
        setSystemDeductions(data.systemDeductions || [])
      } else {
        throw new Error(data.error || 'Failed to fetch deductions')
      }
    } catch (error) {
      console.error('Error fetching deductions:', error)
      toast.error('Failed to load your deductions')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      isPercentage: false,
      description: ""
    })
    setEditingDeduction(null)
  }

  const handleOpenAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (deduction: Deduction) => {
    setFormData({
      name: deduction.name,
      amount: deduction.amount.toString(),
      isPercentage: deduction.isPercentage,
      description: deduction.description || ""
    })
    setEditingDeduction(deduction)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Please enter a deduction name')
        return
      }

      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount greater than 0')
        return
      }

      if (formData.isPercentage && amount > 100) {
        toast.error('Percentage cannot exceed 100%')
        return
      }

      const url = editingDeduction 
        ? `/api/employee/deductions/${editingDeduction.id}`
        : '/api/employee/deductions'
      
      const method = editingDeduction ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          amount: formData.amount,
          isPercentage: formData.isPercentage,
          description: formData.description.trim() || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsDialogOpen(false)
        resetForm()
        await fetchDeductions()
        // Notify parent to refresh payroll data
        onDeductionChange?.()
      } else {
        toast.error(data.error || 'Failed to save deduction')
      }
    } catch (error) {
      console.error('Error saving deduction:', error)
      toast.error('Failed to save deduction')
    }
  }

  const handleDelete = async (deduction: Deduction) => {
    if (!window.confirm(`Are you sure you want to delete "${deduction.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/employee/deductions/${deduction.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        await fetchDeductions()
        // Notify parent to refresh payroll data
        onDeductionChange?.()
      } else {
        toast.error(data.error || 'Failed to delete deduction')
      }
    } catch (error) {
      console.error('Error deleting deduction:', error)
      toast.error('Failed to delete deduction')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const renderDeductionCard = (deduction: Deduction, index: number, isEditable: boolean = true) => (
    <motion.div
      key={deduction.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isEditable ? 'bg-white' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {!isEditable && <Shield className="h-4 w-4 text-amber-600" />}
            <h4 className="font-semibold text-gray-900">{deduction.name}</h4>
            <Badge 
              variant={deduction.isActive ? "default" : "secondary"}
              className={deduction.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
            >
              {deduction.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {!isEditable && deduction.applyToAll && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                Global Rule
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {deduction.isPercentage 
              ? `${deduction.amount}%` 
              : formatCurrency(deduction.amount)}
            {deduction.isPercentage && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                of gross pay
              </span>
            )}
          </p>
          {deduction.description && (
            <p className="text-sm text-gray-600">{deduction.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-gray-500">
              Type: <span className="font-medium">{deduction.type.replace('_', ' ').toUpperCase()}</span>
            </p>
            <p className="text-xs text-gray-400">
              Added: {new Date(deduction.createdAt).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        {isEditable && (
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEditDialog(deduction)}
              className="border-bisu-purple-light text-bisu-purple-deep hover:bg-bisu-purple-extralight"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(deduction)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )

  useEffect(() => {
    fetchDeductions()
  }, [])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                <DollarSign className="h-5 w-5" />
                Deductions Applied to Your Payroll
              </CardTitle>
              <CardDescription className="mt-1">
                View all deductions including system rules and your personal deductions
              </CardDescription>
            </div>
            <Button 
              onClick={handleOpenAddDialog}
              size="sm"
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Deduction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              View all deductions applied to your payroll. System rules are managed by HR, while you can add your own personal deductions.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Deductions</TabsTrigger>
                <TabsTrigger value="system">System Rules ({systemDeductions.length})</TabsTrigger>
                <TabsTrigger value="personal">My Deductions ({deductions.length})</TabsTrigger>
              </TabsList>

              {/* All Deductions Tab */}
              <TabsContent value="all" className="space-y-4">
                {systemDeductions.length === 0 && deductions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Deductions</h3>
                    <p className="text-gray-500 mb-4">
                      No deductions have been configured yet.
                    </p>
                    <Button 
                      onClick={handleOpenAddDialog}
                      variant="outline"
                      size="sm"
                      className="border-bisu-purple-deep text-bisu-purple-deep hover:bg-bisu-purple-extralight"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Deduction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {systemDeductions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          System Rules (Applied Automatically)
                        </h3>
                        <div className="space-y-3">
                          <AnimatePresence>
                            {systemDeductions.map((deduction, index) => renderDeductionCard(deduction, index, false))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {deductions.length > 0 && (
                      <div>
                        {systemDeductions.length > 0 && <Separator className="my-6" />}
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Your Personal Deductions
                        </h3>
                        <div className="space-y-3">
                          <AnimatePresence>
                            {deductions.map((deduction, index) => renderDeductionCard(deduction, index, true))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* System Rules Tab */}
              <TabsContent value="system" className="space-y-3">
                {systemDeductions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No System Rules</h3>
                    <p className="text-gray-500">
                      No system-wide deduction rules have been configured by HR.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {systemDeductions.map((deduction, index) => renderDeductionCard(deduction, index, false))}
                  </AnimatePresence>
                )}
              </TabsContent>

              {/* Personal Deductions Tab */}
              <TabsContent value="personal" className="space-y-3">
                {deductions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Personal Deductions</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't added any personal deductions yet.
                    </p>
                    <Button 
                      onClick={handleOpenAddDialog}
                      variant="outline"
                      size="sm"
                      className="border-bisu-purple-deep text-bisu-purple-deep hover:bg-bisu-purple-extralight"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Deduction
                    </Button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {deductions.map((deduction, index) => renderDeductionCard(deduction, index, true))}
                  </AnimatePresence>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-bisu-purple-deep">
              {editingDeduction ? 'Edit Deduction' : 'Add New Deduction'}
            </DialogTitle>
            <DialogDescription>
              {editingDeduction 
                ? 'Update the details of your deduction below.' 
                : 'Add a new deduction that will be applied to your payroll.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Deduction Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Personal Loan, Savings, Union Dues"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.isPercentage ? "100" : undefined}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={formData.isPercentage ? "e.g., 5" : "e.g., 500.00"}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {formData.isPercentage ? '%' : 'PHP'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPercentage"
                checked={formData.isPercentage}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isPercentage: !!checked, amount: "" })
                }
              />
              <Label htmlFor="isPercentage" className="text-sm cursor-pointer">
                This is a percentage of my gross pay
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add any notes about this deduction..."
                rows={3}
                maxLength={500}
              />
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                This deduction will be automatically applied to your future payroll calculations.
                Make sure the amount is correct before saving.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
            >
              {editingDeduction ? 'Update' : 'Add'} Deduction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
