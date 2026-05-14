"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ClipboardPlus, Info, Loader2, Search, CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
  employeeId: string | null
  department: string | null
  position: string | null
}

interface ManualPunchDialogProps {
  onSuccess?: () => void
}

const formatDateKey = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function ManualPunchDialog({ onSuccess }: ManualPunchDialogProps) {
  const [open, setOpen] = useState(false)
  const [employeeQuery, setEmployeeQuery] = useState("")
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null)
  const [isEmployeePopoverOpen, setIsEmployeePopoverOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [morningIn, setMorningIn] = useState("")
  const [morningOut, setMorningOut] = useState("")
  const [afternoonIn, setAfternoonIn] = useState("")
  const [afternoonOut, setAfternoonOut] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        const params = new URLSearchParams({
          page: "1",
          limit: "15",
          search: employeeQuery.trim(),
        })
        const response = await fetch(`/api/admin/users?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to load employees")
        const data = await response.json()
        setEmployees(Array.isArray(data.users) ? data.users : [])
      } catch (error) {
        console.error("Failed to search employees:", error)
        setEmployees([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [employeeQuery, open])

  const resetForm = () => {
    setEmployeeQuery("")
    setEmployees([])
    setSelectedEmployee(null)
    setDate(new Date())
    setMorningIn("")
    setMorningOut("")
    setAfternoonIn("")
    setAfternoonOut("")
    setReason("")
  }

  const handleClose = () => {
    resetForm()
    setOpen(false)
  }

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first.")
      return
    }

    if (!morningIn && !morningOut && !afternoonIn && !afternoonOut) {
      toast.error("Please provide at least one time entry.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/attendance/manual-punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedEmployee.id,
          date: formatDateKey(date),
          morningTimeIn: morningIn || null,
          morningTimeOut: morningOut || null,
          afternoonTimeIn: afternoonIn || null,
          afternoonTimeOut: afternoonOut || null,
          reason: reason.trim() || null,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save manual punches.")
      }

      toast.success(payload.message || "Manual attendance saved.")
      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Manual punch submission failed:", error)
      toast.error(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayName = (employee: EmployeeOption) =>
    `${employee.lastName}, ${employee.firstName}${
      employee.employeeId ? ` (${employee.employeeId})` : ""
    }`

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetForm()
        }
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white">
          <ClipboardPlus className="h-4 w-4 mr-2" />
          Add Manual Punch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Manual Attendance Punch</DialogTitle>
          <DialogDescription>
            Use this when the biometric device is unavailable. Times are recorded in Manila local time and
            the corresponding attendance record is generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Provide at least one time entry. Leave the rest blank if the employee only worked one session.
              Submitting again for the same day will update the existing record without creating duplicate
              punches.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="font-medium">
              Employee <span className="text-red-500">*</span>
            </Label>
            <Popover open={isEmployeePopoverOpen} onOpenChange={setIsEmployeePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  {selectedEmployee ? (
                    <span className="truncate">{displayName(selectedEmployee)}</span>
                  ) : (
                    <span className="text-muted-foreground flex items-center">
                      <Search className="h-4 w-4 mr-2" />
                      Search by name or employee ID...
                    </span>
                  )}
                  {selectedEmployee && (
                    <X
                      className="h-4 w-4 ml-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEmployee(null)
                        setEmployeeQuery("")
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type to search..."
                    value={employeeQuery}
                    onValueChange={setEmployeeQuery}
                  />
                  <CommandList>
                    {isSearching && (
                      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                      </div>
                    )}
                    {!isSearching && employees.length === 0 && (
                      <CommandEmpty>No employees found.</CommandEmpty>
                    )}
                    {!isSearching && employees.length > 0 && (
                      <CommandGroup>
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            value={emp.id}
                            onSelect={() => {
                              setSelectedEmployee(emp)
                              setIsEmployeePopoverOpen(false)
                            }}
                            className="flex flex-col items-start gap-1"
                          >
                            <span className="font-medium">
                              {emp.lastName}, {emp.firstName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {emp.employeeId || "No ID"} • {emp.department || "—"} •{" "}
                              {emp.position || "—"}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedEmployee && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {selectedEmployee.department && (
                  <Badge variant="secondary">{selectedEmployee.department}</Badge>
                )}
                {selectedEmployee.position && (
                  <Badge variant="outline">{selectedEmployee.position}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium">
              Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="manual-morning-in" className="text-sm font-medium text-green-700">
                Morning Time In
              </Label>
              <Input
                id="manual-morning-in"
                type="time"
                value={morningIn}
                onChange={(e) => setMorningIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-morning-out" className="text-sm font-medium text-orange-700">
                Morning Time Out
              </Label>
              <Input
                id="manual-morning-out"
                type="time"
                value={morningOut}
                onChange={(e) => setMorningOut(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-afternoon-in" className="text-sm font-medium text-green-700">
                Afternoon Time In
              </Label>
              <Input
                id="manual-afternoon-in"
                type="time"
                value={afternoonIn}
                onChange={(e) => setAfternoonIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-afternoon-out" className="text-sm font-medium text-orange-700">
                Afternoon Time Out
              </Label>
              <Input
                id="manual-afternoon-out"
                type="time"
                value={afternoonOut}
                onChange={(e) => setAfternoonOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-reason" className="text-sm font-medium">
              Reason / Notes (optional)
            </Label>
            <Textarea
              id="manual-reason"
              rows={2}
              placeholder="e.g. Biometric device offline, employee submitted DTR manually"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Punches"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
