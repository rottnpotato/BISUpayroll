import { BulkEmployee, FormData, FormErrors } from "./types"
import { csvHeaders } from "./constants"

// Parse CSV with proper error handling
export const parseCsvLine = (line: string): string[] => {
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

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Get status badge variant
export const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'default'
    case 'inactive': return 'secondary'
    case 'terminated': return 'destructive'
    default: return 'outline'
  }
}

// Validate Philippine phone number (11 digits starting with 09)
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^09\d{9}$/
  return phoneRegex.test(phone)
}

// Validate form
export const validateForm = (formData: FormData, isEdit: boolean = false): FormErrors => {
  const errors: FormErrors = {}

  if (!formData.firstName.trim()) errors.firstName = "First name is required"
  if (!formData.lastName.trim()) errors.lastName = "Last name is required"
  if (!formData.email.trim()) errors.email = "Email is required"
  if (!formData.email.includes('@')) errors.email = "Invalid email format"
  if (!isEdit && !formData.password) errors.password = "Password is required"
  if (!formData.role) errors.role = "Role is required"
  if (formData.phone && !validatePhoneNumber(formData.phone)) {
    errors.phone = "Phone must be 11 digits starting with 09 (e.g., 09123456789)"
  }
  if (formData.emergencyContactPhone && !validatePhoneNumber(formData.emergencyContactPhone)) {
    errors.emergencyContactPhone = "Phone must be 11 digits starting with 09"
  }

  return errors
}

// Validate bulk employee
export const validateBulkEmployee = (employee: BulkEmployee): FormErrors => {
  const errors: FormErrors = {}

  if (!employee.firstName.trim()) errors.firstName = "Required"
  if (!employee.lastName.trim()) errors.lastName = "Required"
  if (!employee.email.trim()) errors.email = "Required"
  if (!employee.email.includes('@')) errors.email = "Invalid email"
  if (!employee.password.trim()) errors.password = "Required"
  if (!employee.employeeId.trim()) errors.employeeId = "Required"

  return errors
}

// Download CSV Template
export const downloadCsvTemplate = () => {
  const sampleRow = [
    "Juan",
    "Dela Cruz",
    "juan.delacruz@bisu.edu.ph",
    "password123",
    "TEACHING_PERSONNEL",
    "CCIS",
    "Professor",
    "PERMANENT",
    "09123456789",
    "BISU-2024-001",
    "2024-01-15",
    "Tagbilaran City",
    "Maria Dela Cruz",
    "Spouse",
    "09987654321"
  ]

  const csvContent = [csvHeaders.join(","), sampleRow.join(",")].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", "employee_import_template.csv")
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Parse CSV file to bulk employees
export const parseCsvToBulkEmployees = (text: string): BulkEmployee[] => {
  const lines = text.split("\n").filter(line => line.trim())
  
  if (lines.length < 2) {
    throw new Error("CSV file must contain headers and at least one data row.")
  }

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''))
  const employees: BulkEmployee[] = []

  // Expected header order
  const expectedHeaders = ["firstname", "lastname", "email", "password", "employeetype", "department", "position", "status", "phone", "employeeid", "hiredate", "address", "emergencycontactname", "emergencycontactrelationship", "emergencycontactphone"]
  
  // Validate headers
  const hasValidHeaders = expectedHeaders.every(expected => 
    headers.some(header => header.includes(expected))
  )
  
  if (!hasValidHeaders) {
    throw new Error("CSV headers don't match the template. Please use the downloaded template.")
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
      status: values[7] || "CONTRACTUAL",
      phone: values[8] || "",
      employeeId: values[9] || "",
      hireDate: values[10] || "",
      address: values[11] || "",
      emergencyContactName: values[12] || "",
      emergencyContactRelationship: values[13] || "",
      emergencyContactPhone: values[14] || "",
      salaryGrade: "",
      salaryStep: "",
      dailyRate: ""
    }

    employees.push(employee)
  }

  if (employees.length === 0) {
    throw new Error("No valid employee data found in CSV file.")
  }

  return employees
}

// Get initial form data
export const getInitialFormData = (): FormData => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  employeeType: "",
  department: "",
  position: "",
  salaryGrade: "",
  salaryStep: "",
  dailyRate: "",
  phone: "",
  employeeId: "",
  hireDate: "",
  salary: "",
  address: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  status: "CONTRACTUAL",
  notes: ""
})
