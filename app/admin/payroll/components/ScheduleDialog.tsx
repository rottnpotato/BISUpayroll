"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScheduleFormData } from "../types"

interface ScheduleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: ScheduleFormData) => Promise<boolean>
  isLoading?: boolean
  title?: string
  initialData?: any
}

const defaultFormData: ScheduleFormData = {
  name: "",
  days: [1], // Default to 1st of month
  cutoffDays: [15, 30],
  payrollReleaseDay: 1,
  // Default processing days for bi-monthly: 20th and 5th
  processingDays: [20, 5],
  cutoffType: "bi-monthly",
  isActive: false,
  description: "",
  employmentStatuses: []
}

export function ScheduleDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = "Create Payroll Schedule",
  initialData = null
}: ScheduleDialogProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(defaultFormData)

  const isEdit = Boolean(initialData)
  const headerTitle = isEdit ? "Edit Payroll Schedule" : title
  const primaryCta = isEdit ? (isLoading ? "Saving..." : "Save Changes") : (isLoading ? "Creating..." : "Create Schedule")

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return
    }

    const success = await onSubmit(formData)
    if (success) {
      setFormData(defaultFormData)
      onClose()
    }
  }

  const handleClose = () => {
    setFormData(defaultFormData)
    onClose()
  }

  // Set initial data when dialog opens for editing
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || "",
        days: initialData.days || [1],
        cutoffDays: initialData.cutoffDays || [15, 30],
        payrollReleaseDay: initialData.payrollReleaseDay || 1,
        processingDays: initialData.processingDays || [20, 5],
        cutoffType: initialData.cutoffType || "bi-monthly",
        isActive: initialData.isActive || false,
        description: initialData.description || "",
        employmentStatuses: initialData.employmentStatuses || []
      })
    } else if (isOpen && !initialData) {
      setFormData(defaultFormData)
    }
  }, [isOpen, initialData])

  const handleDayToggle = (day: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      days: checked 
        ? [...prev.days, day].sort((a, b) => a - b)
        : prev.days.filter(d => d !== day)
    }))
  }

  const handleCutoffDayToggle = (day: number, checked: boolean) => {
    setFormData(prev => {
      // For monthly, only allow one cutoff day
      if (prev.cutoffType === 'monthly' && checked) {
        return {
          ...prev,
          cutoffDays: [day]
        }
      }
      
      return {
        ...prev,
        cutoffDays: checked 
          ? [...prev.cutoffDays, day].sort((a, b) => a - b)
          : prev.cutoffDays.filter(d => d !== day)
      }
    })
  }

  const dayOptions = [1, 5, 10, 15, 20, 25, 30, 31]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-bisu-purple-deep">{headerTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bi-monthly Payroll"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this payroll schedule"
                className="mt-1"
              />
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-bisu-purple-deep">Schedule Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cutoffType">Cutoff Type</Label>
                <Select 
                  value={formData.cutoffType} 
                  onValueChange={(value: any) => setFormData(prev => ({ 
                    ...prev, 
                    cutoffType: value,
                    // Auto-set cutoff days based on type
                    cutoffDays: value === 'bi-monthly' ? [15, 30] : value === 'monthly' ? [30] : [],
                    // Reset processing days based on cutoff type
                    processingDays: value === 'bi-monthly' ? [20, 5] : [1]
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bi-monthly">Bi-Monthly (15th & 30th)</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.cutoffType === 'bi-monthly' ? (
                <div className="space-y-2">
                  <Label htmlFor="firstProcessingDay" className="text-xs">Bi-Monthly Processing Days</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstProcessingDay" className="text-xs">First Period (1st-15th)</Label>
                      <Input
                        id="firstProcessingDay"
                        type="number"
                        min="16"
                        max="31"
                        value={formData.processingDays[0] || 20}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          processingDays: [parseInt(e.target.value) || 20, prev.processingDays[1] || 5]
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondProcessingDay" className="text-xs">Second Period (16th-30th)</Label>
                      <Input
                        id="secondProcessingDay"
                        type="number"
                        min="1"
                        max="15"
                        value={formData.processingDays[1] || 5}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          processingDays: [prev.processingDays[0] || 20, parseInt(e.target.value) || 5]
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    First period processed around 20th, second period around 5th of next month
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="payrollReleaseDay">Payroll Generation Day</Label>
                  <Input
                    id="payrollReleaseDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payrollReleaseDay}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      payrollReleaseDay: parseInt(e.target.value) || 1 
                    }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Day of the month when payroll is generated
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Cutoff Days</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {dayOptions.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cutoff-${day}`}
                      checked={formData.cutoffDays.includes(day)}
                      onCheckedChange={(checked) => handleCutoffDayToggle(day, checked as boolean)}
                      disabled={formData.cutoffType === 'monthly' && formData.cutoffDays.length > 0 && !formData.cutoffDays.includes(day)}
                    />
                    <Label htmlFor={`cutoff-${day}`} className="text-sm">
                      {day === 31 ? 'End' : `${day}th`}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.cutoffType === 'bi-monthly' 
                  ? 'For bi-monthly, typically select 15th and 30th' 
                  : formData.cutoffType === 'monthly'
                  ? 'For monthly, select only one cutoff day'
                  : 'Select the day when attendance cutoff occurs'}
              </p>
            </div>

            {/* Employment Status Selection */}
            <div>
              <Label>Employment Status (Leave empty for all)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['PERMANENT', 'TEMPORARY', 'CONTRACTUAL'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={formData.employmentStatuses.includes(status)}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          employmentStatuses: checked 
                            ? [...prev.employmentStatuses, status]
                            : prev.employmentStatuses.filter(s => s !== status)
                        }))
                      }}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm">
                      {status === 'PERMANENT' ? 'Permanent' : status === 'TEMPORARY' ? 'Temporary' : 'Contractual'}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select which employment statuses this schedule applies to. If none selected, applies to all.
              </p>
            </div>
          </div>

          {/* Activation */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">
                Activate this schedule immediately
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Activating this schedule will deactivate any other active schedules.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name.trim()}
            className="bg-bisu-purple-deep hover:bg-bisu-purple-medium"
          >
            {primaryCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
