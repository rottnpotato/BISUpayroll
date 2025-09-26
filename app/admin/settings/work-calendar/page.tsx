"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Save, Slash, Check } from "lucide-react"

type Overrides = { noWorkDays: number[]; workingWeekendDays: number[] }

const monthNames = [
  "January","February","March","April","May","June","July","August","September","October","November","December"
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export default function WorkCalendarPage() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [overrides, setOverrides] = useState<Overrides>({ noWorkDays: [], workingWeekendDays: [] })

  const [weekends, setWeekends] = useState<number[]>([])
  const [holidays, setHolidays] = useState<Array<{ date: string; day: number; name?: string; type?: string }>>([])
  const [workingDaysCount, setWorkingDaysCount] = useState<number>(0)
  const [totalDays, setTotalDays] = useState<number>(getDaysInMonth(year, month))

  const selectedMonthLabel = useMemo(() => `${monthNames[month - 1]} ${year}`, [month, year])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ year: String(year), month: String(month), includeAnnual: "false" })
      const res = await fetch(`/api/admin/settings/work-calendar?${params}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const data = json.data
      setOverrides(data.overrides)
      setWeekends(data.month.weekends)
      setTotalDays(data.month.totalDays)
      setWorkingDaysCount(data.month.workingDays)
      const holidayDays = (data.month.holidays as Array<{ date: string; day: number; name?: string; type?: string }> )
        .map(h => ({ ...h, day: new Date(h.date).getUTCDate() }))
      setHolidays(holidayDays)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load work calendar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const isWeekend = (day: number) => weekends.includes(day)
  const isHoliday = (day: number) => holidays.some(h => h.day === day)
  const isNoWork = (day: number) => overrides.noWorkDays.includes(day)
  const isWorkingWeekend = (day: number) => overrides.workingWeekendDays.includes(day)

  const toggleNoWork = (day: number) => {
    setOverrides(prev => {
      const exists = prev.noWorkDays.includes(day)
      return { ...prev, noWorkDays: exists ? prev.noWorkDays.filter(d => d !== day) : [...prev.noWorkDays, day] }
    })
  }

  const toggleWorkingWeekend = (day: number) => {
    setOverrides(prev => {
      const exists = prev.workingWeekendDays.includes(day)
      return { ...prev, workingWeekendDays: exists ? prev.workingWeekendDays.filter(d => d !== day) : [...prev.workingWeekendDays, day] }
    })
  }

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings/work-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, ...overrides })
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Work calendar saved')
      fetchData()
    } catch (e) {
      console.error(e)
      toast.error('Failed to save work calendar')
    } finally {
      setSaving(false)
    }
  }

  const goPrevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else { setMonth(m => m - 1) }
  }
  const goNextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else { setMonth(m => m + 1) }
  }

  const renderDay = (day: number) => {
    const weekend = isWeekend(day)
    const holiday = isHoliday(day)
    const noWork = isNoWork(day)
    const workingWeekend = isWorkingWeekend(day)
    const base = "h-9 w-9 flex items-center justify-center rounded-md text-sm "
    const colors = holiday ? "bg-red-100 text-red-700" : weekend ? (workingWeekend ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500") : (noWork ? "bg-amber-100 text-amber-700" : "")
    return (
      <div className={`${base} ${colors}`}>
        {day}
      </div>
    )
  }

  const onDayClick = (date?: Date) => {
    if (!date) return
    const day = date.getDate()
    if (isWeekend(day)) {
      toggleWorkingWeekend(day)
    } else if (!isHoliday(day)) {
      toggleNoWork(day)
    }
  }

  const workingSummary = useMemo(() => {
    const weekendWork = overrides.workingWeekendDays.length
    const explicitNoWork = overrides.noWorkDays.length
    return { weekendWork, explicitNoWork }
  }, [overrides])

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Work Calendar</h1>
        <p className="text-gray-600">Define working days per month for payroll calculations. Weekends are non-working by default; holidays come from the Holidays config. Click a weekend to mark as working, or a weekday to mark as no-work.</p>
      </div>

      <Card className="shadow-md mb-6">
        <CardHeader className="bg-gradient-to-r from-bisu-yellow to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Period
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={goPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="font-semibold text-bisu-purple-deep min-w-[180px] text-center">{selectedMonthLabel}</div>
            <Button variant="outline" onClick={goNextMonth}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Separator className="mx-2 hidden md:block" orientation="vertical" />
            <div className="flex items-center gap-2">
              <Label className="text-sm">Month</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const y = now.getFullYear() - 3 + idx
                    return <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
          <CardTitle className="text-bisu-yellow flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {selectedMonthLabel} — Working Days
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Calendar
                mode="single"
                month={new Date(year, month - 1, 1)}
                onDayClick={onDayClick}
                selected={undefined}
                showOutsideDays
                components={{}}
                modifiers={{}}
                fromMonth={new Date(year - 5, 0, 1)}
                toMonth={new Date(year + 5, 11, 31)}
                classNames={{ day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100" }}
                footer={
                  <div className="flex flex-wrap gap-2 mt-3 text-sm">
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                      <Slash className="h-3 w-3 mr-1" /> Weekend (non-working)
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border border-green-300 text-xs">
                      <Check className="h-3 w-3 mr-1" /> Weekend marked working
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs">Holiday</Badge>
                    <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-xs">No-work override</Badge>
                  </div>
                }
                render={{
                  Day: ({ date }) => renderDay(date.getDate())
                } as any}
              />
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Working days this month</div>
                <div className="text-3xl font-bold text-bisu-purple-deep">{workingDaysCount}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div>Weekends in month: <span className="font-medium">{weekends.length}</span></div>
                <div>Holidays in month: <span className="font-medium">{holidays.length}</span></div>
                <div>Weekend marked working: <span className="font-medium">{workingSummary.weekendWork}</span></div>
                <div>No-work overrides: <span className="font-medium">{workingSummary.explicitNoWork}</span></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button onClick={save} disabled={saving} className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white w-full">
                  <Save className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                  {saving ? 'Saving...' : 'Save Overrides'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


