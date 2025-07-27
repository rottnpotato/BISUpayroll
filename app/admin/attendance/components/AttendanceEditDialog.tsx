"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AttendanceRecord, AttendanceFormData } from "../types"

interface AttendanceEditDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: AttendanceRecord | null
  formData: AttendanceFormData
  onFormDataChange: (updates: Partial<AttendanceFormData>) => void
  onSave: () => void
}

export default function AttendanceEditDialog({
  isOpen,
  onOpenChange,
  editingRecord,
  formData,
  onFormDataChange,
  onSave
}: AttendanceEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Attendance Record</DialogTitle>
          <DialogDescription>
            Update the attendance record for {editingRecord && `${editingRecord.user.firstName} ${editingRecord.user.lastName}`}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-date" className="text-right">Date</Label>
            <Input
              id="edit-date"
              type="date"
              className="col-span-3"
              value={formData.date}
              onChange={(e) => onFormDataChange({ date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-timeIn" className="text-right">Time In</Label>
            <Input
              id="edit-timeIn"
              type="time"
              className="col-span-3"
              value={formData.timeIn}
              onChange={(e) => onFormDataChange({ timeIn: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-timeOut" className="text-right">Time Out</Label>
            <Input
              id="edit-timeOut"
              type="time"
              className="col-span-3"
              value={formData.timeOut}
              onChange={(e) => onFormDataChange({ timeOut: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave}>Update Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 