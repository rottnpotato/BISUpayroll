"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, RefreshCcw, FileDown, Calendar as CalendarIcon, X, CalendarRange } from "lucide-react"
import { format } from "date-fns"
import { DEPARTMENTS, ATTENDANCE_STATUSES } from "../constants"
import type { AttendanceFilters } from "../types"

interface AttendanceFiltersProps {
  filters: AttendanceFilters
  onFiltersChange: {
    setSearchTerm: (term: string) => void
    setSelectedDepartment: (dept: string) => void
    setSelectedStatus: (status: string) => void
    setSelectedDate: (date: Date | undefined) => void
    setStartDate: (date: Date | undefined) => void
    setEndDate: (date: Date | undefined) => void
  }
  onRefresh: () => void
  onExport: () => void
  onClearDate: () => void
  onClearAllFilters: () => void
  onDateRangeChange: (start: Date | undefined, end: Date | undefined) => void
}

export default function AttendanceFilters({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  onClearDate,
  onClearAllFilters,
  onDateRangeChange
}: AttendanceFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4">
        <div className="flex items-center  flex-wrap gap-2">
          {/* Single Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-transparent text-bisu-yellow border-bisu-yellow/30 hover:bg-bisu-yellow-light">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.selectedDate ? format(filters.selectedDate, 'PPP') : <span>Single Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-3">
                <Calendar
                  mode="single"
                  selected={filters.selectedDate}
                  onSelect={(date) => {
                    onFiltersChange.setSelectedDate(date)
                    // Clear date range when using single date
                    if (date && (filters.startDate || filters.endDate)) {
                      onDateRangeChange(undefined, undefined)
                    }
                  }}
                  initialFocus
                />
                {filters.selectedDate && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={onClearDate}
                  >
                    Clear Date Filter
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal bg-transparent text-bisu-yellow border-bisu-yellow/30 hover:bg-bisu-yellow-light">
                <CalendarRange className="mr-2 h-4 w-4" />
                {filters.startDate && filters.endDate ? 
                  `${format(filters.startDate, 'MMM dd')} - ${format(filters.endDate, 'MMM dd')}` : 
                  <span>Date Range</span>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-3 space-y-3">
                <div className="text-sm font-medium">Select Start Date:</div>
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => {
                    onFiltersChange.setStartDate(date)
                    // Clear single date when using date range
                    if (date && filters.selectedDate) {
                      onFiltersChange.setSelectedDate(undefined)
                    }
                  }}
                  initialFocus
                />
                {filters.startDate && (
                  <>
                    <div className="text-sm font-medium">Select End Date:</div>
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => {
                        onFiltersChange.setEndDate(date)
                        // Clear single date when using date range
                        if (date && filters.selectedDate) {
                          onFiltersChange.setSelectedDate(undefined)
                        }
                      }}
                      disabled={(date) => date < filters.startDate!}
                    />
                  </>
                )}
                {filters.startDate && filters.endDate && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={() => onDateRangeChange(undefined, undefined)}
                  >
                    Clear Date Range
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear All Filters Button */}
          <Button 
            variant="outline" 
            className="text-bisu-yellow bg-transparent border-bisu-yellow hover:bg-bisu-yellow-light"
            onClick={onClearAllFilters}
          >
            <X size={16} className="mr-2" />
            Clear All
          </Button>
          <Button 
            variant="outline" 
            className="text-bisu-yellow bg-transparent border-bisu-yellow hover:bg-bisu-yellow-light"
            onClick={onRefresh}
          >
            <RefreshCcw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="text-bisu-yellow bg-transparent border-bisu-yellow hover:bg-bisu-yellow-light"
            onClick={onExport}
          >
            <FileDown size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow" />
          <Input
            placeholder="Search by name, ID, or department..."
            className="pl-10 bg-bisu-purple-light text-white placeholder:text-bisu-yellow/70 border-bisu-yellow/30"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange.setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filters.selectedDepartment} onValueChange={onFiltersChange.setSelectedDepartment}>
            <SelectTrigger className="w-[180px] bg-bisu-purple-light text-white border-bisu-yellow/30">
              <Filter size={16} className="mr-2 text-bisu-yellow" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tabs value={filters.selectedStatus} onValueChange={onFiltersChange.setSelectedStatus} className="w-[300px]">
            <TabsList className="bg-bisu-purple-light border-bisu-yellow/30 text-bisu-yellow-light hover:text-bisu-yellow">
              {ATTENDANCE_STATUSES.map((status) => (
                <TabsTrigger 
                  key={status.value}
                  value={status.value} 
                  className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
                >
                  {status.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 