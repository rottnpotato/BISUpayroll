"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Save, X, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-lg overflow-hidden p-0 border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-gradient-to-br from-white to-orange-50/30"
            >
              {/* Header with warning indicator */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
                
                <DialogHeader className="relative z-10">
                  <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className="p-2 bg-white/20 rounded-full"
                    >
                      <AlertTriangle className="h-6 w-6" />
                    </motion.div>
                    Unsaved Changes Detected
                  </DialogTitle>
                  <DialogDescription className="text-orange-100 mt-2">
                    Your work isn't saved yet. Choose what you'd like to do.
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Modified Configurations:
                  </h4>
                  <ul className="space-y-2">
                    {changedSections.map((section, index) => (
                      <motion.li
                        key={section}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 text-orange-700"
                      >
                        <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="font-medium">
                          {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Tip:</strong> Saving your changes ensures your configurations are properly stored and applied to the payroll system.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="bg-gray-50 p-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDiscard}
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Discard Changes
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white hover:from-bisu-purple-medium hover:to-bisu-purple-deep shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save & Continue
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
