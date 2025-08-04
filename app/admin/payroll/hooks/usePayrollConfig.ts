import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  WorkingHoursConfig, 
  RatesConfig, 
  LeaveBenefitsConfig, 
  ContributionsConfig, 
  TaxBracketsConfig, 
  ConfigurationScope,
  ConfigurationSaveResponse
} from '../types'
import { toast } from 'sonner'

interface UnsavedChangesState {
  workingHours: boolean
  rates: boolean
  leaveBenefits: boolean
  contributions: boolean
  taxBrackets: boolean
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

  const [contributionsConfig, setContributionsConfig] = useState<ContributionsConfig>({
    gsis: {
      employeeRate: 9,
      employerRate: 12,
      minSalary: 5000,
      maxSalary: 100000
    },
    philHealth: {
      employeeRate: 2.75,
      employerRate: 2.75,
      minContribution: 200,
      maxContribution: 1750,
      minSalary: 8000,
      maxSalary: 70000
    },
    pagibig: {
      employeeRate: 2,
      employerRate: 2,
      minContribution: 24,
      maxContribution: 200,
      minSalary: 1200,
      maxSalary: 10000
    }
  })

  const [taxBracketsConfig, setTaxBracketsConfig] = useState<TaxBracketsConfig>({
    brackets: [
      { min: 0, max: 20833, rate: 0, description: "₱0 - ₱250,000 annually" },
      { min: 20834, max: 33333, rate: 20, description: "₱250,001 - ₱400,000 annually" },
      { min: 33334, max: 66667, rate: 25, description: "₱400,001 - ₱800,000 annually" },
      { min: 66668, max: 166667, rate: 30, description: "₱800,001 - ₱2,000,000 annually" },
      { min: 166668, max: 666667, rate: 32, description: "₱2,000,001 - ₱8,000,000 annually" },
      { min: 666668, max: 999999999, rate: 35, description: "Above ₱8,000,000 annually" }
    ],
    withholdingEnabled: true,
    showBreakdownOnPayslip: true,
    autoComputeTax: true
  })

  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChangesState>({
    workingHours: false,
    rates: false,
    leaveBenefits: false,
    contributions: false,
    taxBrackets: false
  })

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const originalConfigsRef = useRef<{
    workingHours: WorkingHoursConfig
    rates: RatesConfig
    leaveBenefits: LeaveBenefitsConfig
    contributions: ContributionsConfig
    taxBrackets: TaxBracketsConfig
  } | undefined>(undefined)

  // Auto-save debounce timer
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Save configuration to database
  const saveConfiguration = useCallback(async (type: 'workingHours' | 'rates' | 'leaveBenefits' | 'contributions' | 'taxBrackets', config: any) => {
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

  const setContributionsConfigWithTracking = useCallback((config: ContributionsConfig | ((prev: ContributionsConfig) => ContributionsConfig)) => {
    setContributionsConfig(prev => {
      const newConfig = typeof config === 'function' ? config(prev) : config
      
      const hasChanges = originalConfigsRef.current ? 
        JSON.stringify(newConfig) !== JSON.stringify(originalConfigsRef.current.contributions) : 
        true
      
      if (hasChanges) {
        setUnsavedChanges(prev => ({ ...prev, contributions: true }))
        autoSave('contributions', newConfig)
      }
      
      return newConfig
    })
  }, [autoSave])

  const setTaxBracketsConfigWithTracking = useCallback((config: TaxBracketsConfig | ((prev: TaxBracketsConfig) => TaxBracketsConfig)) => {
    setTaxBracketsConfig(prev => {
      const newConfig = typeof config === 'function' ? config(prev) : config
      
      const hasChanges = originalConfigsRef.current ? 
        JSON.stringify(newConfig) !== JSON.stringify(originalConfigsRef.current.taxBrackets) : 
        true
      
      if (hasChanges) {
        setUnsavedChanges(prev => ({ ...prev, taxBrackets: true }))
        autoSave('taxBrackets', newConfig)
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

  // Individual save functions for each configuration
  const saveWorkingHoursConfig = useCallback(async (config?: WorkingHoursConfig, scope?: ConfigurationScope): Promise<ConfigurationSaveResponse> => {
    const configToSave = config || workingHoursConfig
    return await saveConfigurationWithScope('workingHours', configToSave, scope)
  }, [workingHoursConfig])

  const saveRatesConfig = useCallback(async (config?: RatesConfig, scope?: ConfigurationScope): Promise<ConfigurationSaveResponse> => {
    const configToSave = config || ratesConfig
    return await saveConfigurationWithScope('rates', configToSave, scope)
  }, [ratesConfig])

  const saveLeaveBenefitsConfig = useCallback(async (config?: LeaveBenefitsConfig, scope?: ConfigurationScope): Promise<ConfigurationSaveResponse> => {
    const configToSave = config || leaveBenefitsConfig
    return await saveConfigurationWithScope('leaveBenefits', configToSave, scope)
  }, [leaveBenefitsConfig])

  const saveContributionsConfig = useCallback(async (config?: ContributionsConfig, scope?: ConfigurationScope): Promise<ConfigurationSaveResponse> => {
    const configToSave = config || contributionsConfig
    return await saveConfigurationWithScope('contributions', configToSave, scope)
  }, [contributionsConfig])

  const saveTaxBracketsConfig = useCallback(async (config?: TaxBracketsConfig, scope?: ConfigurationScope): Promise<ConfigurationSaveResponse> => {
    const configToSave = config || taxBracketsConfig
    return await saveConfigurationWithScope('tax_brackets', configToSave, scope)
  }, [taxBracketsConfig])

  // Enhanced save function with scope support
  const saveConfigurationWithScope = useCallback(async (
    type: 'workingHours' | 'rates' | 'leaveBenefits' | 'contributions' | 'tax_brackets', 
    config: any, 
    scope?: ConfigurationScope
  ): Promise<ConfigurationSaveResponse> => {
    try {
      const response = await fetch('/api/admin/payroll/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          config,
          applicationScope: scope
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to save ${type} configuration`)
      }

      // Update unsaved changes state
      setUnsavedChanges(prev => ({ ...prev, [type]: false }))
      
      // Update original config reference
      if (originalConfigsRef.current) {
        originalConfigsRef.current[type] = { ...config }
      }

      toast.success(result.message || `${type} configuration saved successfully`)
      return {
        success: true,
        message: result.message,
        configId: result.configId
      }
    } catch (error) {
      console.error(`Error saving ${type} configuration:`, error)
      const errorMessage = error instanceof Error ? error.message : `Failed to save ${type} configuration`
      toast.error(errorMessage)
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage]
      }
    }
  }, [])

  // Fetch external data for configurations
  const fetchExternalData = useCallback(async (dataType: string) => {
    try {
      const response = await fetch(`/api/admin/payroll/external-data?type=${dataType}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch external data')
      }

      return result.data
    } catch (error) {
      console.error('Error fetching external data:', error)
      toast.error(`Failed to fetch ${dataType} data from external source`)
      return null
    }
  }, [])

  return {
    // Configuration states
    workingHoursConfig,
    setWorkingHoursConfig: setWorkingHoursConfigWithTracking,
    ratesConfig,
    setRatesConfig: setRatesConfigWithTracking,
    leaveBenefitsConfig,
    setLeaveBenefitsConfig: setLeaveBenefitsConfigWithTracking,
    contributionsConfig,
    setContributionsConfig: setContributionsConfigWithTracking,
    taxBracketsConfig,
    setTaxBracketsConfig: setTaxBracketsConfigWithTracking,
    
    // Load and save functions
    loadConfigurations,
    saveConfiguration,
    saveAllConfigurations,
    
    // Individual save functions
    saveWorkingHoursConfig,
    saveRatesConfig,
    saveLeaveBenefitsConfig,
    saveContributionsConfig,
    saveTaxBracketsConfig,
    saveConfigurationWithScope,
    
    // External data functions
    fetchExternalData,
    
    // State management
    unsavedChanges,
    hasUnsavedChanges,
    isAutoSaving
  }
}
