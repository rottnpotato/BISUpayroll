"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { motion } from "framer-motion"
import { filterAttendanceRecords } from "./utils"
import { 
  useAttendanceData, 
  useAttendanceActions, 
  useAttendanceFilters 
} from "./hooks"
import {
  AttendanceStatsCards,
  AttendanceTable,
  AttendanceFilters,
  AttendancePagination,
  AttendanceImportDialog
} from "./components"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
} as const

export default function AttendancePage() {
  const { filters, updateFilters, clearDateFilter, clearAllFilters, setDateRange } = useAttendanceFilters()
  
  const { isLoading, records, totalPages, summaryStats, refetch } = useAttendanceData({
    currentPage: filters.currentPage,
    selectedDate: filters.selectedDate,
    selectedDepartment: filters.selectedDepartment,
    startDate: filters.startDate,
    endDate: filters.endDate
  })

  const {
    handleApprovalAction,
    exportAttendance,
    isProcessing
  } = useAttendanceActions({
    selectedDate: filters.selectedDate,
    selectedDepartment: filters.selectedDepartment,
    startDate: filters.startDate,
    endDate: filters.endDate,
    onRefetch: refetch
  })

  const filteredRecords = filterAttendanceRecords(
    records,
    filters.searchTerm,
    filters.selectedStatus
  )

  // Debug logging
  console.log('Admin Attendance Debug:', {
    isLoading,
    records: records.length,
    filteredRecords: filteredRecords.length,
    filters,
    summaryStats
  })

  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Attendance Monitoring</h1>
            <p className="text-gray-600">Track employee attendance and time records</p>
          </div>
          <AttendanceImportDialog onImportComplete={refetch} />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <SkeletonCard hasHeader={false} lines={2} />
          <div className="lg:col-span-4">
            <SkeletonCard lines={8} />
          </div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AttendanceStatsCards stats={summaryStats} />

          <motion.div variants={itemVariants}>
            <Card className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg pb-4">
                {/* <CardTitle className="text-bisu-yellow mb-4">Attendance Records</CardTitle> */}
                
                <AttendanceFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                  onRefresh={refetch}
                  onExport={exportAttendance}
                  onClearDate={clearDateFilter}
                  onClearAllFilters={clearAllFilters}
                  onDateRangeChange={setDateRange}
                />
              </CardHeader>
              <CardContent className="p-0">
                <AttendanceTable
                  records={filteredRecords}
                  onApprovalAction={handleApprovalAction}
                />

                <AttendancePagination
                  currentPage={filters.currentPage}
                  totalPages={totalPages}
                  onPageChange={updateFilters.setCurrentPage}
                />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}


    </div>
  )
}