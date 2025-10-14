"use client"

import { useState, useRef } from "react"
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
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Info } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ImportResults {
  total: number
  processed: number
  imported: number
  updated: number
  skipped: number
  errors: string[]
  warnings: string[]
}

interface AttendanceImportDialogProps {
  onImportComplete?: () => void
}

export function AttendanceImportDialog({ onImportComplete }: AttendanceImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const hasValidExtension = validExtensions.some(ext => 
        selectedFile.name.toLowerCase().endsWith(ext)
      )
      
      if (!hasValidExtension) {
        toast.error('Please select a CSV or Excel file (.csv, .xls, .xlsx)')
        return
      }
      setFile(selectedFile)
      setImportResults(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/admin/attendance/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        setImportResults(result.results)
        toast.success(result.message)
        
        // Call onImportComplete after a short delay to show results
        setTimeout(() => {
          onImportComplete?.()
        }, 2000)
      } else {
        toast.error(result.message || 'Import failed')
        if (result.results) {
          setImportResults(result.results)
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportResults(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleReset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Upload className="h-4 w-4 mr-2" />
          Import Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Attendance Data</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file (.csv, .xls, .xlsx) from the biometric system to import attendance records.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Format Information */}
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected File Format:</strong>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Supported formats: CSV (.csv) or Excel (.xls, .xlsx)</li>
                <li>Columns: Department, Name, No., Date/Time, Status, Location ID</li>
                <li>Name format: "Last, First Middle"</li>
                <li>Date/Time format: "MM/DD/YYYY HH:MM AM/PM"</li>
                <li>Status: "C/In" for clock in, "C/Out" for clock out</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* File Selection */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileText className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                {file ? file.name : 'Click to select a CSV or Excel file'}
              </p>
              <p className="text-xs text-gray-400">
                {file ? `Size: ${(file.size / 1024).toFixed(2)} KB` : 'CSV, XLS, or XLSX format'}
              </p>
            </label>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700">{importResults.total}</div>
                  <div className="text-xs text-blue-600">Total Records</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">{importResults.imported}</div>
                  <div className="text-xs text-green-600">Imported</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-700">{importResults.updated}</div>
                  <div className="text-xs text-yellow-600">Updated</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-700">{importResults.processed}</div>
                  <div className="text-xs text-purple-600">Processed</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-700">{importResults.skipped}</div>
                  <div className="text-xs text-gray-600">Skipped</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-700">{importResults.errors.length}</div>
                  <div className="text-xs text-red-600">Errors</div>
                </div>
              </div>

              {/* Warnings */}
              {importResults.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Warnings ({importResults.warnings.length})</h4>
                  </div>
                  <ScrollArea className="h-24 border rounded-md p-2">
                    <div className="space-y-1">
                      {importResults.warnings.map((warning, index) => (
                        <div key={index} className="text-xs text-yellow-700 flex items-start gap-1">
                          <span className="text-yellow-500">▸</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Errors */}
              {importResults.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-medium text-red-800">Errors ({importResults.errors.length})</h4>
                  </div>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    <div className="space-y-1">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-700 flex items-start gap-1">
                          <span className="text-red-500">✕</span>
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Success message */}
              {importResults.errors.length === 0 && importResults.processed > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    All records were processed successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {importResults ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? 'Processing...' : 'Upload & Import'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}