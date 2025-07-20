import { useState, useEffect, useRef, useCallback } from 'react'
import { WorkingHoursConfig, RatesConfig, LeaveBenefitsConfig } from '../types'
import { toast } from 'sonner'

interface UnsavedChangesState {
  workingHours: boolean
  rates: boolean
  leaveBenefits: boolean
}

export const usePayrollConfig = () => {
  const [workingHoursConfig, setWorkingHoursConfig] = useState<WorkingHoursConfig>({
    dailyHours: 8,
    weeklyHours: 40,
    overtimeThreshold: 8,
    nightShiftStart: 22,
    nightShiftEnd: 6,
    nightShiftEnabled: false,
    lateGraceMinutes: 15,
    lateDeductionBasis: "per_minute",
    lateDeductionAmount: 0
  })

  const [ratesConfig, setRatesConfig] = useState<RatesConfig>({
    overtimeRate1: 1.25,
    overtimeRate2: 1.5,
    nightDifferential: 10,
    regularHolidayRate: 200,
    specialHolidayRate: 130,
    currency: 'PHP'
  })

  const [leaveBenefitsConfig, setLeaveBenefitsConfig] = useState<LeaveBenefitsConfig>({
    vacationLeave: 15,
    sickLeave: 7,
    serviceIncentiveLeave: 5,
    maternityLeave: 105,
    paternityLeave: 7
  })

  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChangesState>({
    workingHours: false,
    rates: false,
    leaveBenefits: false
  })

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const originalConfigsRef = useRef<{
    workingHours: WorkingHoursConfig
    rates: RatesConfig
    leaveBenefits: LeaveBenefitsConfig
  } | undefined>(undefined)

  // Auto-save debounce timer
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Save configuration to database
  const saveConfiguration = useCallback(async (type: 'workingHours' | 'rates' | 'leaveBenefits', config: any) => {
    try {
      const response = await fetch('/api/admin/payroll/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type === 'workingHours' ? 'workingHours' : type === 'rates' ? 'rates' : 'leaveBenefits',
          config: {
            ...config,
            isActive: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save ${type} configuration`)
      }

      setUnsavedChanges(prev => ({ ...prev, [type]: false }))
      
      // Update original config reference
      if (originalConfigsRef.current) {
        originalConfigsRef.current[type] = { ...config }
      }

      return true
    } catch (error) {
      console.error(`Error saving ${type} configuration:`, error)
      toast.error(`Failed to save ${type} configuration`)
      return false
    }
  }, [])

  // Auto-save function with debouncing
  const autoSave = useCallback((type: 'workingHours' | 'rates' | 'leaveBenefits', config: any) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      await saveConfiguration(type, config)
      setIsAutoSaving(false)
    }, 2000) // Auto-save after 2 seconds of inactivity
  }, [saveConfiguration])

  // Enhanced setters with change tracking
  const setWorkingHoursConfigWithTracking = useCallback((config: WorkingHoursConfig | ((prev: WorkingHoursConfig) => WorkingHoursConfig)) => {
    setWorkingHoursConfig(prev => {
      const newConfig = typeof config === 'function' ? config(prev) : config
      
      // Check if there are actual changes
      const hasChanges = originalConfigsRef.current ? 
        JSON.stringify(newConfig) !== JSON.stringify(originalConfigsRef.current.workingHours) : 
        true
      
      if (hasChanges) {
        setUnsavedChanges(prev => ({ ...prev, workingHours: true }))
        autoSave('workingHours', newConfig)
      }
      
      return newConfig
    })
  }, [autoSave])

  const setRatesConfigWithTracking = useCallback((config: RatesConfig | ((prev: RatesConfig) => RatesConfig)) => {
    setRatesConfig(prev => {
      const newConfig = typeof config === 'function' ? config(prev) : config
      
      const hasChanges = originalConfigsRef.current ? 
        JSON.stringify(newConfig) !== JSON.stringify(originalConfigsRef.current.rates) : 
        true
      
      if (hasChanges) {
        setUnsavedChanges(prev => ({ ...prev, rates: true }))
        autoSave('rates', newConfig)
      }
      
      return newConfig
    })
  }, [autoSave])

  const setLeaveBenefitsConfigWithTracking = useCallback((config: LeaveBenefitsConfig | ((prev: LeaveBenefitsConfig) => LeaveBenefitsConfig)) => {
    setLeaveBenefitsConfig(prev => {
      const newConfig = typeof config === 'function' ? config(prev) : config
      
      const hasChanges = originalConfigsRef.current ? 
        JSON.stringify(newConfig) !== JSON.stringify(originalConfigsRef.current.leaveBenefits) : 
        true
      
      if (hasChanges) {
        setUnsavedChanges(prev => ({ ...prev, leaveBenefits: true }))
        autoSave('leaveBenefits', newConfig)
      }
      
      return newConfig
    })
  }, [autoSave])

  // Load configurations from the API
  const loadConfigurations = async () => {
    try {
      const response = await fetch('/api/admin/payroll/config')
      if (response.ok) {
        const data = await response.json()
        if (data.configurations) {
          if (data.configurations.workingHours && Object.keys(data.configurations.workingHours).length > 0) {
            setWorkingHoursConfig(prev => ({ ...prev, ...data.configurations.workingHours }))
          }
          if (data.configurations.rates && Object.keys(data.configurations.rates).length > 0) {
            setRatesConfig(prev => ({ ...prev, ...data.configurations.rates }))
          }
          if (data.configurations.leaveBenefits && Object.keys(data.configurations.leaveBenefits).length > 0) {
            setLeaveBenefitsConfig(prev => ({ ...prev, ...data.configurations.leaveBenefits }))
          }

          // Store original configurations for change detection
          originalConfigsRef.current = {
            workingHours: { ...workingHoursConfig, ...data.configurations.workingHours },
            rates: { ...ratesConfig, ...data.configurations.rates },
            leaveBenefits: { ...leaveBenefitsConfig, ...data.configurations.leaveBenefits }
          }
        }
      }
    } catch (error) {
      console.error('Error loading configurations:', error)
    }
  }

  // Manual save function for immediate saves
  const saveAllConfigurations = async () => {
    const results = await Promise.all([
      unsavedChanges.workingHours ? saveConfiguration('workingHours', workingHoursConfig) : Promise.resolve(true),
      unsavedChanges.rates ? saveConfiguration('rates', ratesConfig) : Promise.resolve(true),
      unsavedChanges.leaveBenefits ? saveConfiguration('leaveBenefits', leaveBenefitsConfig) : Promise.resolve(true)
    ])

    const allSaved = results.every(result => result)
    if (allSaved) {
      toast.success('All configurations saved successfully')
    }
    return allSaved
  }

  // Check if there are any unsaved changes
  const hasUnsavedChanges = Object.values(unsavedChanges).some(changed => changed)

  // Beforeunload event handler for preventing accidental page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Modern browsers
        e.preventDefault()
        e.returnValue = ''
        
        // Legacy browsers
        const message = 'You have unsaved changes. Are you sure you want to leave?'
        e.returnValue = message
        return message
      }
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    loadConfigurations()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    workingHoursConfig,
    setWorkingHoursConfig: setWorkingHoursConfigWithTracking,
    ratesConfig,
    setRatesConfig: setRatesConfigWithTracking,
    leaveBenefitsConfig,
    setLeaveBenefitsConfig: setLeaveBenefitsConfigWithTracking,
    loadConfigurations,
    saveConfiguration,
    saveAllConfigurations,
    unsavedChanges,
    hasUnsavedChanges,
    isAutoSaving
  }
}
