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
  dailyRate?: number
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
  salaryGrade: string
  dailyRate: string
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
