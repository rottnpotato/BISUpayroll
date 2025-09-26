"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Save, Slash, Check } from "lucide-react"
import { philippineHolidays } from "../constants"

type Overrides = { noWorkDays: number[]; workingWeekendDays: number[] }

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]

export function WorkCalendarCard() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [overrides, setOverrides] = useState<Overrides>({ noWorkDays: [], workingWeekendDays: [] })
  const [weekends, setWeekends] = useState<number[]>([])
  const [holidays, setHolidays] = useState<Array<{ id?: string; date: string; day: number; name?: string; type?: string; isRecurring?: boolean }>>([])
  const [workingDaysCount, setWorkingDaysCount] = useState<number>(0)
  const [totalDays, setTotalDays] = useState<number>(31)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

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
      const apiHolidays = (data.month.holidays as Array<{ id?: string; date: string; name?: string; type?: string; isRecurring?: boolean }> )
      if (apiHolidays && apiHolidays.length > 0) {
        const holidayDays = apiHolidays.map(h => ({ ...h, day: new Date(h.date).getUTCDate() }))
        setHolidays(holidayDays)
      } else {
        // Fallback: use default PH holidays for the selected month/year when DB has none
        const fallback = philippineHolidays
          .filter(h => {
            const d = new Date(h.date)
            if (h.isRecurring) return (d.getUTCMonth() + 1) === month
            return (d.getUTCFullYear() === year) && ((d.getUTCMonth() + 1) === month)
          })
          .map(h => {
            const base = new Date(h.date)
            const effective = h.isRecurring ? new Date(Date.UTC(year, base.getUTCMonth(), base.getUTCDate())) : base
            return {
              id: h.id,
              name: h.name,
              type: h.type,
              isRecurring: h.isRecurring,
              date: new Date(Date.UTC(effective.getUTCFullYear(), effective.getUTCMonth(), effective.getUTCDate())).toISOString(),
              day: effective.getUTCDate()
            }
          })
        setHolidays(fallback)
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to load work calendar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [year, month])

  const isWeekend = (day: number) => weekends.includes(day)
  const isHoliday = (day: number) => holidays.some(h => h.day === day)
  const getHolidayForDay = (day: number) => holidays.find(h => h.day === day)
  const isNoWork = (day: number) => overrides.noWorkDays.includes(day)
  const isWorkingWeekend = (day: number) => overrides.workingWeekendDays.includes(day)

  const toggleNoWork = (day: number) => setOverrides(prev => ({ ...prev, noWorkDays: prev.noWorkDays.includes(day) ? prev.noWorkDays.filter(d => d !== day) : [...prev.noWorkDays, day] }))
  const toggleWorkingWeekend = (day: number) => setOverrides(prev => ({ ...prev, workingWeekendDays: prev.workingWeekendDays.includes(day) ? prev.workingWeekendDays.filter(d => d !== day) : [...prev.workingWeekendDays, day] }))

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings/work-calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year, month, ...overrides }) })
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

  const goPrevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else { setMonth(m => m - 1) } }
  const goNextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else { setMonth(m => m + 1) } }

  // Use DayPicker modifiers for visual states instead of fully custom day cells

  const onDayClick = (date?: Date) => {
    if (!date) return
    const day = date.getDate()
    if (isWeekend(day)) toggleWorkingWeekend(day)
    else if (!isHoliday(day)) toggleNoWork(day)
    setSelectedDate(date)
  }

  const weekendWork = overrides.workingWeekendDays.length
  const explicitNoWork = overrides.noWorkDays.length

  return (
    <Card className="shadow-lg border-2 h-full mx-auto max-w-6xl">
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon size={20} />
              Holiday & Work Calendar
            </CardTitle>
            <CardDescription className="text-green-100">Manage holidays and define working days per month</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* <div className="flex flex-wrap items-center gap-3 mb-4">
          <Button variant="outline" onClick={goPrevMonth}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="font-semibold min-w-[180px] text-center">{monthNames[month - 1]} {year}</div>
          <Button variant="outline" onClick={goNextMonth}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (<SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }).map((_, idx) => { const y = now.getFullYear() - 3 + idx; return <SelectItem key={y} value={String(y)}>{y}</SelectItem> })}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              month={new Date(year, month - 1, 1)}
              onMonthChange={(d) => { setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }}
              onDayClick={onDayClick}
              selected={selectedDate}
              onSelect={setSelectedDate as any}
              showOutsideDays
              className="mx-auto"
              classNames={{
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-green-50",
                day_selected: "bg-green-600 text-white hover:bg-green-600",
                day_today: "bg-green-50 text-green-700",
                head_cell: "text-[0.95rem] font-semibold w-12 text-muted-foreground",
                caption_label: "text-sm md:text-base font-semibold",
              }}
              modifiers={{
                holiday: (d) => holidays.some(h => {
                  const hd = new Date(h.date)
                  return hd.getUTCFullYear() === d.getFullYear() && hd.getUTCMonth() === d.getMonth() && hd.getUTCDate() === d.getDate()
                }),
                workingWeekend: (d) => {
                  const dow = d.getDay(); const dn = d.getDate()
                  return (dow === 0 || dow === 6) && overrides.workingWeekendDays.includes(dn)
                },
                weekend: (d) => {
                  const dow = d.getDay(); const dn = d.getDate()
                  const isWknd = (dow === 0 || dow === 6)
                  const isHolidayDate = holidays.some(h => {
                    const hd = new Date(h.date)
                    return hd.getUTCFullYear() === d.getFullYear() && hd.getUTCMonth() === d.getMonth() && hd.getUTCDate() === d.getDate()
                  })
                  return isWknd && !overrides.workingWeekendDays.includes(dn) && !isHolidayDate
                },
                noWork: (d) => {
                  const dow = d.getDay(); const dn = d.getDate()
                  const isHolidayDate = holidays.some(h => {
                    const hd = new Date(h.date)
                    return hd.getUTCFullYear() === d.getFullYear() && hd.getUTCMonth() === d.getMonth() && hd.getUTCDate() === d.getDate()
                  })
                  return (dow !== 0 && dow !== 6) && overrides.noWorkDays.includes(dn) && !isHolidayDate
                },
              }}
              modifiersClassNames={{
                holiday: "bg-red-100 text-red-700 ring-1 ring-red-300",
                workingWeekend: "bg-green-100 text-green-700 ring-1 ring-green-300",
                weekend: "bg-gray-100 text-gray-500",
                noWork: "bg-amber-100 text-amber-700 ring-1 ring-amber-300",
              }}
              footer={
                <div className="flex flex-wrap gap-2 mt-3 text-sm">
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-300 text-xs"><Slash className="h-3 w-3 mr-1" /> Weekend (non-working)</Badge>
                  <Badge className="bg-green-100 text-green-700 border border-green-300 text-xs"><Check className="h-3 w-3 mr-1" /> Weekend marked working</Badge>
                  <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs">Holiday</Badge>
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-xs">No-work override</Badge>
                </div>
              }
            />
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Working days this month</div>
              <div className="text-3xl font-bold">{workingDaysCount}</div>
            </div>
            <div className="space-y-1 text-sm">
              <div>Weekends in month: <span className="font-medium">{weekends.length}</span></div>
              <div>Holidays in month: <span className="font-medium">{holidays.length}</span></div>
              <div>Weekend marked working: <span className="font-medium">{overrides.workingWeekendDays.length}</span></div>
              <div>No-work overrides: <span className="font-medium">{overrides.noWorkDays.length}</span></div>
            </div>
            <Separator />
            {holidays.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Holidays this month</div>
                <div className="max-h-40 overflow-auto pr-1 space-y-2">
                  {holidays
                    .slice()
                    .sort((a, b) => a.day - b.day)
                    .map(h => (
                      <div key={`${h.date}-${h.name}`} className="flex items-center justify-between rounded-md border px-2 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge className={`text-xs capitalize ${h.type?.toLowerCase() === 'regular' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'} border`}>{h.type?.toLowerCase()}</Badge>
                          <div className="truncate">
                            <div className="text-sm font-medium truncate">{h.name || 'Holiday'}</div>
                            <div className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{h.isRecurring ? ' • recurring' : ''}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold ml-2">{h.day}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-600/90 text-white w-full">
                <Save className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} /> {saving ? 'Saving...' : 'Save Overrides'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


