"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, Filter, RefreshCcw, Users, CalendarRange, Download, Printer
} from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Report } from '../types'

interface RecentReportsTableProps {
  reports: Report[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedReportType: string
  setSelectedReportType: (type: string) => void
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
  onTestUsers: () => void
}

export const RecentReportsTable = ({
  reports,
  searchTerm,
  setSearchTerm,
  selectedReportType,
  setSelectedReportType,
  dateRange,
  setDateRange,
  onTestUsers
}: RecentReportsTableProps) => {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ready":
        return <Badge className="bg-green-500">Ready</Badge>
      case "processing":
        return <Badge className="bg-yellow-500">Processing</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-bisu-yellow-DEFAULT">Recent Reports</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-purple-light">
              <RefreshCcw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={onTestUsers} className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-purple-light">
              <Users size={16} className="mr-2" />
              Test Users
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow-DEFAULT" />
            <Input
              placeholder="Search reports..."
              className="pl-10 bg-bisu-purple-light text-white placeholder:text-bisu-yellow-DEFAULT/70 border-bisu-yellow-DEFAULT/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger className="w-[180px] bg-bisu-purple-light text-white border-bisu-yellow-DEFAULT/30">
                <Filter size={16} className="mr-2 text-bisu-yellow-DEFAULT" />
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                {["All Types", "Payroll", "Attendance", "Tax", "Expense", "Leave"].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left bg-transparent font-normal text-bisu-yellow-DEFAULT border-bisu-yellow-DEFAULT/30">
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Generated By</TableHead>
              <TableHead>Generated On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  No reports found matching the current filters
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="transition-colors hover:bg-gray-50">
                  <TableCell className="font-medium">{report.id}</TableCell>
                  <TableCell>{report.name}</TableCell>
                  <TableCell className="capitalize">{report.type}</TableCell>
                  <TableCell>{report.generatedBy}</TableCell>
                  <TableCell>{report.generatedOn}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-blue-500"
                        disabled={report.status !== "ready"}
                      >
                        <Download size={16} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-green-500"
                        disabled={report.status !== "ready"}
                      >
                        <Printer size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 