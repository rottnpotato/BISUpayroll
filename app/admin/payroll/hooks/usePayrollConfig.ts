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
// Client code must not import server-only Prisma services. Use API routes instead.
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
    lateGraceMinutes: 15,
    lateDeductionBasis: "per_minute",
    lateDeductionAmount: 0
  })

  const [ratesConfig, setRatesConfig] = useState<RatesConfig>({
    overtimeRate1: 1.25,
    overtimeRate2: 1.5,
    regularHolidayRate: 2,
    specialHolidayRate: 1.3,
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
      employeeRate: 0,
      employerRate: 0,
      minSalary: 0,
      maxSalary: 0
    },
    philHealth: {
      employeeRate: 0,
      employerRate: 0,
      minContribution: 0,
      maxContribution: 0,
      minSalary: 0,
      maxSalary: 0
    },
    pagibig: {
      employeeRate: 0,
      employerRate: 0,
      minContribution: 0,
      maxContribution: 0,
      minSalary: 0,
      maxSalary: 0
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

  // Save configuration to database via API route (client-safe)
  const saveConfiguration = useCallback(async (type: 'workingHours' | 'rates' | 'leaveBenefits' | 'contributions' | 'taxBrackets', config: any) => {
    try {
      const normalizedType = type === 'workingHours'
        ? 'workingHours'
        : type === 'rates'
          ? 'rates'
          : type === 'leaveBenefits'
            ? 'leaveBenefits'
            : type === 'contributions'
              ? 'contributions'
              : 'taxBrackets'

      const response = await fetch('/api/admin/payroll/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: normalizedType, config })
      })
      const result = await response.json()

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to save ${normalizedType} configuration`)
      }

      return true
    } catch (error) {
      console.error(`Error saving ${type} configuration:`, error)
      toast.error(`Failed to save ${type} configuration`)
      return false
    }
  }, [])

  // Auto-save function with debouncing
  const autoSave = useCallback((type: 'workingHours' | 'rates' | 'leaveBenefits' | 'contributions' | 'taxBrackets', config: any) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      await saveConfiguration(type, config)
      setIsAutoSaving(false)
    }, 2000)
  }, [saveConfiguration])

  // Enhanced setters with change tracking
  const setWorkingHoursConfigWithTracking = useCallback((config: WorkingHoursConfig | ((prev: WorkingHoursConfig) => WorkingHoursConfig)) => {
    setWorkingHoursConfig(prev => {
      const newConfig = typeof config === 'function' ? config(prev) : config

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

  // Load configurations from the API (client-safe)
  const loadConfigurations = async () => {
    try {
      const response = await fetch('/api/admin/payroll/config')
      const result = await response.json()

      if (!response.ok || !result?.configurations) {
        throw new Error(result?.error || 'Failed to load configurations')
      }

      const bundle = result.configurations

      setWorkingHoursConfig(bundle.workingHours)
      setRatesConfig(bundle.rates)
      setLeaveBenefitsConfig(bundle.leaveBenefits)
      setContributionsConfig(bundle.contributions)
      setTaxBracketsConfig(bundle.taxBrackets)

      originalConfigsRef.current = {
        workingHours: bundle.workingHours,
        rates: bundle.rates,
        leaveBenefits: bundle.leaveBenefits,
        contributions: bundle.contributions,
        taxBrackets: bundle.taxBrackets
      }
    } catch (error) {
      console.error('Error loading configurations:', error)
      toast.error('Failed to load configurations')
    }
  }

  // Manual save function for immediate saves
  const saveAllConfigurations = async () => {
    const sections = ['workingHours', 'rates', 'leaveBenefits', 'contributions', 'taxBrackets'] as const
    const promises: Promise<boolean>[] = [
      unsavedChanges.workingHours ? saveConfiguration('workingHours', workingHoursConfig) : Promise.resolve(true),
      unsavedChanges.rates ? saveConfiguration('rates', ratesConfig) : Promise.resolve(true),
      unsavedChanges.leaveBenefits ? saveConfiguration('leaveBenefits', leaveBenefitsConfig) : Promise.resolve(true),
      unsavedChanges.contributions ? saveConfiguration('contributions', contributionsConfig) : Promise.resolve(true),
      unsavedChanges.taxBrackets ? saveConfiguration('taxBrackets', taxBracketsConfig) : Promise.resolve(true)
    ]

    const results = await Promise.all(promises)
    const allSaved = results.every(Boolean)
    if (allSaved) {
      toast.success('All configurations saved successfully')
    } else {
      const failedSections: string[] = []
      results.forEach((ok, idx) => {
        const section = sections[idx]
        if (!ok && (unsavedChanges as any)[section]) failedSections.push(section)
      })
      const message = failedSections.length
        ? `Some configurations failed to save: ${failedSections.join(', ')}`
        : 'Some configurations failed to save.'
      toast.error(message)
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
    return await saveConfigurationWithScope('taxBrackets', configToSave, scope)
  }, [taxBracketsConfig])

  // Enhanced save function with scope support
  const saveConfigurationWithScope = useCallback(async (
    type: 'workingHours' | 'rates' | 'leaveBenefits' | 'contributions' | 'taxBrackets',
    config: any,
    scope?: ConfigurationScope
  ): Promise<ConfigurationSaveResponse> => {
    try {
      const response = await fetch('/api/admin/payroll/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config: { ...config, applicationScope: scope } })
      })
      const result = await response.json()

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to save ${type} configuration`)
      }

      setUnsavedChanges(prev => ({ ...prev, [type]: false }))

      if (originalConfigsRef.current) {
        (originalConfigsRef.current as any)[type] = { ...config }
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
