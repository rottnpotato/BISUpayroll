import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertTriangle, X } from "lucide-react"
import { User } from "../types"

interface DeleteEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  isSubmitting: boolean
  onConfirm: () => void
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  user,
  isSubmitting,
  onConfirm
}: DeleteEmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Employee
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the employee
            from the system.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <div className="py-4">
            <div className="p-4 border border-red-200 bg-red-50 rounded-md mb-4">
              <p className="text-sm text-red-700">
                Are you sure you want to delete <span className="font-bold">{user.firstName} {user.lastName}</span>?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Employee ID</Label>
                <p className="font-medium">{user.employeeId}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Department</Label>
                <p className="font-medium">{user.department}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Position</Label>
                <p className="font-medium">{user.position}</p>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
