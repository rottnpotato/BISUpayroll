"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScheduleFormData } from "../types"

interface ScheduleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => Promise<boolean>
  formData: ScheduleFormData
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDayToggle: (day: number) => void
}

export function ScheduleDialog({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  onDayToggle
}: ScheduleDialogProps) {

  const handleSubmit = async () => {
    const success = await onSubmit()
    if (success) {
      onClose()
    }
  }

  const paymentDays = [15, 30, 31]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Payroll Schedule</DialogTitle>
          <DialogDescription>
            Create a new payroll processing schedule with payment and cutoff dates.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="scheduleName">Schedule Name *</Label>
            <Input
              id="scheduleName"
              name="name"
              value={formData.name}
              onChange={onFormChange}
              placeholder="e.g., Monthly End of Month"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Days *</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentDays.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={formData.days.includes(day)}
                    onCheckedChange={() => onDayToggle(day)}
                  />
                  <Label htmlFor={`day-${day}`} className="text-sm">
                    {day === 31 ? "End of Month" : `${day}th`}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="processHour">Process Hour</Label>
              <Input
                id="processHour"
                name="processHour"
                type="number"
                min="0"
                max="23"
                value={formData.processHour.toString()}
                onChange={onFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processMinute">Process Minute</Label>
              <Input
                id="processMinute"
                name="processMinute"
                type="number"
                min="0"
                max="59"
                value={formData.processMinute.toString()}
                onChange={onFormChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => 
              onFormChange({
                target: { name: "paymentMethod", value }
              } as any)
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => 
                onFormChange({
                  target: { name: "isActive", type: "checkbox", checked }
                } as any)
              }
            />
            <Label htmlFor="isActive">Activate this schedule immediately</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
