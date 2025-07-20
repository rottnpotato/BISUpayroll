"use client"

import { useState } from "react"
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
}

const defaultFormData: ScheduleFormData = {
  name: "",
  days: [],
  cutoffDays: [15, 30],
  payrollReleaseDay: 1,
  cutoffType: "bi-monthly",
  isActive: false,
  processHour: 9,
  processMinute: 0,
  paymentMethod: "bank_transfer",
  description: ""
}

export function ScheduleDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: ScheduleDialogProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(defaultFormData)

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

  const handleCutoffDayToggle = (day: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      cutoffDays: checked 
        ? [...prev.cutoffDays, day].sort((a, b) => a - b)
        : prev.cutoffDays.filter(d => d !== day)
    }))
  }

  const cutoffDayOptions = [1, 5, 10, 15, 20, 25, 30, 31]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-bisu-purple-deep">Create Payroll Schedule</DialogTitle>
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
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, cutoffType: value }))}
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

              <div>
                <Label htmlFor="payrollReleaseDay">Payroll Release Day</Label>
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
                  Day of the month payroll is released
                </p>
              </div>
            </div>

            <div>
              <Label>Cutoff Days</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {cutoffDayOptions.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cutoff-${day}`}
                      checked={formData.cutoffDays.includes(day)}
                      onCheckedChange={(checked) => handleCutoffDayToggle(day, checked as boolean)}
                    />
                    <Label htmlFor={`cutoff-${day}`} className="text-sm">
                      {day === 31 ? 'End' : `${day}th`}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select the days when attendance cutoff occurs
              </p>
            </div>
          </div>

          {/* Processing Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-bisu-purple-deep">Processing Configuration</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="processHour">Processing Hour</Label>
                <Input
                  id="processHour"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.processHour}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    processHour: parseInt(e.target.value) || 9 
                  }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="processMinute">Processing Minute</Label>
                <Input
                  id="processMinute"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.processMinute}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    processMinute: parseInt(e.target.value) || 0 
                  }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              Note: Activating this schedule will deactivate any other active schedules
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
            {isLoading ? "Creating..." : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
