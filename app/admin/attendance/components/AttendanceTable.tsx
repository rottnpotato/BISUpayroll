"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import type { AttendanceRecord, AttendanceApprovalAction } from "../types"
import { formatTime, formatHours } from "../utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AttendanceTableProps {
  records: AttendanceRecord[]
  onApprovalAction: (id: string, action: AttendanceApprovalAction) => void
}

const getStatusBadge = (record: AttendanceRecord) => {
  if (record.isAbsent) {
    return <Badge className="bg-red-500">Absent</Badge>
  }
  if (record.timeIn && record.isLate) {
    return <Badge className="bg-yellow-500">Late</Badge>
  }
  if (record.timeIn) {
    return <Badge className="bg-green-500">Present</Badge>
  }
  return <Badge className="bg-gray-500">No Data</Badge>
}

const getApprovalStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    case "APPROVED":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Approved
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1">
          <X className="h-3 w-3" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function AttendanceTable({ records, onApprovalAction }: AttendanceTableProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug logging
  console.log('AttendanceTable received records:', {
    count: records.length,
    firstRecord: records[0] || null,
    allRecords: records
  })

  const handleApprove = async (record: AttendanceRecord) => {
    try {
      await onApprovalAction(record.id, { action: "approve" })
      toast.success(`Attendance record for ${record.user.firstName} ${record.user.lastName} has been approved.`)
    } catch (error) {
      toast.error("Failed to approve attendance record.")
    }
  }

  const handleRejectClick = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedRecord || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.")
      return
    }

    try {
      setIsSubmitting(true)
      await onApprovalAction(selectedRecord.id, { 
        action: "reject", 
        reason: rejectionReason.trim() 
      })
      toast.success(`Attendance record for ${selectedRecord.user.firstName} ${selectedRecord.user.lastName} has been rejected.`)
      setShowRejectDialog(false)
      setSelectedRecord(null)
      setRejectionReason("")
    } catch (error) {
      toast.error("Failed to reject attendance record.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (records.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Time Out</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Approval Status</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={10} className="text-center py-10 text-gray-500">
              No attendance records found matching the current filters
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Time Out</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Approval Status</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className="transition-colors hover:bg-gray-50">
              <TableCell className="font-medium">{record.user.employeeId}</TableCell>
              <TableCell>{`${record.user.firstName} ${record.user.lastName}`}</TableCell>
              <TableCell>{record.user.department}</TableCell>
              <TableCell>{format(new Date(record.date), 'yyyy-MM-dd')}</TableCell>
              <TableCell>{formatTime(record.timeIn)}</TableCell>
              <TableCell>{formatTime(record.timeOut)}</TableCell>
              <TableCell>{getStatusBadge(record)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getApprovalStatusBadge(record.status)}
                  {record.status === "REJECTED" && record.rejectionReason && (
                    <div className="text-xs text-red-600 bg-red-50 p-1 rounded border">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {record.rejectionReason}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatHours(record.hoursWorked)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {record.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(record)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectClick(record)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {record.status === "APPROVED" && (
                    <span className="text-xs text-green-600 font-medium">
                      Approved by {record.approvedBy?.firstName} {record.approvedBy?.lastName}
                      {record.approvedAt && (
                        <div className="text-gray-500">
                          {format(new Date(record.approvedAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}
                    </span>
                  )}
                  {record.status === "REJECTED" && (
                    <span className="text-xs text-red-600 font-medium">
                      Rejected by {record.approvedBy?.firstName} {record.approvedBy?.lastName}
                      {record.approvedAt && (
                        <div className="text-gray-500">
                          {format(new Date(record.approvedAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <X className="h-5 w-5" />
              Reject Attendance Record
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this attendance record. This will be visible to the employee.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="py-4">
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm font-medium text-gray-700">
                  Employee: {selectedRecord.user.firstName} {selectedRecord.user.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  Date: {format(new Date(selectedRecord.date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  Time: {formatTime(selectedRecord.timeIn)} - {formatTime(selectedRecord.timeOut)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-sm font-medium">
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Enter the reason for rejecting this attendance record..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? "Rejecting..." : "Reject Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 