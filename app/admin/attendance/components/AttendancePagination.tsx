"use client"

import { Button } from "@/components/ui/button"

interface AttendancePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function AttendancePagination({
  currentPage,
  totalPages,
  onPageChange
}: AttendancePaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center gap-2 p-4">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
} 