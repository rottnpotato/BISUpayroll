"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface AttendanceApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  recordId: string
  employeeName: string
  action: "approve" | "reject" | null
  onSuccess: () => void
}

export default function AttendanceApprovalDialog({
  isOpen,
  onClose,
  recordId,
  employeeName,
  action,
  onSuccess
}: AttendanceApprovalDialogProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (action === "reject" && !reason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/attendance/${recordId}/approval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          reason: reason.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${action} attendance record`)
      }

      const result = await response.json()
      
      toast.success(result.message || `Attendance ${action === "approve" ? "approved" : "rejected"} successfully`)
      
      setReason("")
      onSuccess()
      onClose()
    } catch (error) {
      console.error(`Error ${action}ing attendance:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${action} attendance record`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "approve" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approve Attendance
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                Reject Attendance
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === "approve" 
              ? `Are you sure you want to approve the attendance record for ${employeeName}?`
              : `Please provide a reason for rejecting ${employeeName}'s attendance record.`
            }
          </DialogDescription>
        </DialogHeader>

        {action === "reject" && (
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isSubmitting
              ? action === "approve"
                ? "Approving..."
                : "Rejecting..."
              : action === "approve"
              ? "Approve"
              : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
