// Department options
export const departments = [
  "CTAS",
  "CCJ",
  "CCIS",
  "NON-TEACHING"
] as const

// Role options
export const roles = [
  "ADMIN",
  "EMPLOYEE"
] as const

// Base positions (without ranks)
export const basePositions = {
  teaching: ["Professor", "Associate Professor", "Assistant Professor", "Instructor"],
  nonTeaching: ["Administrative Aide", "Administrative Assistant", "Administrative Officer"],
} as const

// Position ranks configuration
export const positionRanks: { [key: string]: number } = {
  "Professor": 6,
  "Associate Professor": 5,
  "Assistant Professor": 4,
  "Instructor": 3,
  "Administrative Aide": 6,
  "Administrative Assistant": 2,
  "Administrative Officer": 5
}

// Generate positions with ranks
const generatePositionsWithRanks = () => {
  const teaching: string[] = []
  const nonTeaching: string[] = []
  
  // Teaching positions with ranks
  basePositions.teaching.forEach(position => {
    const ranks = positionRanks[position]
    if (ranks) {
      for (let i = 1; i <= ranks; i++) {
        teaching.push(`${position} ${i}`)
      }
    }
  })
  
  // Non-teaching positions with ranks
  basePositions.nonTeaching.forEach(position => {
    const ranks = positionRanks[position]
    if (ranks) {
      for (let i = 1; i <= ranks; i++) {
        nonTeaching.push(`${position} ${i}`)
      }
    }
  })
  
  return { teaching, nonTeaching }
}

const { teaching: teachingPositions, nonTeaching: nonTeachingPositions } = generatePositionsWithRanks()

// Positions by department
export const positionsByDepartment = {
  "CTAS": [...teachingPositions],
  "CCJ": [...teachingPositions],
  "CCIS": [...teachingPositions, "System Administrator", "IT Support"],
  "NON-TEACHING": [...nonTeachingPositions,]
} as const

// Position to Salary Grade mapping (each position rank has exactly one salary grade)
export const positionToSalaryGrade: { [key: string]: number } = {
  // Administrative Aides
  "Administrative Aide 1": 1,
  "Administrative Aide 2": 2,
  "Administrative Aide 3": 3,
  "Administrative Aide 4": 4,
  "Administrative Aide 5": 5,
  "Administrative Aide 6": 6,
  // Administrative Assistants
  "Administrative Assistant 1": 7,
  "Administrative Assistant 2": 8,
  // Administrative Officers
  "Administrative Officer 1": 10,
  "Administrative Officer 2": 11,
  "Administrative Officer 3": 14,
  "Administrative Officer 4": 15,
  "Administrative Officer 5": 18,
  // Instructors
  "Instructor 1": 12,
  "Instructor 2": 13,
  "Instructor 3": 14,
  // Assistant Professors
  "Assistant Professor 1": 15,
  "Assistant Professor 2": 16,
  "Assistant Professor 3": 17,
  "Assistant Professor 4": 18,
  // Associate Professors
  "Associate Professor 1": 19,
  "Associate Professor 2": 20,
  "Associate Professor 3": 21,
  "Associate Professor 4": 22,
  "Associate Professor 5": 23,
  // Professors
  "Professor 1": 24,
  "Professor 2": 25,
  "Professor 3": 26,
  "Professor 4": 27,
  "Professor 5": 28,
  "Professor 6": 29,
}

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
  "CASUAL_PLANTILLA"
] as const

// Employee type display names
export const employeeTypeLabels: { [key: string]: string } = {
  "TEACHING_PERSONNEL": "Teaching Personnel",
  "NON_TEACHING_PERSONNEL": "Non-Teaching Personnel",
  "CASUAL_PLANTILLA": "Casual Plantilla"
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
