"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Save, X } from "lucide-react"

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<boolean>
  onDiscard: () => void
  changedSections: string[]
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  changedSections
}: UnsavedChangesDialogProps) {
  const handleSave = async () => {
    const success = await onSave()
    if (success) {
      onClose()
    }
  }

  const handleDiscard = () => {
    onDiscard()
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-bisu-purple-deep">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Unsaved Changes Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            You have unsaved changes in the following sections:
            <ul className="mt-2 space-y-1">
              {changedSections.map((section) => (
                <li key={section} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
                  <span className="font-medium text-bisu-purple-medium">
                    {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              Would you like to save your changes before continuing, or discard them?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={handleDiscard}
            className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
          >
            <X className="h-4 w-4 mr-2" />
            Discard Changes
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave}
            className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
