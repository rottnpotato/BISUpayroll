// Department options
export const departments = [
  "CTAS",
  "CCJ",
  "CCIS"
] as const

// Role options
export const roles = [
  "ADMIN",
  "EMPLOYEE"
] as const

// Positions by department
export const positionsByDepartment = {
  "CTAS": ["Professor", "Associate Professor", "Assistant Professor", "Instructor", "Lecturer", "Dean", "Department Head"],
  "CCJ": ["Professor", "Associate Professor", "Assistant Professor", "Instructor", "Lecturer", "Dean", "Department Head"],
  "CCIS": ["Professor", "Associate Professor", "Assistant Professor", "Instructor", "Lecturer", "Dean", "Department Head", "System Administrator", "IT Support"]
} as const

// Status options
export const employmentStatuses = [
  "PERMANENT",
  "TEMPORARY",
  "CONTRACTUAL"
] as const

// Employee type options
export const employeeTypes = [
  "TEACHING_PERSONNEL",
  "NON_TEACHING_PERSONNEL",
  "CASUAL",
  "PLANTILLA"
] as const

// Employee type display names
export const employeeTypeLabels: { [key: string]: string } = {
  "TEACHING_PERSONNEL": "Teaching Personnel",
  "NON_TEACHING_PERSONNEL": "Non-Teaching Personnel",
  "CASUAL": "Casual",
  "PLANTILLA": "Plantilla"
}

// Employment status display names
export const employmentStatusLabels: { [key: string]: string } = {
  "PERMANENT": "Permanent",
  "TEMPORARY": "Temporary",
  "CONTRACTUAL": "Contractual",
  "INACTIVE": "Inactive"
}

// CSV Template Headers
export const csvHeaders = [
  "firstName",
  "lastName", 
  "email",
  "password",
  "employeeType",
  "department",
  "position",
  "salaryGrade",
  "status",
  "phone",
  "employeeId",
  "hireDate",
  "address",
  "emergencyContactName",
  "emergencyContactRelationship",
  "emergencyContactPhone"
] as const
