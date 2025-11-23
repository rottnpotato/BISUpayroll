"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Users, Upload, UserPlus, FileText, DownloadCloud, AlertTriangle,
  Plus, Trash2, ChevronRight, X
} from "lucide-react"

import { BulkEmployee, FormErrors } from "../types"
import { departments, positionsByDepartment, employmentStatuses, csvHeaders } from "../constants"

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface SalaryGradeOption {
  value: number
  label: string
  rate: number
  rank: number
}

export function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
  const [bulkEmployees, setBulkEmployees] = useState<BulkEmployee[]>([])
  const [bulkImportTab, setBulkImportTab] = useState<"csv" | "manual">("csv")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [salaryGradeOptions, setSalaryGradeOptions] = useState<{ [position: string]: SalaryGradeOption[] }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch salary grades for a position
  const fetchSalaryGradesForPosition = async (position: string) => {
    if (salaryGradeOptions[position]) return // Already cached

    try {
      const response = await fetch(`/api/salary-grades?position=${encodeURIComponent(position)}`)
      if (response.ok) {
        const data = await response.json()
        setSalaryGradeOptions(prev => ({
          ...prev,
          [position]: data.grades || []
        }))
      }
    } catch (error) {
      console.error('Error fetching salary grades:', error)
    }
  }

  // Download CSV Template
  const downloadCsvTemplate = () => {
    const headers = csvHeaders.join(",")
    
    const sampleRow = [
      "Juan",
      "Dela Cruz",
      "juan.delacruz@bisu.edu.ph",
      "password123",
      "TEACHING_PERSONNEL",
      "CCIS",
      "Professor",
      "24",
      "PERMANENT",
      "09123456789",
      "BISU-2024-001",
      "2024-01-15",
      "Tagbilaran City",
      "Maria Dela Cruz",
      "Spouse",
      "09987654321"
    ].join(",")

    const csvContent = [headers, sampleRow].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", "employee_import_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Template Downloaded",
      description: "Employee import template has been downloaded.",
    })
  }

  // Parse CSV with proper error handling
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  // Parse CSV file
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split("\n").filter(line => line.trim())
        
        if (lines.length < 2) {
          toast({
            title: "Invalid CSV",
            description: "CSV file must contain headers and at least one data row.",
            variant: "destructive",
          })
          return
        }

        const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''))
        const employees: BulkEmployee[] = []

        // Expected header order
        const expectedHeaders = ["firstname", "lastname", "email", "password", "employeetype", "department", "position", "salarygrade", "status", "phone", "employeeid", "hiredate", "address", "emergencycontactname", "emergencycontactrelationship", "emergencycontactphone"]
        
        // Validate headers
        const hasValidHeaders = expectedHeaders.every(expected => 
          headers.some(header => header.includes(expected))
        )
        
        if (!hasValidHeaders) {
          toast({
            title: "Invalid CSV Format",
            description: "CSV headers don't match the template. Please use the downloaded template.",
            variant: "destructive",
          })
          return
        }

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]).map(v => v.replace(/^["']|["']$/g, '').trim())
          
          if (values.length < 6) continue // Skip rows with insufficient data

          const employee: BulkEmployee = {
            id: `bulk-${Date.now()}-${i}`,
            firstName: values[0] || "",
            lastName: values[1] || "",
            email: values[2] || "",
            password: values[3] || "",
            role: "EMPLOYEE",
            employeeType: values[4] || "",
            department: values[5] || "",
            position: values[6] || "",
            salaryGrade: values[7] || "",
            status: values[8] || "CONTRACTUAL",
            phone: values[9] || "",
            employeeId: values[10] || "",
            hireDate: values[11] || "",
            address: values[12] || "",
            emergencyContactName: values[13] || "",
            emergencyContactRelationship: values[14] || "",
            emergencyContactPhone: values[15] || ""
          }

          employees.push(employee)
        }

        if (employees.length === 0) {
          toast({
            title: "No Valid Data",
            description: "No valid employee data found in CSV file.",
            variant: "destructive",
          })
          return
        }

        setBulkEmployees(employees)
        toast({
          title: "CSV Parsed",
          description: `${employees.length} employee${employees.length !== 1 ? 's' : ''} loaded from CSV.`,
        })
      } catch (error) {
        console.error('Error parsing CSV:', error)
        toast({
          title: "Parse Error",
          description: "Failed to parse CSV file. Please check the file format.",
          variant: "destructive",
        })
      }
    }

    reader.readAsText(file)
  }

  // Add new manual entry to bulk list
  const addManualEmployee = () => {
    const newEmployee: BulkEmployee = {
      id: `bulk-${Date.now()}`,
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      employeeType: "",
      department: "",
      position: "",
      phone: "",
      employeeId: "",
      hireDate: "",
      status: "",
      salaryGrade: "",
      dailyRate: "",
      address: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: ""
    }

    setBulkEmployees([...bulkEmployees, newEmployee])
    setExpandedEmployee(newEmployee.id)
  }

  // Update bulk employee
  const updateBulkEmployee = (id: string, field: keyof BulkEmployee, value: string) => {
    setBulkEmployees(bulkEmployees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ))
  }

  // Remove bulk employee
  const removeBulkEmployee = (id: string) => {
    setBulkEmployees(bulkEmployees.filter(emp => emp.id !== id))
  }

  // Validate bulk employee
  const validateBulkEmployee = (employee: BulkEmployee): FormErrors => {
    const errors: FormErrors = {}

    if (!employee.firstName.trim()) errors.firstName = "Required"
    if (!employee.lastName.trim()) errors.lastName = "Required"
    if (!employee.email.trim()) errors.email = "Required"
    if (!employee.email.includes('@')) errors.email = "Invalid email"
    if (!employee.password.trim()) errors.password = "Required"
    if (!employee.employeeId.trim()) errors.employeeId = "Required"

    return errors
  }

  // Submit bulk employees
  const handleBulkImport = async () => {
    if (bulkEmployees.length === 0) {
      toast({
        title: "No Employees",
        description: "Please add employees to import.",
        variant: "destructive",
      })
      return
    }

    // Validate all employees
    const validatedEmployees = bulkEmployees.map(emp => ({
      ...emp,
      errors: validateBulkEmployee(emp)
    }))

    const hasErrors = validatedEmployees.some(emp => 
      emp.errors && Object.keys(emp.errors).length > 0
    )

    if (hasErrors) {
      setBulkEmployees(validatedEmployees)
      toast({
        title: "Validation Errors",
        description: "Please fix all errors before importing.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employees: bulkEmployees }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import employees')
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.created} employees.`,
      })

      // Reset and close
      setBulkEmployees([])
      setCsvFile(null)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error importing employees:', error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import employees.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setBulkEmployees([])
    setCsvFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-bisu-purple-deep" />
            Bulk Employee Import
          </DialogTitle>
          <DialogDescription>
            Import multiple employees at once using CSV file or manual entry.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={bulkImportTab} onValueChange={(v) => setBulkImportTab(v as "csv" | "manual")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <Upload size={16} />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <UserPlus size={16} />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Download CSV Template</p>
                    <p className="text-sm text-blue-700">Get the template with required columns</p>
                  </div>
                </div>
                <Button onClick={downloadCsvTemplate} variant="outline" size="sm">
                  <DownloadCloud size={16} className="mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 mb-2">CSV Format Guidelines:</p>
                    <ul className="space-y-1 text-amber-800 list-disc list-inside">
                      <li><span className="font-medium">Required fields:</span> firstName, lastName, email, password, employeeId</li>
                      <li><span className="font-medium">Salary Grade:</span> Enter grade number based on position (e.g., 12-14 for Instructor, 15-18 for Assistant Professor, 19-23 for Associate Professor, 24-29 for Professor). Leave empty to auto-assign lowest grade.</li>
                      <li><span className="font-medium">Status field:</span> Use PERMANENT, TEMPORARY, or CONTRACTUAL</li>
                      <li><span className="font-medium">Date format:</span> Use YYYY-MM-DD for hireDate (e.g., 2024-01-15)</li>
                      <li><span className="font-medium">Email:</span> Must be unique and valid format</li>
                      <li><span className="font-medium">Employee ID:</span> Must be unique (e.g., BISU-2024-001)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCsvUpload}
                  accept=".csv"
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {csvFile ? csvFile.name : "Upload CSV File"}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Click to select or drag and drop your CSV file here
                </p>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload size={16} className="mr-2" />
                  Select CSV File
                </Button>
              </div>

              {bulkEmployees.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">
                      Preview ({bulkEmployees.length} employees)
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setBulkEmployees([]); setCsvFile(null); }}
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkEmployees.map((emp) => (
                          <TableRow key={emp.id} className={emp.errors && Object.keys(emp.errors).length > 0 ? "bg-red-50" : ""}>
                            <TableCell>
                              {emp.firstName} {emp.lastName}
                              {emp.errors?.firstName && (
                                <span className="text-xs text-red-500 block">{emp.errors.firstName}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {emp.email}
                              {emp.errors?.email && (
                                <span className="text-xs text-red-500 block">{emp.errors.email}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {emp.employeeId}
                              {emp.errors?.employeeId && (
                                <span className="text-xs text-red-500 block">{emp.errors.employeeId}</span>
                              )}
                            </TableCell>
                            <TableCell>{emp.department}</TableCell>
                            <TableCell>{emp.position}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBulkEmployee(emp.id)}
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  Manual Entries ({bulkEmployees.length})
                </h3>
                <Button onClick={addManualEmployee} size="sm">
                  <Plus size={16} className="mr-2" />
                  Add Employee
                </Button>
              </div>

              {bulkEmployees.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No employees added yet</p>
                  <Button onClick={addManualEmployee} variant="outline" size="sm" className="mt-4">
                    <Plus size={16} className="mr-2" />
                    Add First Employee
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {bulkEmployees.map((emp, index) => (
                    <Card key={emp.id} className="overflow-hidden">
                      <div 
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-bisu-purple-deep text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-bisu-purple-deep">
                              {emp.firstName || emp.lastName ? `${emp.firstName} ${emp.lastName}` : `Employee ${index + 1}`}
                            </h4>
                            {emp.email && (
                              <p className="text-xs text-gray-500">{emp.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {emp.errors && Object.keys(emp.errors).length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {Object.keys(emp.errors).length} error(s)
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBulkEmployee(emp.id)
                            }}
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                          <ChevronRight 
                            size={20} 
                            className={`transition-transform ${expandedEmployee === emp.id ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                      
                      {expandedEmployee === emp.id && (
                        <div className="p-4 pt-0 border-t">
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div>
                              <Label className="text-xs">First Name *</Label>
                              <Input
                                value={emp.firstName}
                                onChange={(e) => updateBulkEmployee(emp.id, "firstName", e.target.value)}
                                placeholder="First Name"
                                className={emp.errors?.firstName ? "border-red-500" : ""}
                              />
                              {emp.errors?.firstName && (
                                <p className="text-xs text-red-500 mt-1">{emp.errors.firstName}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Last Name *</Label>
                              <Input
                                value={emp.lastName}
                                onChange={(e) => updateBulkEmployee(emp.id, "lastName", e.target.value)}
                                placeholder="Last Name"
                                className={emp.errors?.lastName ? "border-red-500" : ""}
                              />
                              {emp.errors?.lastName && (
                                <p className="text-xs text-red-500 mt-1">{emp.errors.lastName}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Email *</Label>
                              <Input
                                value={emp.email}
                                onChange={(e) => updateBulkEmployee(emp.id, "email", e.target.value)}
                                placeholder="email@bisu.edu.ph"
                                className={emp.errors?.email ? "border-red-500" : ""}
                              />
                              {emp.errors?.email && (
                                <p className="text-xs text-red-500 mt-1">{emp.errors.email}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Password *</Label>
                              <Input
                                type="password"
                                value={emp.password}
                                onChange={(e) => updateBulkEmployee(emp.id, "password", e.target.value)}
                                placeholder="Password"
                                className={emp.errors?.password ? "border-red-500" : ""}
                              />
                              {emp.errors?.password && (
                                <p className="text-xs text-red-500 mt-1">{emp.errors.password}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Employee ID *</Label>
                              <Input
                                value={emp.employeeId}
                                onChange={(e) => updateBulkEmployee(emp.id, "employeeId", e.target.value)}
                                placeholder="BISU-2024-XXX"
                                className={emp.errors?.employeeId ? "border-red-500" : ""}
                              />
                              {emp.errors?.employeeId && (
                                <p className="text-xs text-red-500 mt-1">{emp.errors.employeeId}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Department *</Label>
                              <Select
                                value={emp.department}
                                onValueChange={(value) => updateBulkEmployee(emp.id, "department", value)}
                              >
                                <SelectTrigger className={emp.errors?.department ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Position</Label>
                              <Select
                                value={emp.position}
                                onValueChange={(value) => {
                                  updateBulkEmployee(emp.id, "position", value)
                                  updateBulkEmployee(emp.id, "salaryGrade", "") // Reset salary grade
                                  fetchSalaryGradesForPosition(value)
                                }}
                                disabled={!emp.department}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={emp.department ? "Select" : "Select department first"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {emp.department && positionsByDepartment[emp.department as keyof typeof positionsByDepartment]?.map((position) => (
                                    <SelectItem key={position} value={position}>
                                      {position}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Salary Grade</Label>
                              <Select
                                value={emp.salaryGrade}
                                onValueChange={(value) => updateBulkEmployee(emp.id, "salaryGrade", value)}
                                disabled={!emp.position}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={emp.position ? "Select grade" : "Select position first"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {emp.position && salaryGradeOptions[emp.position]?.map((grade) => (
                                    <SelectItem key={grade.value} value={grade.value.toString()}>
                                      {grade.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!emp.salaryGrade && emp.position && (
                                <p className="text-xs text-gray-500 mt-1">Optional - lowest grade will be auto-assigned</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Status *</Label>
                              <Select
                                value={emp.status}
                                onValueChange={(value) => updateBulkEmployee(emp.id, "status", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {employmentStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Phone</Label>
                              <Input
                                value={emp.phone}
                                onChange={(e) => updateBulkEmployee(emp.id, "phone", e.target.value)}
                                placeholder="09XXXXXXXXX"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Hire Date</Label>
                              <Input
                                type="date"
                                value={emp.hireDate}
                                onChange={(e) => updateBulkEmployee(emp.id, "hireDate", e.target.value)}
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs">Address</Label>
                              <Input
                                value={emp.address}
                                onChange={(e) => updateBulkEmployee(emp.id, "address", e.target.value)}
                                placeholder="Complete Address"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Emergency Contact Name</Label>
                              <Input
                                value={emp.emergencyContactName}
                                onChange={(e) => updateBulkEmployee(emp.id, "emergencyContactName", e.target.value)}
                                placeholder="Full Name"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Relationship</Label>
                              <Input
                                value={emp.emergencyContactRelationship}
                                onChange={(e) => updateBulkEmployee(emp.id, "emergencyContactRelationship", e.target.value)}
                                placeholder="e.g., Spouse, Parent"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Emergency Contact Phone</Label>
                              <Input
                                value={emp.emergencyContactPhone}
                                onChange={(e) => updateBulkEmployee(emp.id, "emergencyContactPhone", e.target.value)}
                                placeholder="09XXXXXXXXX"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleBulkImport}
            disabled={isSubmitting || bulkEmployees.length === 0}
          >
            {isSubmitting ? "Importing..." : `Import ${bulkEmployees.length} Employee${bulkEmployees.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
