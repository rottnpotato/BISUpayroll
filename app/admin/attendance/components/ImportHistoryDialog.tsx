"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Trash2, FileText, User, Calendar, Database, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface ImportBatch {
  id: string
  fileName: string
  fileSize: number | null
  uploadedAt: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  recordCount: number
  punchCount: number
}

interface ImportHistoryDialogProps {
  onImportReverted?: () => void
}

export function ImportHistoryDialog({ onImportReverted }: ImportHistoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null)
  const [showRevertDialog, setShowRevertDialog] = useState(false)
  const [isReverting, setIsReverting] = useState(false)
  const [revertResult, setRevertResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)

  useEffect(() => {
    if (open) {
      fetchImportHistory()
    }
  }, [open])

  const fetchImportHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/attendance/import/history?limit=50')
      const data = await response.json()
      
      if (data.success) {
        setBatches(data.batches)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch import history",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching import history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch import history",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevertClick = (batch: ImportBatch) => {
    setSelectedBatch(batch)
    setShowRevertDialog(true)
  }

  const handleRevertConfirm = async () => {
    if (!selectedBatch) return

    setIsReverting(true)
    try {
      const response = await fetch(`/api/admin/attendance/import/${selectedBatch.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove the batch from the list
        setBatches(batches.filter(b => b.id !== selectedBatch.id))
        
        // Notify parent component
        onImportReverted?.()
        
        // Show success dialog
        setRevertResult({
          success: true,
          message: data.message || "Import batch successfully reverted"
        })
      } else {
        // Show error dialog
        setRevertResult({
          success: false,
          message: data.message || "Failed to revert import"
        })
      }
    } catch (error) {
      console.error("Error reverting import:", error)
      // Show error dialog
      setRevertResult({
        success: false,
        message: "An unexpected error occurred while reverting the import"
      })
    } finally {
      setIsReverting(false)
      setShowRevertDialog(false)
      setShowResultDialog(true)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(2)} KB`
    return `${(kb / 1024).toFixed(2)} MB`
  }

  const handleResultDialogClose = () => {
    setShowResultDialog(false)
    setSelectedBatch(null)
    setRevertResult(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <History className="h-4 w-4 mr-2" />
            Import History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Attendance Import History
            </DialogTitle>
            <DialogDescription>
              View and manage previous attendance imports. You can revert any import to delete all associated records.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bisu-purple-deep"></div>
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No import history found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Records</TableHead>
                    <TableHead className="text-center">Punches</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{batch.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{batch.uploadedBy.name}</div>
                            <div className="text-xs text-gray-500">{batch.uploadedBy.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div suppressHydrationWarning>{format(new Date(batch.uploadedAt), 'MMM d, yyyy')}</div>
                            <div className="text-xs text-gray-500" suppressHydrationWarning>
                              {format(new Date(batch.uploadedAt), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {batch.recordCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {batch.punchCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatFileSize(batch.fileSize)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRevertClick(batch)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Revert
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Revert Import Batch?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to revert this import? This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Delete <strong>{selectedBatch?.recordCount}</strong> attendance records</li>
                <li>Delete <strong>{selectedBatch?.punchCount}</strong> punch logs</li>
                <li>Remove the import batch from history</li>
              </ul>
              <p className="text-red-600 font-semibold mt-3">
                This action cannot be undone!
              </p>
              {selectedBatch && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-sm">
                    <div><strong>File:</strong> {selectedBatch.fileName}</div>
                    <div suppressHydrationWarning><strong>Uploaded:</strong> {format(new Date(selectedBatch.uploadedAt), 'PPpp')}</div>
                    <div><strong>By:</strong> {selectedBatch.uploadedBy.name}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevertConfirm}
              disabled={isReverting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isReverting ? "Reverting..." : "Yes, Revert Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result Dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={handleResultDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className={`flex items-center gap-2 mb-2 ${revertResult?.success ? 'text-green-600' : 'text-red-600'}`}>
              {revertResult?.success ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <AlertDialogTitle>
                {revertResult?.success ? 'Import Reverted Successfully' : 'Revert Failed'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p className={revertResult?.success ? 'text-green-700' : 'text-red-700'}>
                {revertResult?.message}
              </p>
              {revertResult?.success && selectedBatch && (
                <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="text-sm text-green-900">
                    <div><strong>File:</strong> {selectedBatch.fileName}</div>
                    <div><strong>Records deleted:</strong> {selectedBatch.recordCount}</div>
                    <div><strong>Punches deleted:</strong> {selectedBatch.punchCount}</div>
                  </div>
                </div>
              )}
              {!revertResult?.success && selectedBatch && (
                <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                  <div className="text-sm text-red-900">
                    <div><strong>File:</strong> {selectedBatch.fileName}</div>
                    <div className="mt-2">Please try again or contact support if the problem persists.</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleResultDialogClose}
              className={revertResult?.success ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
