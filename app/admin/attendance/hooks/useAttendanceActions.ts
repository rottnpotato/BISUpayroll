import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { AttendanceApprovalAction } from "../types"
import { buildApiParams, exportToJson } from "../utils"
import { PAGINATION_LIMITS } from "../constants"

interface UseAttendanceActionsProps {
  selectedDate: Date | undefined
  selectedDepartment: string
  onRefetch: () => void
}

export default function useAttendanceActions({
  selectedDate,
  selectedDepartment,
  onRefetch
}: UseAttendanceActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprovalAction = async (id: string, action: AttendanceApprovalAction) => {
    try {
      setIsProcessing(true)
      
      const response = await fetch(`/api/admin/attendance/${id}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${action.action} attendance record`)
      }

      const result = await response.json()
      onRefetch()
      
      return result
    } catch (error) {
      console.error(`Error ${action.action}ing attendance record:`, error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const exportAttendance = async () => {
    try {
      const params = buildApiParams(1, selectedDate, selectedDepartment, PAGINATION_LIMITS.EXPORT)
      const response = await fetch(`/api/admin/attendance?${params}`)
      const data = await response.json()
      
      const exportFileDefaultName = `attendance-${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all'}.json`
      exportToJson(data.records, exportFileDefaultName)
      
      toast.success('Attendance data exported successfully')
    } catch (error) {
      console.error('Error exporting attendance:', error)
      toast.error('Failed to export attendance data')
    }
  }

  return {
    handleApprovalAction,
    exportAttendance,
    isProcessing
  }
} 