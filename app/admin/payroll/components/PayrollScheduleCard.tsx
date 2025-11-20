"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CalendarDays, Plus, Clock, Calendar, Edit, Trash2, MoreVertical, Search, LayoutGrid, List } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import { PayrollSchedule, ScheduleFormData } from "../types"
import { ScheduleDialog } from "./ScheduleDialog"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface PayrollScheduleCardProps {
  schedules: PayrollSchedule[]
  onRefresh: () => void
}

export function PayrollScheduleCard({
  schedules,
  onRefresh
}: PayrollScheduleCardProps) {
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false)
  const [isEditScheduleDialogOpen, setIsEditScheduleDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<PayrollSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [cutoffFilter, setCutoffFilter] = useState<"all" | "bi-monthly" | "monthly" | "weekly">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      }as const,
    },
  }

  const formatDays = (days: number[]) => {
    return days.map(day => {
      if (day === 15 || day === 30) return `${day}th`
      if (day === 31) return "End of Month"
      return `${day}th`
    }).join(", ")
  }

  const formatCutoffType = (type?: string) => {
    switch (type) {
      case 'bi-monthly': return 'Bi-Monthly'
      case 'monthly': return 'Monthly'
      case 'weekly': return 'Weekly'
      default: return 'Bi-Monthly'
    }
  }

  const toOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"]
    const v = n % 100
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
  }

  const formatDateLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  const getNextEventDate = (schedule: PayrollSchedule): { label: string; date: Date | null } => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    if (schedule.cutoffType === "bi-monthly" && schedule.processingDays && schedule.processingDays.length >= 2) {
      const first = schedule.processingDays[0]
      const second = schedule.processingDays[1]

      const candidates: Date[] = []
      const monthsToCheck = [0, 1, 2]
      monthsToCheck.forEach((offset) => {
        const y = currentYear + Math.floor((currentMonth + offset) / 12)
        const m = (currentMonth + offset) % 12
        const lastDay = new Date(y, m + 1, 0).getDate()
        const firstDay = Math.min(Math.max(first, 1), lastDay)
        const secondDay = Math.min(Math.max(second, 1), lastDay)
        candidates.push(new Date(y, m, firstDay))
        candidates.push(new Date(y, m, secondDay))
      })
      const upcoming = candidates.filter(d => d.getTime() > now.getTime()).sort((a, b) => a.getTime() - b.getTime())[0] || null
      return { label: "Next Processing", date: upcoming }
    }

    if (schedule.cutoffType === "monthly" && schedule.payrollReleaseDay) {
      const monthsToCheck = [0, 1]
      const candidates: Date[] = monthsToCheck.map((offset) => {
        const y = currentYear + Math.floor((currentMonth + offset) / 12)
        const m = (currentMonth + offset) % 12
        const lastDay = new Date(y, m + 1, 0).getDate()
        const day = Math.min(Math.max(schedule.payrollReleaseDay!, 1), lastDay)
        return new Date(y, m, day)
      })
      const upcoming = candidates.filter(d => d.getTime() > now.getTime()).sort((a, b) => a.getTime() - b.getTime())[0] || null
      return { label: "Next Generation", date: upcoming }
    }

    if (schedule.cutoffType === "weekly") {
      return { label: "Weekly", date: null }
    }

    return { label: "Next", date: null }
  }

  const filteredSchedules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return schedules.filter((s) => {
      const matchesSearch = term === "" || s.name.toLowerCase().includes(term)
      const matchesCutoff = cutoffFilter === "all" || s.cutoffType === cutoffFilter
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? s.isActive : !s.isActive)
      return matchesSearch && matchesCutoff && matchesStatus
    })
  }, [schedules, searchTerm, cutoffFilter, statusFilter])

  const stats = useMemo(() => {
    const total = schedules.length
    const active = schedules.filter(s => s.isActive).length
    const inactive = total - active
    return { total, active, inactive }
  }, [schedules])

  const handleToggleStatus = async (schedule: PayrollSchedule) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/payroll/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !schedule.isActive
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update schedule status')
      }

      toast.success(`Schedule ${!schedule.isActive ? 'activated' : 'deactivated'} successfully`)
      onRefresh()
    } catch (error) {
      console.error('Error toggling schedule status:', error)
      toast.error('Failed to update schedule status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSchedule = async (formData: ScheduleFormData): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/payroll/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create schedule')
      }

      toast.success('Payroll schedule created successfully')
      onRefresh()
      return true
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create payroll schedule')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSchedule = async (formData: ScheduleFormData): Promise<boolean> => {
    if (!editingSchedule) return false
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/payroll/schedules/${editingSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update schedule')
      }

      toast.success('Payroll schedule updated successfully')
      onRefresh()
      return true
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast.error('Failed to update payroll schedule')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSchedule = async (schedule: PayrollSchedule) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/payroll/schedules/${schedule.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }

      toast.success('Payroll schedule deleted successfully')
      onRefresh()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete payroll schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (schedule: PayrollSchedule) => {
    setEditingSchedule(schedule)
    setIsEditScheduleDialogOpen(true)
  }

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Card className="shadow-lg border-2 h-full flex flex-col">
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays size={20} />
                  Ledger & Attendance Cutoff Schedule
                </CardTitle>
                <CardDescription className="text-white/80">
                  Configure release dates, processing days, and cutoff periods
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddScheduleDialogOpen(true)}
                size="sm"
                className="bg-bisu-yellow text-bisu-purple-deep hover:bg-bisu-yellow-light"
                disabled={isLoading}
              >
                <Plus size={16} className="mr-2" />
                Add Schedule
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-md px-3 py-2">
                <span className="text-xs text-white/70">Total</span>
                <Badge className="bg-white text-bisu-purple-deep hover:bg-white">{stats.total}</Badge>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-md px-3 py-2">
                <span className="text-xs text-white/70">Active</span>
                <Badge className="bg-bisu-yellow text-bisu-purple-deep hover:bg-bisu-yellow">{stats.active}</Badge>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-md px-3 py-2">
                <span className="text-xs text-white/70">Inactive</span>
                <Badge variant="secondary" className="bg-white/20 text-white">{stats.inactive}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 flex-1 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schedules..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={cutoffFilter} onValueChange={(v: any) => setCutoffFilter(v)}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Cutoff" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bi-monthly">Bi-Monthly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1 self-end lg:self-auto">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={viewMode === "grid" ? "bg-bisu-purple-deep hover:bg-bisu-purple-medium" : ""}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className={viewMode === "list" ? "bg-bisu-purple-deep hover:bg-bisu-purple-medium" : ""}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground flex-1 flex flex-col justify-center items-center border border-dashed rounded-lg">
              <Calendar className="h-12 w-12 mb-4 text-bisu-purple-light" />
              <p className="font-medium text-bisu-purple-deep">No schedules configured</p>
              <p className="text-sm mt-1">Create a schedule to manage payroll releases and processing</p>
              <Button
                onClick={() => setIsAddScheduleDialogOpen(true)}
                className="mt-4 bg-bisu-purple-deep hover:bg-bisu-purple-medium"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" /> New Schedule
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
              {filteredSchedules.map((schedule) => {
                const next = getNextEventDate(schedule)
                return (
                  <div
                    key={schedule.id}
                    className="group relative p-4 rounded-lg border bg-white hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-bisu-purple-deep truncate">{schedule.name}</h4>
                          {schedule.isActive ? (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-medium">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full font-medium">Inactive</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {schedule.description || "No description"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.isActive}
                          onCheckedChange={() => handleToggleStatus(schedule)}
                          disabled={isLoading}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(schedule)} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Schedule
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-600 focus:text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Schedule
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Payroll Schedule</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{schedule.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSchedule(schedule)}
                                    className="bg-red-600 hover:bg-red-600/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-bisu-purple-medium" />
                          <span className="font-medium text-gray-700">Cutoff Type</span>
                        </div>
                        <p className="text-gray-600 ml-4">{formatCutoffType(schedule.cutoffType)}</p>
                      </div>

                      {schedule.cutoffType === 'bi-monthly' && schedule.processingDays && schedule.processingDays.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-bisu-purple-medium" />
                            <span className="font-medium text-gray-700">Processing Days</span>
                          </div>
                          <div className="ml-4 space-y-1 text-gray-600">
                            <p className="text-xs">1st–15th: {toOrdinal(schedule.processingDays[0])}</p>
                            <p className="text-xs">16th–30th: {toOrdinal(schedule.processingDays[1])} (next month)</p>
                          </div>
                        </div>
                      ) : schedule.payrollReleaseDay && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-bisu-purple-medium" />
                            <span className="font-medium text-gray-700">Generation Day</span>
                          </div>
                          <p className="text-gray-600 ml-4">{toOrdinal(schedule.payrollReleaseDay)} of month</p>
                        </div>
                      )}

                      {schedule.cutoffDays && schedule.cutoffDays.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-bisu-purple-medium" />
                            <span className="font-medium text-gray-700">Cutoff Days</span>
                          </div>
                          <p className="text-gray-600 ml-4">{formatDays(schedule.cutoffDays)}</p>
                        </div>
                      )}

                      {schedule.employmentStatuses && schedule.employmentStatuses.length > 0 && (
                        <div className="space-y-1 col-span-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-700">Employment Status</span>
                          </div>
                          <div className="flex flex-wrap gap-1 ml-4">
                            {schedule.employmentStatuses.map((status) => (
                              <Badge key={status} variant="outline" className="text-xs">
                                {status === 'PERMANENT' ? 'Permanent' : status === 'TEMPORARY' ? 'Temporary' : 'Contractual'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="text-xs text-bisu-purple-medium flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-bisu-purple-extralight text-bisu-purple-deep">
                          {next.label}{next.date ? `: ${formatDateLabel(next.date)}` : ''}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(schedule)} className="text-bisu-purple-deep">
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleDialog
        isOpen={isAddScheduleDialogOpen}
        onClose={() => setIsAddScheduleDialogOpen(false)}
        onSubmit={handleAddSchedule}
        isLoading={isLoading}
        title="Create Payroll Schedule"
      />

      <ScheduleDialog
        isOpen={isEditScheduleDialogOpen}
        onClose={() => {
          setIsEditScheduleDialogOpen(false)
          setEditingSchedule(null)
        }}
        onSubmit={handleEditSchedule}
        isLoading={isLoading}
        title="Edit Payroll Schedule"
        initialData={editingSchedule}
      />
    </motion.div>
  )
}
