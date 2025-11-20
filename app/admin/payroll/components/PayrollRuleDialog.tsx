"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter } from "lucide-react"
import { PayrollFormData, User } from "../types"
import { useState, useMemo } from "react"

interface PayrollRuleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => Promise<boolean>
  formData: PayrollFormData
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectChange: (field: string, value: string) => void
  onUserSelection: (userId: string, checked: boolean) => void
  onSelectAllUsers: (checked: boolean) => void
  onBulkUserSelection?: (userIds: string[], checked: boolean) => void
  users: User[]
  isUsersLoading: boolean
  isEdit?: boolean
  title?: string
}

export function PayrollRuleDialog({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  onSelectChange,
  onUserSelection,
  onSelectAllUsers,
  onBulkUserSelection,
  users,
  isUsersLoading,
  isEdit = false,
  title
}: PayrollRuleDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const departments = useMemo(() => 
    Array.from(new Set(users.map(u => u.department).filter(Boolean) as string[])).sort(),
    [users]
  )

  const statuses = useMemo(() => 
    Array.from(new Set(users.map(u => u.status).filter(Boolean) as string[])).sort(),
    [users]
  )

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = (
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [users, searchTerm, departmentFilter, statusFilter])

  const areAllFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(user => formData.selectedUserIds.includes(user.id))

  const handleSelectAllFiltered = (checked: boolean) => {
    if (onBulkUserSelection) {
      onBulkUserSelection(filteredUsers.map(u => u.id), checked)
    } else {
      if (searchTerm === "" && departmentFilter === "all" && statusFilter === "all") {
        onSelectAllUsers(checked)
      } else {
        filteredUsers.forEach(user => onUserSelection(user.id, checked))
      }
    }
  }

  const handleSubmit = async () => {
    const success = await onSubmit()
    if (success) {
      onClose()
    }
  }

  const handleSelectChange = (field: string) => (value: string) => {
    onSelectChange(field, value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (isEdit ? "Edit Payroll Calculation" : "Add New Payroll Calculation")}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the payroll calculation details below." 
              : "Create a new payroll calculation item for salary computations."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Calculation Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={onFormChange}
                placeholder="e.g., Basic Salary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Calculation Type *</Label>
              <Select value={formData.type} onValueChange={handleSelectChange("type")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_rate">Daily Rate</SelectItem>
                  <SelectItem value="additional">Additional Income</SelectItem>
                  <SelectItem value="deduction">Deduction</SelectItem>
                  <SelectItem value="tax">Tax & Benefits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={onFormChange}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={handleSelectChange("category")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_rate">Daily Rate</SelectItem>
                  <SelectItem value="overtime">Overtime</SelectItem>
                  <SelectItem value="differential">Differential</SelectItem>
                  <SelectItem value="holiday_pay">Holiday Pay</SelectItem>
                  <SelectItem value="mandatory_contribution">Mandatory Contribution</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="mandatory_benefit">Mandatory Benefit</SelectItem>
                  <SelectItem value="leave_benefit">Leave Benefit</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="loan">Loan Deduction</SelectItem>
                  <SelectItem value="undertime">Undertime Deduction</SelectItem>
                  <SelectItem value="allowance">Allowance</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPercentage"
              name="isPercentage"
              checked={formData.isPercentage}
              onCheckedChange={(checked) => 
                onFormChange({
                  target: { name: "isPercentage", type: "checkbox", checked }
                } as any)
              }
            />
            <Label htmlFor="isPercentage">This is a percentage value</Label>
          </div>

          <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onFormChange as any}
              placeholder="Describe the purpose and calculation of this rule..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Minimum Amount (Optional)</Label>
              <Input
                id="minAmount"
                name="minAmount"
                type="number"
                step="0.01"
                value={formData.minAmount}
                onChange={onFormChange}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Maximum Amount (Optional)</Label>
              <Input
                id="maxAmount"
                name="maxAmount"
                type="number"
                step="0.01"
                value={formData.maxAmount}
                onChange={onFormChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="applyToAll"
                name="applyToAll"
                checked={formData.applyToAll}
                onCheckedChange={(checked) => 
                  onFormChange({
                    target: { name: "applyToAll", type: "checkbox", checked }
                  } as any)
                }
              />
              <Label htmlFor="applyToAll">Apply to all employees</Label>
            </div>

            {!formData.applyToAll && (
              <div className="space-y-3">
                <Label>Select Employees</Label>
                
                <div className="flex flex-col gap-3 mb-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  {isUsersLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading employees...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No employees found matching filters</div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                        <Checkbox
                          id="selectAll"
                          checked={areAllFilteredSelected}
                          onCheckedChange={(checked) => handleSelectAllFiltered(!!checked)}
                        />
                        <Label htmlFor="selectAll" className="font-medium">
                          Select All ({filteredUsers.length} employees)
                        </Label>
                      </div>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {filteredUsers.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={formData.selectedUserIds.includes(user.id)}
                                onCheckedChange={(checked) => onUserSelection(user.id, !!checked)}
                              />
                              <Label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer">
                                {user.firstName} {user.lastName}
                                {user.employeeId && (
                                  <span className="text-gray-500 ml-1">({user.employeeId})</span>
                                )}
                                {user.department && (
                                  <span className="text-gray-500 ml-1">- {user.department}</span>
                                )}
                                {user.status && (
                                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded ml-2 text-gray-600">{user.status}</span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "Update Calculation" : "Add Calculation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
