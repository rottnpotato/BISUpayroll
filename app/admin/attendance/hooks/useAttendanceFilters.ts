import { useState } from "react"
import type { AttendanceFilters } from "../types"

export default function useAttendanceFilters() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)

  const filters: AttendanceFilters = {
    searchTerm,
    selectedDepartment,
    selectedStatus,
    selectedDate,
    startDate,
    endDate,
    currentPage
  }

  const updateFilters = {
    setSearchTerm,
    setSelectedDepartment,
    setSelectedStatus,
    setSelectedDate,
    setStartDate,
    setEndDate,
    setCurrentPage
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedDepartment("All Departments")
    setSelectedStatus("all")
    setSelectedDate(undefined)
    setStartDate(undefined)
    setEndDate(undefined)
    setCurrentPage(1)
  }

  const clearDateFilter = () => {
    setSelectedDate(undefined)
    setStartDate(undefined)
    setEndDate(undefined)
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    resetFilters()
  }

  const setDateRange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start)
    setEndDate(end)
    setSelectedDate(undefined) // Clear single date when using range
    setCurrentPage(1)
  }

  return {
    filters,
    updateFilters,
    resetFilters,
    clearDateFilter,
    clearAllFilters,
    setDateRange
  }
} 