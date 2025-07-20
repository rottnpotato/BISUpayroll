import { useState } from 'react'
import { WorkingHoursConfig, RatesConfig, LeaveBenefitsConfig } from '../types'

export const usePayrollConfig = () => {
  const [workingHoursConfig, setWorkingHoursConfig] = useState<WorkingHoursConfig>({
    dailyHours: 8,
    weeklyHours: 40,
    overtimeThreshold: 8,
    nightShiftStart: 22,
    nightShiftEnd: 6,
    lateGraceMinutes: 15,
    lateDeductionBasis: "per_minute",
    lateDeductionAmount: 0
  })

  const [ratesConfig, setRatesConfig] = useState<RatesConfig>({
    overtimeRate1: 1.25,
    overtimeRate2: 1.5,
    nightDifferential: 10,
    regularHolidayRate: 200,
    specialHolidayRate: 130
  })

  const [leaveBenefitsConfig, setLeaveBenefitsConfig] = useState<LeaveBenefitsConfig>({
    vacationLeave: 15,
    sickLeave: 7,
    serviceIncentiveLeave: 5
  })

  return {
    workingHoursConfig,
    setWorkingHoursConfig,
    ratesConfig,
    setRatesConfig,
    leaveBenefitsConfig,
    setLeaveBenefitsConfig
  }
}
