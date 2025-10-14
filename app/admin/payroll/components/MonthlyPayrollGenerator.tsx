"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, CalendarRange, FileText, RefreshCcw, ToggleLeft, ToggleRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"
import type { PayrollSchedule } from "../types"

interface MonthlyPayrollGeneratorProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  selectedDepartment: string
  onDepartmentChange: (department: string) => void
  selectedEmploymentStatus: string
  onEmploymentStatusChange: (status: string) => void
  onGenerate: () => void
  isGenerating: boolean
  schedules?: PayrollSchedule[]
}

export function MonthlyPayrollGenerator({
  dateRange,
  onDateRangeChange,
  selectedDepartment,
  onDepartmentChange,
  selectedEmploymentStatus,
  onEmploymentStatusChange,
  onGenerate,
  isGenerating,
  schedules,
}: MonthlyPayrollGeneratorProps) {
  const [useScheduleRange, setUseScheduleRange] = useState(false)
  const [monthPreset, setMonthPreset] = useState<"this" | "last">("this")
  const [halfPreset, setHalfPreset] = useState<"first" | "second">("first")
  const [quickMonthPreset, setQuickMonthPreset] = useState<"this" | "last">("this")

  const activeSchedule = useMemo(() => schedules?.find(s => s.isActive) || null, [schedules])

  const displayLabel = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "LLL dd, yyyy")} - ${format(dateRange.to, "LLL dd, yyyy")}`
    }
    if (dateRange?.from) return format(dateRange.from, "LLL dd, yyyy")
    return "Select pay period"
  }, [dateRange])

  const setThisMonth = () => {
    const now = new Date()
    onDateRangeChange({ from: startOfMonth(now), to: endOfMonth(now) })
    setQuickMonthPreset("this")
  }

  const setLastMonth = () => {
    const prev = subMonths(new Date(), 1)
    onDateRangeChange({ from: startOfMonth(prev), to: endOfMonth(prev) })
    setQuickMonthPreset("last")
  }

  const computeScheduleRange = (presetMonth: "this" | "last", presetHalf: "first" | "second") => {
    // Fallbacks if no schedule: assume bi-monthly semantics
    const scheduleType = activeSchedule?.cutoffType || "bi-monthly"
    const base = presetMonth === "this" ? new Date() : subMonths(new Date(), 1)
    const fromMonthStart = startOfMonth(base)
    const toMonthEnd = endOfMonth(base)

    if (scheduleType === "monthly") {
      return { from: fromMonthStart, to: toMonthEnd }
    }

    // bi-monthly or unknown -> split halves
    if (presetHalf === "first") {
      return {
        from: new Date(fromMonthStart.getFullYear(), fromMonthStart.getMonth(), 1),
        to: new Date(fromMonthStart.getFullYear(), fromMonthStart.getMonth(), 15, 23, 59, 59, 999)
      }
    } else {
      return {
        from: new Date(fromMonthStart.getFullYear(), fromMonthStart.getMonth(), 16),
        to: toMonthEnd
      }
    }
  }

  useEffect(() => {
    if (useScheduleRange) {
      const range = computeScheduleRange(monthPreset, halfPreset)
      onDateRangeChange(range)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useScheduleRange, monthPreset, halfPreset, activeSchedule])

  return (
    <div className="w-full overflow-hidden rounded-xl border border-bisu-yellow/30 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-bisu-purple-extralight via-white to-white">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-bisu-purple-deep/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-bisu-purple-deep" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-bisu-purple-deep">Monthly Payroll Generator</h3>
              <p className="text-sm text-gray-700">Generate payroll with attendance-based calculations. Filter by department and pick date range manually or from the active payroll schedule.</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="inline-flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={setLastMonth}
                className={`px-3 py-1.5 text-sm ${quickMonthPreset === 'last' ? 'bg-bisu-purple-deep text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={setThisMonth}
                className={`px-3 py-1.5 text-sm border-l ${quickMonthPreset === 'this' ? 'bg-bisu-purple-deep text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                This Month
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-700 font-medium">Payroll Period</p>
              <button
                type="button"
                onClick={() => setUseScheduleRange(v => !v)}
                className="text-xs inline-flex items-center gap-1 text-bisu-purple-deep hover:text-bisu-purple-medium"
                title="Toggle between manual date selection and schedule-based range"
              >
                {useScheduleRange ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {useScheduleRange ? "Using schedule range" : "Manual selection"}
              </button>
            </div>

            {!useScheduleRange ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {displayLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={onDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <div className="rounded-lg border p-3 bg-white">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="font-medium text-bisu-purple-deep">{activeSchedule ? `${activeSchedule.name} (${activeSchedule.cutoffType || 'bi-monthly'})` : 'No active schedule found'}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Month:</span>
                    <div className="inline-flex rounded-md border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setMonthPreset("last")}
                        className={`px-3 py-1.5 text-xs ${monthPreset === 'last' ? 'bg-bisu-purple-deep text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Last
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonthPreset("this")}
                        className={`px-3 py-1.5 text-xs border-l ${monthPreset === 'this' ? 'bg-bisu-purple-deep text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        This
                      </button>
                    </div>
                  </div>
                  {(activeSchedule?.cutoffType !== 'monthly') && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Period:</span>
                      <div className="inline-flex rounded-md border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setHalfPreset("first")}
                          className={`px-3 py-1.5 text-xs ${halfPreset === 'first' ? 'bg-bisu-purple-deep text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          1st–15th
                        </button>
                        <button
                          type="button"
                          onClick={() => setHalfPreset("second")}
                          className={`px-3 py-1.5 text-xs border-l ${halfPreset === 'second' ? 'bg-bisu-purple-deep text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          16th–End
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  Range: <span className="font-medium text-gray-800">{displayLabel}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-700 mb-2">Department (Optional)</p>
            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="CCIS">CCIS</SelectItem>
                <SelectItem value="CTAS">CTAS</SelectItem>
                <SelectItem value="CCJ">CCJ</SelectItem>
                <SelectItem value="CTE">CTE</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4">
              <p className="text-xs text-gray-700 mb-2">Employment Status</p>
              <Select value={selectedEmploymentStatus} onValueChange={onEmploymentStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="TEMPORARY">Temporary</SelectItem>
                  <SelectItem value="CONTRACTUAL">Contractual</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            className="min-w-[200px] bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Payroll
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
