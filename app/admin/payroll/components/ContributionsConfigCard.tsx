"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Building2, 
  Save, 
  RefreshCw, 
  Settings, 
  Plus, 
  Trash2, 
  Download, 
  Globe,
  Database
} from "lucide-react"

import { toast } from "sonner"
import { 
  ContributionsConfig, 
  ContributionBracket, 
  ConfigurationScope, 
  ConfigurationSaveResponse 
} from "../types"
import { ConfigurationScopeSelector } from "./ConfigurationScopeSelector"

interface ContributionsConfigCardProps {
  config: ContributionsConfig
  onConfigChange: (config: ContributionsConfig) => void
  onSave: (config?: ContributionsConfig, scope?: ConfigurationScope) => Promise<ConfigurationSaveResponse>
  onFetchExternalData: (dataType: string) => Promise<any>
  hasUnsavedChanges?: boolean
}

export function ContributionsConfigCard({ 
  config, 
  onConfigChange, 
  onSave, 
  onFetchExternalData,
  hasUnsavedChanges = false 
}: ContributionsConfigCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [showScopeSelector, setShowScopeSelector] = useState(false)
  const [currentScope, setCurrentScope] = useState<ConfigurationScope>({
    applicationType: 'ALL',
    isActive: true
  })
  const [activeTab, setActiveTab] = useState("basic")
  const [entitlements, setEntitlements] = useState({
    gsis: true,
    philHealth: true,
    pagibig: true
  })

  const handleInputChange = (
    contribution: keyof ContributionsConfig,
    field: string,
    value: number
  ) => {
    const newConfig = {
      ...config,
      [contribution]: {
        ...(config[contribution] as any),
        [field]: value,
      },
    }
    onConfigChange(newConfig)
  }

  const handleEntitlementChange = (contributionType: keyof typeof entitlements, enabled: boolean) => {
    setEntitlements(prev => ({
      ...prev,
      [contributionType]: enabled
    }))
  }

  const handleBracketChange = (
    contributionType: 'gsis' | 'philHealth' | 'pagibig',
    index: number,
    field: keyof ContributionBracket,
    value: number | string
  ) => {
    const newConfig = { ...config }
    if (!newConfig[contributionType].brackets) {
      newConfig[contributionType].brackets = []
    }
    
    const newBrackets = [...newConfig[contributionType].brackets!]
    newBrackets[index] = {
      ...newBrackets[index],
      [field]: value,
    }
    
    newConfig[contributionType].brackets = newBrackets
    onConfigChange(newConfig)
  }

  const addBracket = (contributionType: 'gsis' | 'philHealth' | 'pagibig') => {
    const newConfig = { ...config }
    if (!newConfig[contributionType].brackets) {
      newConfig[contributionType].brackets = []
    }

    const lastBracket = newConfig[contributionType].brackets![newConfig[contributionType].brackets!.length - 1]
    const newBracket: ContributionBracket = {
      contributionType: contributionType === 'philHealth' ? 'philhealth' : contributionType,
      salaryMin: lastBracket ? lastBracket.salaryMax + 1 : 0,
      salaryMax: lastBracket ? lastBracket.salaryMax + 10000 : 10000,
      employeeRate: 0,
      employerRate: 0,
      description: `${contributionType.toUpperCase()} Bracket ${newConfig[contributionType].brackets!.length + 1}`,
      isActive: true,
      priority: 0
    }

    newConfig[contributionType].brackets!.push(newBracket)
    onConfigChange(newConfig)
  }

  const removeBracket = (contributionType: 'gsis' | 'philHealth' | 'pagibig', index: number) => {
    const newConfig = { ...config }
    if (newConfig[contributionType].brackets && newConfig[contributionType].brackets!.length > 1) {
      newConfig[contributionType].brackets!.splice(index, 1)
      onConfigChange(newConfig)
    } else {
      toast.error('At least one bracket is required')
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(config, currentScope)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchExternalData = async (dataType: string) => {
    setIsFetchingData(true)
    try {
      const externalData = await onFetchExternalData(dataType)
      if (externalData) {
        if (dataType === 'all_contributions') {
          // Merge all contribution data
          const newConfig = { ...config }
          if (externalData.gsis) {
            Object.assign(newConfig.gsis, externalData.gsis)
          }
          if (externalData.philHealth) {
            Object.assign(newConfig.philHealth, externalData.philHealth)
          }
          if (externalData.pagibig) {
            Object.assign(newConfig.pagibig, externalData.pagibig)
          }
          onConfigChange(newConfig)
          toast.success('External contribution data loaded successfully')
        } else {
          // Update specific contribution type
          const newConfig = { ...config }
          if (externalData[dataType]) {
            const targetConfig = newConfig[dataType as keyof ContributionsConfig]
            if (targetConfig && typeof targetConfig === 'object') {
              Object.assign(targetConfig, externalData[dataType])
            }
          }
          onConfigChange(newConfig)
          toast.success(`${dataType.toUpperCase()} data loaded from external source`)
        }
      }
    } catch (error) {
      console.error('Error fetching external data:', error)
    } finally {
      setIsFetchingData(false)
    }
  }

  const resetToDefaults = () => {
    const defaultConfig: ContributionsConfig = {
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
    }
    onConfigChange(defaultConfig)
    toast.info('Reset to default government contribution rates')
  }

  return (
    <div className="h-full">
      <Card className="h-full shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 size={20} />
                Government Contributions
              </CardTitle>
              <CardDescription className="text-blue-100">
                Configure mandatory government contribution rates and limits
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Unsaved
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFetchExternalData('all_contributions')}
                disabled={isFetchingData}
                className="text-white hover:bg-white/20"
                title="Fetch latest rates from government APIs"
              >
                {isFetchingData ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScopeSelector(!showScopeSelector)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {showScopeSelector && (
            <>
              <ConfigurationScopeSelector
                currentScope={currentScope}
                onScopeChange={setCurrentScope}
              />
              <Separator />
            </>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Basic Rates
              </TabsTrigger>
              <TabsTrigger value="brackets" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Salary Brackets
              </TabsTrigger>
              <TabsTrigger value="entitlements" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Entitlements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
          {/* GSIS Configuration */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">
              GSIS (Government Service Insurance System)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gsis-employee-rate">Employee Rate (%)</Label>
                <Input
                  id="gsis-employee-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={config.gsis.employeeRate}
                  onChange={(e) => handleInputChange('gsis', 'employeeRate', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gsis-employer-rate">Employer Rate (%)</Label>
                <Input
                  id="gsis-employer-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={config.gsis.employerRate}
                  onChange={(e) => handleInputChange('gsis', 'employerRate', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gsis-min-salary">Min Salary (₱)</Label>
                <Input
                  id="gsis-min-salary"
                  type="number"
                  min="0"
                  value={config.gsis.minSalary}
                  onChange={(e) => handleInputChange('gsis', 'minSalary', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gsis-max-salary">Max Salary (₱)</Label>
                <Input
                  id="gsis-max-salary"
                  type="number"
                  min="0"
                  value={config.gsis.maxSalary}
                  onChange={(e) => handleInputChange('gsis', 'maxSalary', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* PhilHealth Configuration */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">
              PhilHealth (Philippine Health Insurance Corporation)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="philhealth-employee-rate">Employee Rate (%)</Label>
                <Input
                  id="philhealth-employee-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={config.philHealth.employeeRate}
                  onChange={(e) => handleInputChange('philHealth', 'employeeRate', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="philhealth-employer-rate">Employer Rate (%)</Label>
                <Input
                  id="philhealth-employer-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={config.philHealth.employerRate}
                  onChange={(e) => handleInputChange('philHealth', 'employerRate', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="philhealth-min-contribution">Min Contribution (₱)</Label>
                <Input
                  id="philhealth-min-contribution"
                  type="number"
                  min="0"
                  value={config.philHealth.minContribution}
                  onChange={(e) => handleInputChange('philHealth', 'minContribution', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="philhealth-max-contribution">Max Contribution (₱)</Label>
                <Input
                  id="philhealth-max-contribution"
                  type="number"
                  min="0"
                  value={config.philHealth.maxContribution}
                  onChange={(e) => handleInputChange('philHealth', 'maxContribution', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="philhealth-min-salary">Min Salary (₱)</Label>
                <Input
                  id="philhealth-min-salary"
                  type="number"
                  min="0"
                  value={config.philHealth.minSalary}
                  onChange={(e) => handleInputChange('philHealth', 'minSalary', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="philhealth-max-salary">Max Salary (₱)</Label>
                <Input
                  id="philhealth-max-salary"
                  type="number"
                  min="0"
                  value={config.philHealth.maxSalary}
                  onChange={(e) => handleInputChange('philHealth', 'maxSalary', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Pag-IBIG Configuration */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">
              Pag-IBIG (Home Development Mutual Fund)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pagibig-employee-rate">Employee Rate (%)</Label>
                <Input
                  id="pagibig-employee-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={config.pagibig.employeeRate}
                  onChange={(e) => handleInputChange('pagibig', 'employeeRate', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pagibig-employer-rate">Employer Rate (%)</Label>
                <Input
                  id="pagibig-employer-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={config.pagibig.employerRate}
                  onChange={(e) => handleInputChange('pagibig', 'employerRate', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pagibig-min-contribution">Min Contribution (₱)</Label>
                <Input
                  id="pagibig-min-contribution"
                  type="number"
                  min="0"
                  value={config.pagibig.minContribution}
                  onChange={(e) => handleInputChange('pagibig', 'minContribution', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pagibig-max-contribution">Max Contribution (₱)</Label>
                <Input
                  id="pagibig-max-contribution"
                  type="number"
                  min="0"
                  value={config.pagibig.maxContribution}
                  onChange={(e) => handleInputChange('pagibig', 'maxContribution', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pagibig-min-salary">Min Salary (₱)</Label>
                <Input
                  id="pagibig-min-salary"
                  type="number"
                  min="0"
                  value={config.pagibig.minSalary}
                  onChange={(e) => handleInputChange('pagibig', 'minSalary', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pagibig-max-salary">Max Salary (₱)</Label>
                <Input
                  id="pagibig-max-salary"
                  type="number"
                  min="0"
                  value={config.pagibig.maxSalary}
                  onChange={(e) => handleInputChange('pagibig', 'maxSalary', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

            </TabsContent>

            <TabsContent value="brackets" className="space-y-6">
              {/* GSIS Brackets */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">
                    GSIS Salary Brackets
                  </h4>
                  <Button
                    onClick={() => addBracket('gsis')}
                    size="sm"
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Bracket
                  </Button>
                </div>
                {config.gsis.brackets?.map((bracket, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">GSIS Bracket {index + 1}</span>
                      {config.gsis.brackets!.length > 1 && (
                        <Button
                          onClick={() => removeBracket('gsis', index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Min Salary (₱)</Label>
                        <Input
                          type="number"
                          value={bracket.salaryMin}
                          onChange={(e) => handleBracketChange('gsis', index, 'salaryMin', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Salary (₱)</Label>
                        <Input
                          type="number"
                          value={bracket.salaryMax}
                          onChange={(e) => handleBracketChange('gsis', index, 'salaryMax', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Employee Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.employeeRate}
                          onChange={(e) => handleBracketChange('gsis', index, 'employeeRate', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Employer Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.employerRate}
                          onChange={(e) => handleBracketChange('gsis', index, 'employerRate', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PhilHealth Brackets */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">
                    PhilHealth Salary Brackets
                  </h4>
                  <Button
                    onClick={() => addBracket('philHealth')}
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Bracket
                  </Button>
                </div>
                {config.philHealth.brackets?.map((bracket, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">PhilHealth Bracket {index + 1}</span>
                      {config.philHealth.brackets!.length > 1 && (
                        <Button
                          onClick={() => removeBracket('philHealth', index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Min Salary (₱)</Label>
                        <Input
                          type="number"
                          value={bracket.salaryMin}
                          onChange={(e) => handleBracketChange('philHealth', index, 'salaryMin', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Salary (₱)</Label>
                        <Input
                          type="number"
                          value={bracket.salaryMax}
                          onChange={(e) => handleBracketChange('philHealth', index, 'salaryMax', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Employee Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.employeeRate}
                          onChange={(e) => handleBracketChange('philHealth', index, 'employeeRate', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Employer Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.employerRate}
                          onChange={(e) => handleBracketChange('philHealth', index, 'employerRate', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pag-IBIG Brackets */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">
                    Pag-IBIG Salary Brackets
                  </h4>
                  <Button
                    onClick={() => addBracket('pagibig')}
                    size="sm"
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Bracket
                  </Button>
                </div>
                {config.pagibig.brackets?.map((bracket, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Pag-IBIG Bracket {index + 1}</span>
                      {config.pagibig.brackets!.length > 1 && (
                        <Button
                          onClick={() => removeBracket('pagibig', index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Min Salary (₱)</Label>
                        <Input
                          type="number"
                          value={bracket.salaryMin}
                          onChange={(e) => handleBracketChange('pagibig', index, 'salaryMin', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Salary (₱)</Label>
                        <Input
                          type="number"
                          value={bracket.salaryMax}
                          onChange={(e) => handleBracketChange('pagibig', index, 'salaryMax', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Employee Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.employeeRate}
                          onChange={(e) => handleBracketChange('pagibig', index, 'employeeRate', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Employer Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.employerRate}
                          onChange={(e) => handleBracketChange('pagibig', index, 'employerRate', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="entitlements" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Employee Benefit Entitlements
                </h4>
                <p className="text-blue-700 text-sm">
                  Configure which government contributions apply to employees. Disabled contributions will not be calculated in payroll processing.
                </p>
              </div>

              {/* GSIS Entitlement */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900">GSIS (Government Service Insurance System)</h5>
                    <p className="text-sm text-gray-600">Mandatory for permanent government employees</p>
                  </div>
                  <Switch
                    checked={entitlements.gsis}
                    onCheckedChange={(checked) => handleEntitlementChange('gsis', checked)}
                  />
                </div>
                {!entitlements.gsis && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-700 text-sm">
                      ⚠️ GSIS is typically mandatory for government employees. Disabling may affect compliance.
                    </p>
                  </div>
                )}
              </div>

              {/* PhilHealth Entitlement */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900">PhilHealth (Philippine Health Insurance)</h5>
                    <p className="text-sm text-gray-600">Universal health insurance coverage</p>
                  </div>
                  <Switch
                    checked={entitlements.philHealth}
                    onCheckedChange={(checked) => handleEntitlementChange('philHealth', checked)}
                  />
                </div>
                {!entitlements.philHealth && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-700 text-sm">
                      ⚠️ PhilHealth is mandatory for all Filipino employees under Republic Act 7875.
                    </p>
                  </div>
                )}
              </div>

              {/* Pag-IBIG Entitlement */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900">Pag-IBIG (Home Development Mutual Fund)</h5>
                    <p className="text-sm text-gray-600">Housing and savings program for employees</p>
                  </div>
                  <Switch
                    checked={entitlements.pagibig}
                    onCheckedChange={(checked) => handleEntitlementChange('pagibig', checked)}
                  />
                </div>
                {!entitlements.pagibig && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-700 text-sm">
                      ℹ️ Pag-IBIG membership is generally optional but highly recommended for housing benefits.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-2">Active Contributions Summary</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className={`p-2 rounded ${entitlements.gsis ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    <span className="font-medium">GSIS:</span> {entitlements.gsis ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className={`p-2 rounded ${entitlements.philHealth ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    <span className="font-medium">PhilHealth:</span> {entitlements.philHealth ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className={`p-2 rounded ${entitlements.pagibig ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    <span className="font-medium">Pag-IBIG:</span> {entitlements.pagibig ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasUnsavedChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 self-center">
                Unsaved changes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}