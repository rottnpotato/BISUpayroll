"use client"

import { useState, useEffect } from 'react'
import { motion } from '@/components/simple-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, CheckCircle, XCircle, Calendar, User, DollarSign, FileText, PhilippinePeso } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface OvertimeRequest {
  id: string
  attendanceId: string
  userId: string
  startTime: string
  endTime: string
  hoursWorked: number
  hourlyRate: number
  totalAmount: number
  description?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt?: string | null
  approvedById?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
    department: string
    position: string
  }
  attendance: {
    date: string
    timeIn?: string | null
    timeOut?: string | null
  }
  approvedBy?: {
    firstName: string
    lastName: string
  } | null
}

export default function AdminOvertimePage() {
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<OvertimeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchOvertimeRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [selectedFilter, overtimeRequests])

  const fetchOvertimeRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/overtime')
      if (!response.ok) {
        throw new Error('Failed to fetch overtime requests')
      }
      const data = await response.json()
      setOvertimeRequests(data.data || [])
    } catch (error) {
      console.error('Error fetching overtime requests:', error)
      toast.error('Failed to load overtime requests')
    } finally {
      setIsLoading(false)
    }
  }

  const filterRequests = () => {
    if (selectedFilter === 'all') {
      setFilteredRequests(overtimeRequests)
    } else {
      setFilteredRequests(overtimeRequests.filter(req => req.status === selectedFilter))
    }
  }

  const handleApprovalClick = (request: OvertimeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setApprovalAction(action)
    setRejectionReason('')
    setIsApprovalDialogOpen(true)
  }

  const handleApprovalSubmit = async () => {
    if (!selectedRequest) return

    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/overtime', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: approvalAction,
          rejectionReason: approvalAction === 'reject' ? rejectionReason : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update overtime request')
      }

      toast.success(`Overtime request ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`)
      setIsApprovalDialogOpen(false)
      fetchOvertimeRequests()
    } catch (error) {
      console.error('Error updating overtime request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update overtime request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const pendingCount = overtimeRequests.filter(r => r.status === 'PENDING').length
  const approvedCount = overtimeRequests.filter(r => r.status === 'APPROVED').length
  const rejectedCount = overtimeRequests.filter(r => r.status === 'REJECTED').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Overtime Request Management</h1>
            <p className="text-gray-600 mt-1">Review and approve employee overtime requests</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{overtimeRequests.length}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Overtime Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="PENDING">Pending ({pendingCount})</TabsTrigger>
                <TabsTrigger value="APPROVED">Approved ({approvedCount})</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected ({rejectedCount})</TabsTrigger>
                <TabsTrigger value="all">All ({overtimeRequests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedFilter}>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bisu-purple-deep mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading overtime requests...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No {selectedFilter === 'all' ? '' : selectedFilter.toLowerCase()} overtime requests found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time Range</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {request.user.firstName} {request.user.lastName}
                                </span>
                                <span className="text-xs text-gray-500">{request.user.employeeId}</span>
                                <span className="text-xs text-gray-500">{request.user.department}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatDate(request.attendance.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {formatTime(request.startTime)} - {formatTime(request.endTime)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{Number(request.hoursWorked).toFixed(2)} hrs</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <PhilippinePeso className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{Number(request.totalAmount).toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                @ ₱{Number(request.hourlyRate).toFixed(2)}/hr
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(request.status)}
                              {request.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">{request.rejectionReason}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {request.status === 'PENDING' ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprovalClick(request, 'approve')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleApprovalClick(request, 'reject')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {request.approvedBy
                                    ? `By ${request.approvedBy.firstName} ${request.approvedBy.lastName}`
                                    : 'Processed'}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Overtime Request
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? 'This will approve the overtime request and include it in payroll calculations.'
                : 'Please provide a reason for rejecting this overtime request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Employee</Label>
                  <p className="font-medium">
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date</Label>
                  <p className="font-medium">{formatDate(selectedRequest.attendance.date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hours</Label>
                  <p className="font-medium">{Number(selectedRequest.hoursWorked).toFixed(2)} hrs</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <p className="font-medium">₱{Number(selectedRequest.totalAmount).toFixed(2)}</p>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>
              )}

              {approvalAction === 'reject' && (
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprovalSubmit}
              disabled={isSubmitting}
              className={
                approvalAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isSubmitting
                ? approvalAction === 'approve'
                  ? 'Approving...'
                  : 'Rejecting...'
                : approvalAction === 'approve'
                ? 'Approve Request'
                : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
