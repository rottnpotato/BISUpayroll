"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  AlertCircle, 
  Info,
  Loader2,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface OvertimeRequest {
  id: string
  startTime: string
  endTime: string
  hoursWorked: number
  hourlyRate: number
  totalAmount: number
  description?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
}

interface OvertimeModalProps {
  isOpen: boolean
  onClose: () => void
  attendanceRecord: {
    id: string
    date: string
    timeIn: string | null
    timeOut: string | null
    hours: number
    morningTimeIn?: string | null
    afternoonTimeOut?: string | null
  }
  existingRequests?: OvertimeRequest[]
  onSuccess?: () => void
}

interface OvertimeFormData {
  startTime: string
  endTime: string
  description: string
}

export function OvertimeModal({ 
  isOpen, 
  onClose, 
  attendanceRecord,
  existingRequests = [],
  onSuccess
}: OvertimeModalProps) {
  const [formData, setFormData] = useState<OvertimeFormData>({
    startTime: '',
    endTime: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hourlyRate, setHourlyRate] = useState<number | null>(null)
  const [calculatedHours, setCalculatedHours] = useState<number>(0)
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0)

  const hasExistingRequest = existingRequests.length > 0

  // Fetch hourly rate on mount
  useEffect(() => {
    if (isOpen) {
      fetchHourlyRate()
    }
  }, [isOpen])

  const fetchHourlyRate = async () => {
    try {
      const response = await fetch('/api/employee/overtime/rate')
      if (response.ok) {
        const data = await response.json()
        setHourlyRate(data.hourlyRate)
      }
    } catch (error) {
      console.error('Error fetching hourly rate:', error)
    }
  }

  // Calculate hours and amount when times change
  useEffect(() => {
    if (formData.startTime && formData.endTime && hourlyRate) {
      const hours = calculateHoursDifference(formData.startTime, formData.endTime)
      setCalculatedHours(hours)
      
      // Calculate overtime pay (1.25x for first 2 hours, 1.5x after)
      let overtimePay = 0
      if (hours <= 2) {
        overtimePay = hours * hourlyRate * 1.25
      } else {
        overtimePay = (2 * hourlyRate * 1.25) + ((hours - 2) * hourlyRate * 1.5)
      }
      setCalculatedAmount(overtimePay)
    } else {
      setCalculatedHours(0)
      setCalculatedAmount(0)
    }
  }, [formData.startTime, formData.endTime, hourlyRate])

  const calculateHoursDifference = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    let diffMinutes = endMinutes - startMinutes
    
    // Handle case where end time is on next day
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60
    }
    
    return diffMinutes / 60
  }

  const formatTimeForDisplay = (timeString: string | null): string => {
    if (!timeString) return 'N/A'
    
    // If it's already formatted (contains AM/PM), return as is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString
    }
    
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return timeString
    }
  }

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }

    if (formData.startTime && formData.endTime) {
      // Check if end time is after start time
      const hours = calculateHoursDifference(formData.startTime, formData.endTime)
      if (hours <= 0) {
        newErrors.endTime = 'End time must be after start time'
      }

      // Check if overtime hours are reasonable (max 4 hours)
      if (hours > 4) {
        newErrors.endTime = 'Overtime cannot exceed 4 hours per day'
      }

      // Check if total hours (regular + overtime) exceeds reasonable limit
      const totalHours = attendanceRecord.hours + hours
      if (totalHours > 14) {
        newErrors.endTime = 'Total work hours (including overtime) cannot exceed 14 hours per day'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date with times to create full timestamps
      const date = new Date(attendanceRecord.date)
      const [startHour, startMin] = formData.startTime.split(':').map(Number)
      const [endHour, endMin] = formData.endTime.split(':').map(Number)

      const startTime = new Date(date)
      startTime.setHours(startHour, startMin, 0, 0)

      const endTime = new Date(date)
      endTime.setHours(endHour, endMin, 0, 0)

      // If end time is before start time, assume it's next day
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1)
      }

      const response = await fetch('/api/employee/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId: attendanceRecord.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: formData.description
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Overtime request submitted successfully')
        onSuccess?.()
        handleClose()
      } else {
        toast.error(data.error || 'Failed to submit overtime request')
      }
    } catch (error) {
      console.error('Error submitting overtime request:', error)
      toast.error('An error occurred while submitting the request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ startTime: '', endTime: '', description: '' })
    setErrors({})
    setCalculatedHours(0)
    setCalculatedAmount(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Request Overtime
          </DialogTitle>
          <DialogDescription>
            Submit overtime request for {new Date(attendanceRecord.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* Existing Overtime Requests */}
          {existingRequests.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Existing Overtime Request for this Date</h3>
                {existingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded-lg p-3 bg-blue-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-sm font-medium">
                            {formatTimeForDisplay(request.startTime)} - {formatTimeForDisplay(request.endTime)}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-xs text-gray-600 ml-5">
                          {formatHours(Number(request.hoursWorked))} @ ₱{Number(request.hourlyRate).toFixed(2)}/hr (OT rates)
                        </div>
                        {request.description && (
                          <div className="text-xs text-gray-500 ml-5 italic">
                            {request.description}
                          </div>
                        )}
                        {request.rejectionReason && (
                          <div className="text-xs text-red-600 ml-5 bg-red-50 p-2 rounded mt-1">
                            <XCircle className="h-3 w-3 inline mr-1" />
                            Reason: {request.rejectionReason}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ₱{Number(request.totalAmount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  You have already submitted an overtime request for this date. Multiple requests per date are not allowed.
                </AlertDescription>
              </Alert>

              <Separator />
            </>
          )}
          {/* Attendance Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm space-y-1">
                <p><strong>Worked Hours:</strong> {attendanceRecord.hours.toFixed(2)} hours</p>
                <p><strong>Morning In:</strong> {formatTimeForDisplay(attendanceRecord.morningTimeIn!)}</p>
                <p><strong>Afternoon Out:</strong> {formatTimeForDisplay(attendanceRecord.afternoonTimeOut!)}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Overtime Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">New Overtime Request</h3>
            <div>
              <Label htmlFor="startTime">Overtime Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={errors.startTime ? 'border-red-500' : ''}
                disabled={hasExistingRequest}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endTime">Overtime End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={errors.endTime ? 'border-red-500' : ''}
                disabled={hasExistingRequest}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Reason for overtime..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={hasExistingRequest}
              />
            </div>
          </div>

          {/* Calculation Summary */}
          {calculatedHours > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <TrendingUp className="h-4 w-4" />
                  Overtime Hours
                </span>
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  {calculatedHours.toFixed(2)} hrs
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <DollarSign className="h-4 w-4" />
                  Estimated Pay
                </span>
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  ₱{calculatedAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 pt-2 border-t border-blue-200 dark:border-blue-800">
                Rate: 1.25× for first 2 hours, 1.5× thereafter
              </p>
            </motion.div>
          )}

          {/* Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Overtime requests require admin approval before payment.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {hasExistingRequest ? 'Close' : 'Cancel'}
          </Button>
          {!hasExistingRequest && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
