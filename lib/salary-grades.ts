// Salary Grade mapping for teachers and academic personnel
// Now managed in the database
// This file provides utility functions and types

export interface SalaryGradeInfo {
  grade: number
  step: number
  dailyRate: number
  position: string
  rank: number
  monthlyRate: number
  description?: string
}

export function getPositionLabel(position: string, rank: number): string {
  // Convert rank to Roman numeral for display
  const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
  const rankLabel = romanNumerals[rank] || rank.toString()
  return `${position} ${rankLabel}`
}

export function getSalaryGradeLabel(grade: number, step: number): string {
  return `SG ${grade} - ${step}`
}

export function getHourlyRateFromDaily(dailyRate: number, hoursPerDay: number = 8): number {
  return Math.round((dailyRate / hoursPerDay) * 100) / 100
}

export function getMonthlyRateFromDaily(dailyRate: number): number {
  // Convert daily rate to monthly rate (22 working days per month)
  return Math.round(dailyRate * 22 * 100) / 100
}

export function getDailyRateFromMonthly(monthlyRate: number): number {
  // Convert monthly rate to daily rate (22 working days per month)
  return Math.round((monthlyRate / 22) * 100) / 100
}
