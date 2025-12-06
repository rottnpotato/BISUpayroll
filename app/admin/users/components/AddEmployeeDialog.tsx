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

interface AddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: FormData
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void
  errors: FormErrors
  isSubmitting: boolean
  onSubmit: () => void
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  errors,
  isSubmitting,
  onSubmit
}: AddEmployeeDialogProps) {
  const [salarySteps, setSalarySteps] = useState<Array<{ value: number; label: string; rate: number }>>([])

  // Auto-select salary grade when position changes
  useEffect(() => {
    if (formData.position) {
      const gradeInfo = positionToSalaryGrade[formData.position]
      if (gradeInfo) {
        setFormData(prev => ({ ...prev, salaryGrade: gradeInfo.grade.toString(), salaryStep: gradeInfo.defaultStep.toString() }))
        // Fetch available steps for this grade
        fetch(`/api/admin/salary-grades/options?position=${encodeURIComponent(formData.position)}`)
          .then(res => res.json())
          .then(data => {
            setSalarySteps(data)
            const defaultOption = data.find((opt: any) => opt.step === gradeInfo.defaultStep)
            if (defaultOption) {
              setFormData(prev => ({ ...prev, dailyRate: defaultOption.rate.toString() }))
            }
          })
          .catch(error => console.error('Failed to fetch salary grade info:', error))
      }
    }
  }, [formData.position, setFormData])



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details of the new employee to add to the system.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="add-firstName" className="text-left font-medium">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="add-firstName" 
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
            <Label htmlFor="add-lastName" className="text-left font-medium">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="add-lastName" 
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
            <Label htmlFor="add-email" className="text-left font-medium">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="add-email" 
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
            <Label htmlFor="add-password" className="text-left font-medium">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="add-password" 
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
              <Label htmlFor="add-role" className="text-left font-medium">
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
              <Label htmlFor="add-employeeType" className="text-left font-medium">
                Employee Type
              </Label>
              <Select 
                value={formData.employeeType} 
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
              <Label htmlFor="add-department" className="text-left font-medium">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value, position: "" }))}
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
              <Label htmlFor="add-position" className="text-left font-medium">
                Position <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.position} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                disabled={!formData.department}
              >
                <SelectTrigger className={errors.position ? "border-red-500" : ""}>
                  <SelectValue placeholder={formData.department ? "Select position" : "Select department first"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.department && positionsByDepartment[formData.department as keyof typeof positionsByDepartment]?.map((position) => (
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
              <Label htmlFor="add-salaryGrade" className="text-left font-medium">
                Salary Grade
              </Label>
              <Input 
                id="add-salaryGrade" 
                value={formData.salaryGrade ? `SG ${formData.salaryGrade}` : "Select position first"}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-salaryStep" className="text-left font-medium">
                Step (1-8)
              </Label>
              <Select
                value={formData.salaryStep || ""}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, salaryStep: value }))
                  const selectedStep = salarySteps.find(s => s.value.toString() === value)
                  if (selectedStep) {
                    setFormData(prev => ({ ...prev, dailyRate: selectedStep.rate.toString() }))
                  }
                }}
                disabled={!formData.salaryGrade}
              >
                <SelectTrigger>
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
            <Label htmlFor="add-dailyRate" className="text-left font-medium">
              Daily Rate (editable)
            </Label>
            <Input 
              id="add-dailyRate" 
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
            <Label htmlFor="add-phone" className="text-left font-medium">
              Phone Number
            </Label>
            <Input 
              id="add-phone" 
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
            <Label htmlFor="add-employeeId" className="text-left font-medium">
              Employee ID <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="add-employeeId" 
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
            <Label htmlFor="add-hireDate" className="text-left font-medium">
              Hire Date
            </Label>
            <Input 
              id="add-hireDate" 
              type="date" 
              value={formData.hireDate}
              onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
              className="border-bisu-purple-light/30"
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="add-status" className="text-left font-medium">
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
            <Label htmlFor="add-salary" className="text-left font-medium">
              Salary (optional)
            </Label>
            <Input 
              id="add-salary" 
              type="number" 
              placeholder="Enter salary" 
              value={formData.salary}
              onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
              className="border-bisu-purple-light/30"
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="add-address" className="text-left font-medium">
              Address (optional)
            </Label>
            <Textarea 
              id="add-address" 
              placeholder="Enter address" 
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="resize-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="add-emergencyContactName" className="text-left font-medium">
              Emergency Contact Name (optional)
            </Label>
            <Input 
              id="add-emergencyContactName" 
              placeholder="Enter emergency contact name" 
              value={formData.emergencyContactName}
              onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
              className="border-bisu-purple-light/30"
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="add-emergencyContactRelationship" className="text-left font-medium">
              Emergency Contact Relationship (optional)
            </Label>
            <Input 
              id="add-emergencyContactRelationship" 
              placeholder="Enter relationship" 
              value={formData.emergencyContactRelationship}
              onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
              className="border-bisu-purple-light/30"
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="add-emergencyContactPhone" className="text-left font-medium">
              Emergency Contact Phone (optional)
            </Label>
            <Input 
              id="add-emergencyContactPhone" 
              placeholder="09XXXXXXXXX" 
              value={formData.emergencyContactPhone}
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
                setFormData(prev => ({ ...prev, emergencyContactPhone: value }))
              }}
              maxLength={11}
              className={errors.emergencyContactPhone ? "border-red-500" : "border-bisu-purple-light/30"}
            />
            {errors.emergencyContactPhone && (
              <p className="text-red-500 text-xs">{errors.emergencyContactPhone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must start with 09 (11 digits total)
            </p>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
