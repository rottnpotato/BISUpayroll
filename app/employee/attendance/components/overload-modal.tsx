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
  DollarSign
} from "lucide-react"
import { AttendanceRecord, OverloadFormData } from "../types"
import { toast } from "sonner"

interface OverloadModalProps {
  isOpen: boolean
  onClose: () => void
  attendanceRecord: AttendanceRecord
  onSuccess?: () => void
}

export function OverloadModal({ 
  isOpen, 
  onClose, 
  attendanceRecord,
  onSuccess
}: OverloadModalProps) {
  const [formData, setFormData] = useState<OverloadFormData>({
    startTime: '',
    endTime: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [overloadRate, setOverloadRate] = useState<number | null>(null)
  const [calculatedHours, setCalculatedHours] = useState<number>(0)
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0)

  // Fetch overload rate on mount
  useEffect(() => {
    if (isOpen) {
      fetchOverloadRate()
    }
  }, [isOpen])

  const fetchOverloadRate = async () => {
    try {
      const response = await fetch('/api/employee/overload/rate')
      if (response.ok) {
        const data = await response.json()
        setOverloadRate(data.rate)
      }
    } catch (error) {
      console.error('Error fetching overload rate:', error)
    }
  }

  // Get the latest time from attendance record
  const getLatestTimeOut = () => {
    const times = [
      attendanceRecord.morningTimeOut,
      attendanceRecord.afternoonTimeOut,
      attendanceRecord.timeOut
    ].filter(Boolean)

    if (times.length === 0) return null

    // Convert time strings to comparable format
    const latestTime = times.sort().pop()
    return latestTime
  }

  const latestTimeOut = getLatestTimeOut()

  // Calculate hours and amount when times change
  useEffect(() => {
    if (formData.startTime && formData.endTime && overloadRate) {
      const hours = calculateHoursDifference(formData.startTime, formData.endTime)
      setCalculatedHours(hours)
      setCalculatedAmount(hours * overloadRate)
    } else {
      setCalculatedHours(0)
      setCalculatedAmount(0)
    }
  }, [formData.startTime, formData.endTime, overloadRate])

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }

    if (formData.startTime && formData.endTime) {
      // Check if start time is after latest time out
      if (latestTimeOut) {
        const latestTimeOnly = latestTimeOut.split(' ')[0] // Get just the time part
        if (formData.startTime < latestTimeOnly) {
          newErrors.startTime = `Overload start time must be after your last time out (${latestTimeOnly})`
        }
      }

      // Check if end time is after start time
      const hours = calculateHoursDifference(formData.startTime, formData.endTime)
      if (hours <= 0) {
        newErrors.endTime = 'End time must be after start time'
      }

      // Check if total hours (regular + overload) exceeds reasonable limit
      const totalHours = attendanceRecord.hours + hours
      if (totalHours > 16) {
        newErrors.endTime = 'Total work hours (including overload) cannot exceed 16 hours per day'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/employee/overload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceId: attendanceRecord.id,
          startTime: formData.startTime,
          endTime: formData.endTime,
          description: formData.description,
          date: attendanceRecord.date
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Overload record submitted successfully')
        onSuccess?.()
        handleClose()
      } else {
        toast.error(data.message || 'Failed to submit overload record')
      }
    } catch (error) {
      console.error('Error submitting overload:', error)
      toast.error('An error occurred while submitting overload record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      startTime: '',
      endTime: '',
      description: ''
    })
    setErrors({})
    setCalculatedHours(0)
    setCalculatedAmount(0)
    onClose()
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-bisu-purple-deep" />
            Add Overload
          </DialogTitle>
          <DialogDescription>
            Record your overload hours for {attendanceRecord.date}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <div className="space-y-1">
                <p>Regular hours: <strong>{formatHours(attendanceRecord.hours)}</strong></p>
                {latestTimeOut && (
                  <p>Last time out: <strong>{latestTimeOut}</strong></p>
                )}
                {overloadRate && (
                  <p>Overload rate: <strong>₱{overloadRate.toFixed(2)}/hr</strong></p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Start Time */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="startTime" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className={errors.startTime ? 'border-red-500' : ''}
            />
            {errors.startTime && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.startTime}
              </p>
            )}
          </motion.div>

          {/* End Time */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="endTime" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              End Time
            </Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className={errors.endTime ? 'border-red-500' : ''}
            />
            {errors.endTime && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.endTime}
              </p>
            )}
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label htmlFor="description">
              Description <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the overload work (e.g., Extra class, Meeting, Event)"
              rows={3}
            />
          </motion.div>

          {/* Calculation Summary */}
          {calculatedHours > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Overload Hours:</span>
                <span className="font-semibold text-green-900">{formatHours(calculatedHours)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Rate per Hour:</span>
                <span className="font-semibold text-green-900">₱{overloadRate?.toFixed(2)}</span>
              </div>
              <div className="border-t border-green-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-900 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Total Amount:
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    ₱{calculatedAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Submit Overload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
