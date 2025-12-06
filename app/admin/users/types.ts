export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  employeeType?: string
  department?: string
  status: string
  createdAt: string
  position?: string
  phone?: string
  employeeId?: string
  salary?: number
  hireDate?: string
  salaryGrade?: number
  salaryStep?: number
  dailyRate?: number
  address?: string
  emergencyContactName?: string
  emergencyContactRelationship?: string
  emergencyContactPhone?: string
}

export interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  department?: string
  position?: string
  phone?: string
  employeeId?: string
  password?: string
  emergencyContactPhone?: string
  salaryStep?: string
}

export interface BulkEmployee {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  employeeType: string
  department: string
  position: string
  rank: string  // Roman numeral rank (e.g., "I", "II", "III")
  step: string  // Step within salary grade (1-8)
  salaryGrade?: string  // Computed from position + rank + step
  salaryStep?: string   // Alias for step
  dailyRate?: string
  phone: string
  employeeId: string
  hireDate: string
  status: string
  address: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  errors?: FormErrors
}

export interface ApiResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  employeeType: string
  department: string
  position: string
  salaryGrade: string
  salaryStep: string
  dailyRate: string
  phone: string
  employeeId: string
  hireDate: string
  salary: string
  address: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  status: string
  notes: string
}
