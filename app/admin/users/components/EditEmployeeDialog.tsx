import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { FormData, FormErrors } from "../types"
import { departments, roles, employeeTypes, employeeTypeLabels, employmentStatuses, employmentStatusLabels, positionsByDepartment, positionToSalaryGrade } from "../constants"
import { useEffect, useState } from "react"

interface EditEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: FormData
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void
  errors: FormErrors
  isSubmitting: boolean
  onSubmit: () => void
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  errors,
  isSubmitting,
  onSubmit
}: EditEmployeeDialogProps) {
  const [salarySteps, setSalarySteps] = useState<Array<{ value: number; label: string; rate: number; step: number }>>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Reset initial load flag when dialog opens with new data
  useEffect(() => {
    if (open) {
      setIsInitialLoad(true)
    }
  }, [open])

  // Fetch salary steps when position changes or on initial load
  useEffect(() => {
    if (formData.position) {
      const gradeInfo = positionToSalaryGrade[formData.position]
      if (gradeInfo) {
        // Only update salary grade (always sync this)
        setFormData(prev => ({ ...prev, salaryGrade: gradeInfo.grade.toString() }))
        
        // Fetch available steps for this grade
        fetch(`/api/admin/salary-grades/options?position=${encodeURIComponent(formData.position)}`)
          .then(res => res.json())
          .then(data => {
            setSalarySteps(data)
            
            // On initial load, keep the existing step; otherwise set default if empty
            if (isInitialLoad) {
              setIsInitialLoad(false)
              // If we have existing step data, find the matching rate
              if (formData.salaryStep) {
                const option = data.find((opt: any) => opt.step === parseInt(formData.salaryStep))
                if (option && !formData.dailyRate) {
                  setFormData(prev => ({ ...prev, dailyRate: option.rate.toString() }))
                }
              }
            } else {
              // Not initial load - this means position was changed by user
              // Set default step if no step is selected
              if (!formData.salaryStep) {
                setFormData(prev => ({ ...prev, salaryStep: gradeInfo.defaultStep.toString() }))
                const option = data.find((opt: any) => opt.step === gradeInfo.defaultStep)
                if (option) {
                  setFormData(prev => ({ ...prev, dailyRate: option.rate.toString() }))
                }
              }
            }
          })
          .catch(error => console.error('Failed to fetch salary grade info:', error))
      }
    }
  }, [formData.position])



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-employeeId" className="text-left font-medium">
              Employee ID <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="edit-employeeId" 
              placeholder="BISU-YYYY-XXX" 
              value={formData.employeeId}
              onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
              className={errors.employeeId ? "border-red-500" : ""}
            />
            {errors.employeeId && (
              <p className="text-red-500 text-xs">{errors.employeeId}</p>
            )}
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-firstName" className="text-left font-medium">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="edit-firstName" 
              placeholder="First Name" 
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs">{errors.firstName}</p>
            )}
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-lastName" className="text-left font-medium">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="edit-lastName" 
              placeholder="Last Name" 
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs">{errors.lastName}</p>
            )}
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-email" className="text-left font-medium">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="edit-email" 
              placeholder="email@bisu.edu.ph" 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-password" className="text-left font-medium">
              Password (leave empty to keep current)
            </Label>
            <Input 
              id="edit-password" 
              type="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-role" className="text-left font-medium">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-500 text-xs">{errors.role}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-employeeType" className="text-left font-medium">
                Employee Type
              </Label>
              <Select 
                value={formData.employeeType || undefined} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee type" />
                </SelectTrigger>
                <SelectContent>
                  {employeeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {employeeTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-department" className="text-left font-medium">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => {
                  // Only clear position if department is actually changing
                  if (value !== formData.department) {
                    setFormData(prev => ({ ...prev, department: value, position: "", salaryGrade: "", salaryStep: "", dailyRate: "" }))
                    setIsInitialLoad(false)
                  }
                }}
              >
                <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-red-500 text-xs">{errors.department}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-position" className="text-left font-medium">
                Position <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.position} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, position: value }))
                  setIsInitialLoad(false)
                }}
              >
                <SelectTrigger className={errors.position ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positionsByDepartment[formData.department as keyof typeof positionsByDepartment]?.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.position && (
                <p className="text-red-500 text-xs">{errors.position}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-salaryGrade" className="text-left font-medium">
                Salary Grade
              </Label>
              <Input 
                id="edit-salaryGrade" 
                value={formData.salaryGrade ? `SG ${formData.salaryGrade}` : "Select position first"}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-salaryStep" className="text-left font-medium">
                Step (1-8)
              </Label>
              <Select
                value={formData.salaryStep || ""}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, salaryStep: value }))
                  setIsInitialLoad(false)
                  const selectedStep = salarySteps.find(s => s.value.toString() === value)
                  if (selectedStep) {
                    setFormData(prev => ({ ...prev, dailyRate: selectedStep.rate.toString() }))
                  }
                }}
                disabled={!formData.salaryGrade}
              >
                <SelectTrigger className={errors.salaryStep ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select step" />
                </SelectTrigger>
                <SelectContent align="start">
                  {salarySteps.map((step) => (
                    <SelectItem key={step.value} value={step.value.toString()} className="text-left">
                      {step.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-dailyRate" className="text-left font-medium">
              Daily Rate (editable)
            </Label>
            <Input 
              id="edit-dailyRate" 
              type="number" 
              step="0.01"
              placeholder="Enter daily rate" 
              value={formData.dailyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, dailyRate: e.target.value }))}
              className="border-bisu-purple-light/30"
            />
            <p className="text-xs text-muted-foreground">
              Auto-filled from salary grade, but can be edited
            </p>
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-phone" className="text-left font-medium">
              Phone Number
            </Label>
            <Input 
              id="edit-phone" 
              placeholder="09XXXXXXXXX" 
              value={formData.phone}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                // Only allow input that starts with 0 or is empty
                if (value.length > 0 && value[0] !== '0') {
                  return
                }
                // Only allow second digit to be 9 if first is 0
                if (value.length > 1 && value[0] === '0' && value[1] !== '9') {
                  return
                }
                value = value.slice(0, 11)
                setFormData(prev => ({ ...prev, phone: value }))
              }}
              maxLength={11}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs">{errors.phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must start with 09 (11 digits total)
            </p>
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-status" className="text-left font-medium">
              Employment Status
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employment status" />
              </SelectTrigger>
              <SelectContent>
                {employmentStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {employmentStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-address" className="text-left font-medium">
              Address
            </Label>
            <Textarea 
              id="edit-address" 
              placeholder="Complete address..." 
              value={formData.address || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="resize-none"
              rows={2}
            />
          </div>
          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium text-bisu-purple-deep mb-3">Emergency Contact Information</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 items-center gap-2">
                  <Label htmlFor="edit-emergencyContactName" className="text-left font-medium">
                    Contact Name
                  </Label>
                  <Input 
                    id="edit-emergencyContactName" 
                    placeholder="Full Name" 
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 items-center gap-2">
                  <Label htmlFor="edit-emergencyContactRelationship" className="text-left font-medium">
                    Relationship
                  </Label>
                  <Input 
                    id="edit-emergencyContactRelationship" 
                    placeholder="e.g., Spouse, Parent" 
                    value={formData.emergencyContactRelationship || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-emergencyContactPhone" className="text-left font-medium">
                  Contact Phone
                </Label>
                <Input 
                  id="edit-emergencyContactPhone" 
                  placeholder="09XXXXXXXXX" 
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length > 0 && value[0] !== '0') {
                      return
                    }
                    if (value.length > 1 && value[0] === '0' && value[1] !== '9') {
                      return
                    }
                    value = value.slice(0, 11)
                    setFormData(prev => ({ ...prev, emergencyContactPhone: value }))
                  }}
                  maxLength={11}
                  className={errors.emergencyContactPhone ? "border-red-500" : ""}
                />
                {errors.emergencyContactPhone && (
                  <p className="text-red-500 text-xs">{errors.emergencyContactPhone}</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="edit-notes" className="text-left font-medium">
              Notes (optional)
            </Label>
            <Textarea 
              id="edit-notes" 
              placeholder="Additional notes about this user..." 
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
