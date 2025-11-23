// Server-only functions for salary grades
// These functions can only be used in Server Components and API routes
import 'server-only'
import { prisma } from "@/lib/database"
import { SalaryGradeInfo } from "./salary-grades"

// Fetch all salary grades from database
export async function getAllSalaryGrades(): Promise<SalaryGradeInfo[]> {
  const grades = await prisma.salaryGrade.findMany({
    where: { isActive: true },
    orderBy: { grade: 'asc' }
  })
  
  return grades.map(g => ({
    grade: g.grade,
    position: g.position,
    rank: g.rank,
    monthlyRate: Number(g.monthlyRate),
    dailyRate: Number(g.dailyRate),
    description: g.description || undefined
  }))
}

// Fetch salary grades for a specific position
export async function getSalaryGradesByPosition(position: string): Promise<SalaryGradeInfo[]> {
  const grades = await prisma.salaryGrade.findMany({
    where: { 
      position,
      isActive: true 
    },
    orderBy: { rank: 'asc' }
  })
  
  return grades.map(g => ({
    grade: g.grade,
    position: g.position,
    rank: g.rank,
    monthlyRate: Number(g.monthlyRate),
    dailyRate: Number(g.dailyRate),
    description: g.description || undefined
  }))
}

export async function getDailyRateByGrade(grade: number): Promise<number> {
  const salaryGrade = await prisma.salaryGrade.findUnique({
    where: { grade, isActive: true }
  })
  
  return salaryGrade ? Number(salaryGrade.dailyRate) : 0
}

export async function getAvailableGradesForPosition(position: string): Promise<number[]> {
  const grades = await prisma.salaryGrade.findMany({
    where: { position, isActive: true },
    orderBy: { rank: 'asc' },
    select: { grade: true }
  })
  
  return grades.map(g => g.grade)
}

// Validation function
export async function isValidGradeForPosition(position: string, grade: number): Promise<boolean> {
  const salaryGrade = await prisma.salaryGrade.findFirst({
    where: { 
      position,
      grade,
      isActive: true 
    }
  })
  
  return !!salaryGrade
}

// Get grade options for UI dropdown
export async function getSalaryGradeOptions(position?: string): Promise<Array<{ value: number; label: string; rate: number; rank: number }>> {
  let grades: SalaryGradeInfo[]
  
  if (position) {
    grades = await getSalaryGradesByPosition(position)
  } else {
    grades = await getAllSalaryGrades()
  }
  
  return grades.map(grade => ({
    value: grade.grade,
    label: `${grade.position} ${grade.rank} - SG ${grade.grade} (₱${grade.dailyRate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/day)`,
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
