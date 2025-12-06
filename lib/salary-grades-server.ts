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

// Fetch salary grades for a specific position (returns all steps)
export async function getSalaryGradesByPosition(position: string): Promise<SalaryGradeInfo[]> {
  const grades = await prisma.salaryGrade.findMany({
    where: { 
      position,
      isActive: true 
    },
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
  const grades = await prisma.salaryGrade.findMany({
    where: { position, isActive: true },
    distinct: ['grade'],
    orderBy: { grade: 'asc' },
    select: { grade: true }
  })
  
  return grades.map(g => g.grade)
}

// Validation function
export async function isValidGradeForPosition(position: string, grade: number, step: number = 1): Promise<boolean> {
  const salaryGrade = await prisma.salaryGrade.findFirst({
    where: { 
      position,
      grade,
      step,
      isActive: true 
    }
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
