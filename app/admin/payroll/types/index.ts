export interface PayrollRule {
  id: string
  name: string
  type: string
  amount: number
  isPercentage: boolean
  isActive: boolean
  description: string | null
  applyToAll: boolean
  assignedUsers?: PayrollRuleAssignment[]
  category?: string
  computationBasis?: string
  minAmount?: number
  maxAmount?: number
}

export interface PayrollRuleAssignment {
  id: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
  }
}

export interface User {
  id: string
  firstName: string
  lastName: string
  employeeId: string | null
  department: string | null
  role: string
  status: string
}

export interface PayrollSchedule {
  id: string
  name: string
  days: number[]
  isActive: boolean
  processHour: number
  processMinute: number
  cutoffDays?: number[]
  paymentMethod?: string
}

export interface HolidayType {
  id: string
  name: string
  date: string
  type: 'regular' | 'special'
  payMultiplier: number
  isActive: boolean
  isRecurring: boolean
  description?: string
}

export interface LateDeductionRule {
  id: string
  name: string
  basis: 'per_minute' | 'per_hour' | 'fixed_amount'
  amount: number
  graceMinutes: number
  isActive: boolean
  description?: string
}

export interface WorkingHoursConfig {
  dailyHours: number
  weeklyHours: number
  overtimeThreshold: number
  nightShiftStart: number
  nightShiftEnd: number
  lateGraceMinutes: number
  lateDeductionBasis: 'per_minute' | 'per_hour' | 'fixed_amount'
  lateDeductionAmount: number
}

export interface RatesConfig {
  overtimeRate1: number
  overtimeRate2: number
  nightDifferential: number
  regularHolidayRate: number
  specialHolidayRate: number
}

export interface LeaveBenefitsConfig {
  vacationLeave: number
  sickLeave: number
  serviceIncentiveLeave: number
}

export interface TaxBracket {
  min: number
  max: number
  rate: number
  description: string
}

export interface PayrollFormData {
  name: string
  type: string
  amount: string
  isPercentage: boolean
  description: string
  applyToAll: boolean
  selectedUserIds: string[]
  category: string
  computationBasis: string
  minAmount: string
  maxAmount: string
}

export interface ScheduleFormData {
  name: string
  days: number[]
  isActive: boolean
  processHour: number
  processMinute: number
  cutoffDays: number[]
  paymentMethod: string
}

export interface HolidayFormData {
  name: string
  date: string
  type: 'regular' | 'special'
  payMultiplier: number
  isRecurring: boolean
  description: string
}
