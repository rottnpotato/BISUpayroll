import { useState } from "react"
import type { AttendanceFilters } from "../types"

export default function useAttendanceFilters() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentPage, setCurrentPage] = useState(1)

  const filters: AttendanceFilters = {
    searchTerm,
    selectedDepartment,
    selectedStatus,
    selectedDate,
    currentPage
  }

  const updateFilters = {
    setSearchTerm,
    setSelectedDepartment,
    setSelectedStatus,
    setSelectedDate,
    setCurrentPage
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedDepartment("All Departments")
    setSelectedStatus("all")
    setSelectedDate(undefined)
    setCurrentPage(1)
  }

  const clearDateFilter = () => {
    setSelectedDate(undefined)
    setCurrentPage(1)
  }

  return {
    filters,
    updateFilters,
    resetFilters,
    clearDateFilter
  }
} 