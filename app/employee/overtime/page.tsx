"use client"

import { useState, useEffect } from 'react'
import { motion } from '@/components/simple-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, CheckCircle, XCircle, Calendar, DollarSign, FileText, Info, AlertCircle, PhilippinePeso } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OvertimeRequest {
  id: string
  attendanceId: string
  startTime: string
  endTime: string
  hoursWorked: number
  hourlyRate: number
  totalAmount: number
  description?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
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

export default function EmployeeOvertimePage() {
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<OvertimeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all')

  useEffect(() => {
    fetchOvertimeRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [selectedFilter, overtimeRequests])

  const fetchOvertimeRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employee/overtime')
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
      hour12: true,
      timeZone: 'Asia/Manila'
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

  // Calculate total approved overtime amount
  const totalApprovedAmount = overtimeRequests
    .filter(r => r.status === 'APPROVED')
    .reduce((sum, r) => sum + Number(r.totalAmount), 0)

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">My Overtime Requests</h1>
        <p className="text-gray-600">View and track your overtime requests and approvals</p>
      </motion.div>

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Note:</strong> Overtime requests require admin approval. Once approved, overtime pay will be included in your payroll.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bisu-purple-deep mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading overtime requests...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-md border-l-4 border-l-gray-400">
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
            <Card className="shadow-md border-l-4 border-l-yellow-500">
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
            <Card className="shadow-md border-l-4 border-l-green-500">
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
            <Card className="shadow-md border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-blue-600">₱{totalApprovedAmount.toFixed(2)}</p>
                  </div>
                  <PhilippinePeso className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
              <CardTitle className="text-bisu-yellow">Overtime Request History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)}>
                <div className="p-4 pb-0">
                  <TabsList>
                    <TabsTrigger value="all">All ({overtimeRequests.length})</TabsTrigger>
                    <TabsTrigger value="PENDING">Pending ({pendingCount})</TabsTrigger>
                    <TabsTrigger value="APPROVED">Approved ({approvedCount})</TabsTrigger>
                    <TabsTrigger value="REJECTED">Rejected ({rejectedCount})</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={selectedFilter} className="m-0">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No {selectedFilter === 'all' ? '' : selectedFilter.toLowerCase()} overtime requests found</p>
                      <p className="text-sm mt-2">Submit overtime requests from your attendance records</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time Range</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Hourly Rate</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.map((request) => (
                            <TableRow key={request.id}>
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
                                <span className="text-sm">₱{Number(request.hourlyRate).toFixed(2)}/hr</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                  <span className="font-semibold text-green-600">₱{Number(request.totalAmount).toFixed(2)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {getStatusBadge(request.status)}
                                  {request.rejectionReason && (
                                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 max-w-xs mt-1">
                                      <AlertCircle className="h-3 w-3 inline mr-1" />
                                      <span className="font-medium">Reason:</span> {request.rejectionReason}
                                    </div>
                                  )}
                                  {request.approvedBy && (
                                    <p className="text-xs text-gray-500">
                                      By {request.approvedBy.firstName} {request.approvedBy.lastName}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-500">
                                  {formatDate(request.createdAt)}
                                </span>
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

          {/* Additional Information */}
          {approvedCount > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Approved Overtime</p>
                    <p className="text-sm text-green-700 mt-1">
                      You have {approvedCount} approved overtime request{approvedCount !== 1 ? 's' : ''} totaling ₱{totalApprovedAmount.toFixed(2)}. 
                      This will be included in your next payroll.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  )
}
