// Server-only functions for salary grades
// These functions can only be used in Server Components and API routes
import 'server-only'
import { prisma } from "@/lib/database"

export interface SalaryGradeInfo {
  grade: number
  step: number
  position: string
  rank: number
  monthlyRate: number
  dailyRate: number
  description?: string
}

// Fetch all salary grades from database
export async function getAllSalaryGrades(): Promise<SalaryGradeInfo[]> {
  const grades = await prisma.salaryGrade.findMany({
    where: { isActive: true },
    orderBy: [{ grade: 'asc' }, { step: 'asc' }]
  })
  
  return grades.map(g => ({
    grade: g.grade,
    step: g.step,
    position: g.position,
    rank: g.rank,
    monthlyRate: Number(g.monthlyRate),
    dailyRate: Number(g.dailyRate),
    description: g.description || undefined
  }))
}

// Helper to parse position with rank (e.g., "Professor I" -> { basePosition: "Professor", rank: 1 })
function parsePositionWithRank(positionWithRank: string): { basePosition: string; rank: number | null } {
  const romanNumerals: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8
  }
  const match = positionWithRank.match(/^(.+?)\s+([IVX]+)$/)
  if (match) {
    return {
      basePosition: match[1].trim(),
      rank: romanNumerals[match[2]] || null
    }
  }
  return { basePosition: positionWithRank, rank: null }
}

// Fetch salary grades for a specific position (returns all steps)
// Supports both "Professor" (base position) and "Professor I" (position with rank)
export async function getSalaryGradesByPosition(position: string): Promise<SalaryGradeInfo[]> {
  const { basePosition, rank } = parsePositionWithRank(position)
  
  const whereClause: { position: string; rank?: number; isActive: boolean } = {
    position: basePosition,
    isActive: true
  }
  
  // If rank is specified, filter by rank as well
  if (rank !== null) {
    whereClause.rank = rank
  }
  
  const grades = await prisma.salaryGrade.findMany({
    where: whereClause,
    orderBy: [{ rank: 'asc' }, { step: 'asc' }]
  })
  
  return grades.map(g => ({
    grade: g.grade,
    step: g.step,
    position: g.position,
    rank: g.rank,
    monthlyRate: Number(g.monthlyRate),
    dailyRate: Number(g.dailyRate),
    description: g.description || undefined
  }))
}

// Get daily rate for a specific grade and step
export async function getDailyRateByGradeAndStep(grade: number, step: number = 1): Promise<number> {
  const salaryGrade = await prisma.salaryGrade.findFirst({
    where: { 
      grade,
      step,
      isActive: true 
    }
  })
  
  return salaryGrade ? Number(salaryGrade.dailyRate) : 0
}

// Legacy function - defaults to step 1
export async function getDailyRateByGrade(grade: number): Promise<number> {
  return getDailyRateByGradeAndStep(grade, 1)
}

export async function getAvailableGradesForPosition(position: string): Promise<number[]> {
  const { basePosition, rank } = parsePositionWithRank(position)
  
  const whereClause: { position: string; rank?: number; isActive: boolean } = {
    position: basePosition,
    isActive: true
  }
  
  if (rank !== null) {
    whereClause.rank = rank
  }
  
  const grades = await prisma.salaryGrade.findMany({
    where: whereClause,
    distinct: ['grade'],
    orderBy: { grade: 'asc' },
    select: { grade: true }
  })
  
  return grades.map(g => g.grade)
}

// Validation function
// Supports both "Professor" (base position) and "Professor I" (position with rank)
export async function isValidGradeForPosition(position: string, grade: number, step: number = 1): Promise<boolean> {
  const { basePosition, rank } = parsePositionWithRank(position)
  
  const whereClause: { position: string; grade: number; step: number; rank?: number; isActive: boolean } = {
    position: basePosition,
    grade,
    step,
    isActive: true
  }
  
  if (rank !== null) {
    whereClause.rank = rank
  }
  
  const salaryGrade = await prisma.salaryGrade.findFirst({
    where: whereClause
  })
  
  return !!salaryGrade
}

// Get step options for UI dropdown (returns all 8 steps for a position)
export async function getSalaryGradeOptions(position?: string): Promise<Array<{ value: number; step: number; label: string; rate: number; rank: number }>> {
  let grades: SalaryGradeInfo[]
  
  if (position) {
    grades = await getSalaryGradesByPosition(position)
  } else {
    grades = await getAllSalaryGrades()
  }
  
  // Convert rank to Roman numeral for display
  const toRomanNumeral = (num: number): string => {
    const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
    return romanNumerals[num] || num.toString()
  }
  
  return grades.map(grade => ({
    value: grade.step,
    step: grade.step,
    label: `SG ${grade.grade} - ${grade.step} (₱${grade.dailyRate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/day)`,
    rate: grade.dailyRate,
    rank: grade.rank
  }))
}

// Get available positions
export async function getAvailablePositions(): Promise<string[]> {
  const positions = await prisma.salaryGrade.findMany({
    where: { isActive: true },
    distinct: ['position'],
    select: { position: true },
    orderBy: { position: 'asc' }
  })
  
  return positions.map(p => p.position)
}
