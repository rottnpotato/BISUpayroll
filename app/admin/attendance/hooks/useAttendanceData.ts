import { useState, useEffect } from "react"
import { toast } from "sonner"
import type { AttendanceRecord, AttendanceResponse, SummaryStats, User } from "../types"
import { calculateSummaryStats, buildApiParams } from "../utils"
import { PAGINATION_LIMITS, INITIAL_SUMMARY_STATS } from "../constants"

interface UseAttendanceDataProps {
  currentPage: number
  selectedDate: Date | undefined
  selectedDepartment: string
}

export default function useAttendanceData({
  currentPage,
  selectedDate,
  selectedDepartment
}: UseAttendanceDataProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [summaryStats, setSummaryStats] = useState<SummaryStats>(INITIAL_SUMMARY_STATS)
  const [users, setUsers] = useState<User[]>([])

  const fetchAttendanceRecords = async () => {
    try {
      setIsLoading(true)
      const params = buildApiParams(currentPage, selectedDate, selectedDepartment, PAGINATION_LIMITS.DEFAULT)

      const response = await fetch(`/api/admin/attendance?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records')
      }

      const data: AttendanceResponse = await response.json()
      setRecords(data.records)
      setTotalPages(data.pagination.pages)

      const stats = calculateSummaryStats(data.records, data.pagination.total)
      setSummaryStats(stats)
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      toast.error('Failed to fetch attendance records')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    }
  }

  useEffect(() => {
    fetchAttendanceRecords()
    fetchUsers()
  }, [currentPage, selectedDate, selectedDepartment])

  const refetch = () => {
    fetchAttendanceRecords()
  }

  return {
    isLoading,
    records,
    totalPages,
    summaryStats,
    users,
    refetch
  }
} 