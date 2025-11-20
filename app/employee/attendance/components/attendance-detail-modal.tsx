"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  DollarSign
} from "lucide-react"
import { AttendanceRecord } from "../types"
import { OverloadModal } from "./overload-modal"
import { OvertimeModal } from "./overtime-modal"

interface AttendanceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  record: AttendanceRecord | null
  onOverloadAdded?: () => void
}

export function AttendanceDetailModal({ 
  isOpen, 
  onClose, 
  record,
  onOverloadAdded
}: AttendanceDetailModalProps) {
  const [isOverloadModalOpen, setIsOverloadModalOpen] = useState(false)
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false)

  if (!record) return null

  // Calculate total hours worked
  const calculateTotalHours = () => {
    return record.hours || 0
  }

  const totalHours = calculateTotalHours()
  const canAddOverload = totalHours > 8

  // Calculate total overload hours
  const totalOverloadHours = record.overloadRecords?.reduce(
    (sum, overload) => sum + overload.hoursWorked, 
    0
  ) || 0

  // Calculate total overload amount
  const totalOverloadAmount = record.overloadRecords?.reduce(
    (sum, overload) => sum + overload.totalAmount, 
    0
  ) || 0

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="h-6 w-6 text-bisu-purple-deep" />
              Attendance Details
            </DialogTitle>
            <DialogDescription>
              View and manage your attendance record for {record.date}
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium p-4 rounded-lg text-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-90">Date</p>
                  <p className="text-lg font-semibold">{record.date}</p>
                  <p className="text-sm opacity-75">{record.dayOfWeek}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Total Hours</p>
                  <p className="text-lg font-semibold">{formatHours(totalHours)}</p>
                  <p className="text-sm opacity-75">Regular work hours</p>
                </div>
              </div>
            </div>

            {/* Time Sessions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Sessions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Morning Session */}
                <div className="border rounded-lg p-3 bg-blue-50">
                  <p className="text-sm font-medium text-blue-800 mb-2">Morning</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time In:</span>
                      <span className="font-medium">
                        {record.morningTimeIn || <span className="text-gray-400">--</span>}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Out:</span>
                      <span className="font-medium">
                        {record.morningTimeOut || <span className="text-gray-400">--</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Afternoon Session */}
                <div className="border rounded-lg p-3 bg-orange-50">
                  <p className="text-sm font-medium text-orange-800 mb-2">Afternoon</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time In:</span>
                      <span className="font-medium">
                        {record.afternoonTimeIn || <span className="text-gray-400">--</span>}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Out:</span>
                      <span className="font-medium">
                        {record.afternoonTimeOut || <span className="text-gray-400">--</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Overtime Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Overtime Requests
                </h3>
                <Button
                  size="sm"
                  onClick={() => setIsOvertimeModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {record.overtimeRequests && record.overtimeRequests.length > 0 ? 'View Request' : 'Request Overtime'}
                </Button>
              </div>

              {record.overtimeRequests && record.overtimeRequests.length > 0 ? (
                <div className="space-y-2">
                  {record.overtimeRequests.map((overtime) => (
                    <motion.div
                      key={overtime.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border rounded-lg p-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-sm font-medium">
                              {new Date(overtime.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(overtime.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {getStatusBadge(overtime.status)}
                          </div>
                          <div className="text-xs text-gray-600 ml-5">
                            {formatHours(Number(overtime.hoursWorked))} @ ₱{Number(overtime.hourlyRate).toFixed(2)}/hr (OT rates)
                          </div>
                          {overtime.description && (
                            <div className="text-xs text-gray-500 ml-5 italic">
                              {overtime.description}
                            </div>
                          )}
                          {overtime.rejectionReason && (
                            <div className="text-xs text-red-600 ml-5 bg-red-50 p-2 rounded mt-1">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              Reason: {overtime.rejectionReason}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ₱{Number(overtime.totalAmount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No overtime requests for this date</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Overload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Overload Records
                </h3>
                <Button
                  size="sm"
                  onClick={() => setIsOverloadModalOpen(true)}
                  disabled={!canAddOverload}
                  className="bg-bisu-purple-deep hover:bg-bisu-purple-medium"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Overload
                </Button>
              </div>

              {!canAddOverload && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  You must work more than 8 hours to add overload records. Current hours: {formatHours(totalHours)}
                </div>
              )}

              {record.overloadRecords && record.overloadRecords.length > 0 ? (
                <div className="space-y-2">
                  {record.overloadRecords.map((overload) => (
                    <motion.div
                      key={overload.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-sm font-medium">
                              {overload.startTime} - {overload.endTime}
                            </span>
                            {getStatusBadge(overload.status)}
                          </div>
                          <div className="text-xs text-gray-600 ml-5">
                            {formatHours(overload.hoursWorked)} @ ₱{overload.hourlyRate.toFixed(2)}/hr
                          </div>
                          {overload.description && (
                            <div className="text-xs text-gray-500 ml-5 italic">
                              {overload.description}
                            </div>
                          )}
                          {overload.rejectionReason && (
                            <div className="text-xs text-red-600 ml-5 bg-red-50 p-2 rounded mt-1">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              Reason: {overload.rejectionReason}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ₱{overload.totalAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-green-800">Total Overload</p>
                        <p className="text-xs text-green-600">{formatHours(totalOverloadHours)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">₱{totalOverloadAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No overload records for this date</p>
                </div>
              )}
            </div>

            {/* Status Information */}
            {record.approvalStatus && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Approval Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.approvalStatus)}
                    {record.approvedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(record.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {record.rejectionReason && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      <span className="font-medium">Reason:</span> {record.rejectionReason}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Overtime Modal */}
      <OvertimeModal
        isOpen={isOvertimeModalOpen}
        onClose={() => setIsOvertimeModalOpen(false)}
        attendanceRecord={{
          id: record.id,
          date: record.date,
          timeIn: record.timeIn,
          timeOut: record.timeOut,
          hours: record.hours,
          morningTimeIn: record.morningTimeIn,
          afternoonTimeOut: record.afternoonTimeOut
        }}
        existingRequests={record.overtimeRequests || []}
        onSuccess={() => {
          setIsOvertimeModalOpen(false)
          onOverloadAdded?.()
        }}
      />

      {/* Overload Modal */}
      <OverloadModal
        isOpen={isOverloadModalOpen}
        onClose={() => setIsOverloadModalOpen(false)}
        attendanceRecord={record}
        onSuccess={() => {
          setIsOverloadModalOpen(false)
          onOverloadAdded?.()
        }}
      />
    </>
  )
}
