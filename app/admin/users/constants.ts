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
  "Administrative Assistant": 3,
  "Administrative Officer": 5
}

// Roman numeral conversion
const toRomanNumeral = (num: number): string => {
  const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
  return romanNumerals[num] || num.toString()
}

// Generate positions with ranks (using Roman numerals)
const generatePositionsWithRanks = () => {
  const teaching: string[] = []
  const nonTeaching: string[] = []
  
  // Teaching positions with ranks
  basePositions.teaching.forEach(position => {
    const ranks = positionRanks[position]
    if (ranks) {
      for (let i = 1; i <= ranks; i++) {
        teaching.push(`${position} ${toRomanNumeral(i)}`)
      }
    }
  })
  
  // Non-teaching positions with ranks
  basePositions.nonTeaching.forEach(position => {
    const ranks = positionRanks[position]
    if (ranks) {
      for (let i = 1; i <= ranks; i++) {
        nonTeaching.push(`${position} ${toRomanNumeral(i)}`)
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
// Note: Default step is 1, users can select different steps later
export const positionToSalaryGrade: { [key: string]: { grade: number, defaultStep: number } } = {
  // Administrative Aides
  "Administrative Aide I": { grade: 1, defaultStep: 1 },
  "Administrative Aide II": { grade: 2, defaultStep: 1 },
  "Administrative Aide III": { grade: 3, defaultStep: 1 },
  "Administrative Aide IV": { grade: 4, defaultStep: 1 },
  "Administrative Aide V": { grade: 5, defaultStep: 1 },
  "Administrative Aide VI": { grade: 6, defaultStep: 1 },
  // Administrative Assistants
  "Administrative Assistant I": { grade: 7, defaultStep: 1 },
  "Administrative Assistant II": { grade: 8, defaultStep: 1 },
  "Administrative Assistant III": { grade: 9, defaultStep: 1 },
  // Administrative Officers
  "Administrative Officer I": { grade: 10, defaultStep: 1 },
  "Administrative Officer II": { grade: 11, defaultStep: 1 },
  "Administrative Officer III": { grade: 14, defaultStep: 1 },
  "Administrative Officer IV": { grade: 15, defaultStep: 1 },
  "Administrative Officer V": { grade: 18, defaultStep: 1 },
  // Instructors
  "Instructor I": { grade: 12, defaultStep: 1 },
  "Instructor II": { grade: 13, defaultStep: 1 },
  "Instructor III": { grade: 14, defaultStep: 1 },
  // Assistant Professors
  "Assistant Professor I": { grade: 15, defaultStep: 1 },
  "Assistant Professor II": { grade: 16, defaultStep: 1 },
  "Assistant Professor III": { grade: 17, defaultStep: 1 },
  "Assistant Professor IV": { grade: 18, defaultStep: 1 },
  // Associate Professors
  "Associate Professor I": { grade: 19, defaultStep: 1 },
  "Associate Professor II": { grade: 20, defaultStep: 1 },
  "Associate Professor III": { grade: 21, defaultStep: 1 },
  "Associate Professor IV": { grade: 22, defaultStep: 1 },
  "Associate Professor V": { grade: 23, defaultStep: 1 },
  // Professors
  "Professor I": { grade: 24, defaultStep: 1 },
  "Professor II": { grade: 25, defaultStep: 1 },
  "Professor III": { grade: 26, defaultStep: 1 },
  "Professor IV": { grade: 27, defaultStep: 1 },
  "Professor V": { grade: 28, defaultStep: 1 },
  "Professor VI": { grade: 29, defaultStep: 1 },
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

// Helper to extract rank from position string (e.g., "Professor II" -> 2)
export const getRankFromPosition = (position: string): number | null => {
  const romanNumerals: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8
  }
  const match = position.match(/\s([IVX]+)$/)
  return match ? (romanNumerals[match[1]] || null) : null
}

// Helper to extract base position (e.g., "Professor II" -> "Professor")
export const getBasePosition = (position: string): string => {
  return position.replace(/\s[IVX]+$/, '').trim()
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
  "rank",
  "step",
  "status",
  "phone",
  "employeeId",
  "hireDate",
  "address",
  "emergencyContactName",
  "emergencyContactRelationship",
  "emergencyContactPhone"
] as const
