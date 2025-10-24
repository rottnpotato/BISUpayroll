"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { AttendanceRecord } from "../types"
import { formatTime, formatHours } from "../utils"

interface AttendanceTableProps {
  records: AttendanceRecord[]
  onApprovalAction?: (id: string, action: any) => void // Kept for backward compatibility but not used
}

const getStatusBadge = (record: AttendanceRecord) => {
  if (record.isAbsent) {
    return <Badge className="bg-red-500">Absent</Badge>
  }
  if (record.timeIn && record.isLate) {
    return <Badge className="bg-yellow-500">Late</Badge>
  }
  if (record.timeIn) {
    return <Badge className="bg-green-500">Present</Badge>
  }
  return <Badge className="bg-gray-500">No Data</Badge>
}

export default function AttendanceTable({ records }: AttendanceTableProps) {
  // Debug logging
  console.log('AttendanceTable received records:', {
    count: records.length,
    firstRecord: records[0] || null,
    allRecords: records
  })

  if (records.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date</TableHead>
            <TableHead colSpan={2} className="text-center">Morning</TableHead>
            <TableHead colSpan={2} className="text-center">Afternoon</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hours Worked</TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={10} className="text-center py-10 text-gray-500">
              No attendance records found matching the current filters
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  // Ensure most recent days appear first in the UI
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date</TableHead>
            <TableHead colSpan={2} className="text-center text-green-500">Morning</TableHead>
            <TableHead colSpan={2} className="text-center text-orange-500 ">Afternoon</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hours Worked</TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
              <TableHead></TableHead>
     
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead className="text-xs text-gray-500">In</TableHead>
            <TableHead className="text-xs text-gray-500">Out</TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRecords.map((record) => (
            <TableRow key={record.id} className="transition-colors hover:bg-gray-50">
              <TableCell className="font-medium">{record.user.employeeId}</TableCell>
              <TableCell>{`${record.user.firstName} ${record.user.lastName}`}</TableCell>
              <TableCell>{record.user.department}</TableCell>
              {/*spell out the date format ex: May 1, 2023 */}
              <TableCell>{format(new Date(record.date), 'MMMM d, yyyy')}</TableCell>
              <TableCell className="text-green-600">{formatTime(record.morningTimeIn ?? null)}</TableCell>
              <TableCell className="text-orange-600">{formatTime(record.morningTimeOut ?? null)}</TableCell>
              <TableCell className="text-green-600">{formatTime(record.afternoonTimeIn ?? null)}</TableCell>
              <TableCell className="text-orange-600">{formatTime(record.afternoonTimeOut ?? null)}</TableCell>
              <TableCell>{getStatusBadge(record)}</TableCell>
              <TableCell>{formatHours(record.hoursWorked)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
