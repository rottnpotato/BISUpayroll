"use client"

import { useState, useEffect, useCallback } from 'react'
import { Report } from '../types'
import { DateRange } from "react-day-picker"

export const useReportsState = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReportType, setSelectedReportType] = useState("All Types")
  const [selectedTab, setSelectedTab] = useState("recent")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  })
  const [templateDateRanges, setTemplateDateRanges] = useState<Record<string, DateRange | undefined>>({})
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedEmploymentStatus, setSelectedEmploymentStatus] = useState("all")

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/reports')
        if (response.ok) {
          const data = await response.json()
          setReports(data.reports || [])
        } else {
          console.error('Failed to fetch reports')
          setReports([])
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [])

  const updateTemplateDateRange = useCallback((templateId: string, range: DateRange | undefined) => {
    setTemplateDateRanges(prev => ({
      ...prev,
      [templateId]: range
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedReportType("All Types")
    setDateRange({ from: undefined, to: undefined })
  }, [])

  return {
    isLoading,
    reports,
    searchTerm,
    setSearchTerm,
    selectedReportType,
    setSelectedReportType,
    selectedTab,
    setSelectedTab,
    dateRange,
    setDateRange,
    templateDateRanges,
    setTemplateDateRanges,
    updateTemplateDateRange,
    selectedDepartment,
    setSelectedDepartment,
    selectedEmploymentStatus,
    setSelectedEmploymentStatus,
    resetFilters
  }
} 