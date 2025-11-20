"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import type { AttendanceRecord } from "../types"
import { formatTime, formatHours, calculateUndertime } from "../utils"
import AttendanceApprovalDialog from "./AttendanceApprovalDialog"

interface AttendanceTableProps {
  records: AttendanceRecord[]
  onApprovalAction?: (id: string, action: any) => void // Kept for backward compatibility but not used
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

const getApprovalStatusBadge = (status: string, rejectionReason?: string | null) => {
  switch (status) {
    case "PENDING":
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        </div>
      )
    case "APPROVED":
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        </div>
      )
    case "REJECTED":
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            Rejected
          </Badge>
          {rejectionReason && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 max-w-xs">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              <span className="font-medium">Reason:</span> {rejectionReason}
            </div>
          )}
        </div>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function AttendanceTable({ records }: AttendanceTableProps) {
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Debug logging
  console.log('AttendanceTable received records:', {
    count: records.length,
    firstRecord: records[0] || null,
    allRecords: records
  })

  // Helper to determine if a record needs approval
  const needsApproval = (record: AttendanceRecord): boolean => {
    // Only show approval status for records that have explicit overtime/overload requests
    // Regular attendance is always auto-approved regardless of hours worked
    // Hours beyond 8 are only counted if employee requests overtime/overload
    const hasPendingOvertimeRequests = record.overtimeRequests?.some(req => req.status === 'PENDING') || false
    const hasPendingOverloadRequests = record.overloadRecords?.some(rec => rec.status === 'PENDING') || false
    
    return hasPendingOvertimeRequests || hasPendingOverloadRequests
  }

  const handleApprovalClick = (record: AttendanceRecord, action: "approve" | "reject") => {
    setSelectedRecord(record)
    setApprovalAction(action)
    setIsApprovalDialogOpen(true)
  }

  const handleApprovalSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    // Trigger a page refresh or refetch
    window.location.reload()
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
            <TableHead colSpan={2} className="text-center">Morning</TableHead>
            <TableHead colSpan={2} className="text-center">Afternoon</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Approval Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={13} className="text-center py-10 text-gray-500">
              No attendance records found matching the current filters
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  // Ensure most recent days appear first in the UI
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date</TableHead>
            <TableHead colSpan={2} className="text-center text-green-500">Morning</TableHead>
            <TableHead colSpan={2} className="text-center text-orange-500 ">Afternoon</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Undertime</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Approval Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
              <TableHead></TableHead>
     
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRecords.map((record) => (
            <TableRow key={record.id} className="transition-colors hover:bg-gray-50">
              <TableCell className="font-medium">{record.user.employeeId}</TableCell>
              <TableCell>{`${record.user.firstName} ${record.user.lastName}`}</TableCell>
              <TableCell>{record.user.department}</TableCell>
              {/*spell out the date format ex: May 1, 2023 */}
              <TableCell>{format(new Date(record.date), 'MMMM d, yyyy')}</TableCell>
              <TableCell className="text-green-600">{formatTime(record.morningTimeIn ?? null)}</TableCell>
              <TableCell className="text-orange-600">{formatTime(record.morningTimeOut ?? null)}</TableCell>
              <TableCell className="text-green-600">{formatTime(record.afternoonTimeIn ?? null)}</TableCell>
              <TableCell className="text-orange-600">{formatTime(record.afternoonTimeOut ?? null)}</TableCell>
              <TableCell>{getStatusBadge(record)}</TableCell>
              <TableCell className="text-red-500 font-medium">{calculateUndertime(record)}</TableCell>
              <TableCell>{formatHours(record.hoursWorked)}</TableCell>
              <TableCell>
                {needsApproval(record) ? (
                  getApprovalStatusBadge(record.status, record.rejectionReason)
                ) : (
                  <span className="text-xs text-gray-400">Auto-approved</span>
                )}
              </TableCell>
              <TableCell>
                {needsApproval(record) && record.status === "PENDING" ? (
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                      onClick={() => handleApprovalClick(record, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                      onClick={() => handleApprovalClick(record, "reject")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm">
                    {needsApproval(record) 
                      ? (record.status === "APPROVED" ? "Approved" : "Rejected")
                      : "-"
                    }
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <AttendanceApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => {
          setIsApprovalDialogOpen(false)
          setSelectedRecord(null)
          setApprovalAction(null)
        }}
        recordId={selectedRecord?.id || ""}
        employeeName={selectedRecord ? `${selectedRecord.user.firstName} ${selectedRecord.user.lastName}` : ""}
        action={approvalAction}
        onSuccess={handleApprovalSuccess}
      />
    </>
  )
}

