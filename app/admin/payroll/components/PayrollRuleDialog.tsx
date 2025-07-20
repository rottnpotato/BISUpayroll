"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PayrollFormData, User } from "../types"

interface PayrollRuleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => Promise<boolean>
  formData: PayrollFormData
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectChange: (field: string, value: string) => void
  onUserSelection: (userId: string, checked: boolean) => void
  onSelectAllUsers: (checked: boolean) => void
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
  users,
  isUsersLoading,
  isEdit = false,
  title
}: PayrollRuleDialogProps) {

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
            {title || (isEdit ? "Edit Payroll Rule" : "Add New Payroll Rule")}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the payroll rule details below." 
              : "Create a new payroll rule for salary calculations."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name *</Label>
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
              <Label htmlFor="type">Rule Type *</Label>
              <Select value={formData.type} onValueChange={handleSelectChange("type")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Base Pay</SelectItem>
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
                  <SelectItem value="base_pay">Base Pay</SelectItem>
                  <SelectItem value="overtime">Overtime</SelectItem>
                  <SelectItem value="differential">Differential</SelectItem>
                  <SelectItem value="holiday_pay">Holiday Pay</SelectItem>
                  <SelectItem value="mandatory_contribution">Mandatory Contribution</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="mandatory_benefit">Mandatory Benefit</SelectItem>
                  <SelectItem value="leave_benefit">Leave Benefit</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
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
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {isUsersLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading employees...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No employees found</div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                        <Checkbox
                          id="selectAll"
                          checked={formData.selectedUserIds.length === users.length}
                          onCheckedChange={(checked) => onSelectAllUsers(!!checked)}
                        />
                        <Label htmlFor="selectAll" className="font-medium">
                          Select All ({users.length} employees)
                        </Label>
                      </div>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {users.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={formData.selectedUserIds.includes(user.id)}
                                onCheckedChange={(checked) => onUserSelection(user.id, !!checked)}
                              />
                              <Label htmlFor={`user-${user.id}`} className="text-sm">
                                {user.firstName} {user.lastName}
                                {user.employeeId && (
                                  <span className="text-gray-500 ml-1">({user.employeeId})</span>
                                )}
                                {user.department && (
                                  <span className="text-gray-500 ml-1">- {user.department}</span>
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
            {isEdit ? "Update Rule" : "Add Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
