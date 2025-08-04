"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calculator, Save, RefreshCw, Plus, Trash2, Settings, Globe } from "lucide-react"

import { toast } from "sonner"
import { ConfigurationScope, ConfigurationSaveResponse } from "../types"
import { ConfigurationScopeSelector } from "./ConfigurationScopeSelector"
import { Separator } from "@/components/ui/separator"

export interface TaxBracket {
  id?: string
  min: number
  max: number
  rate: number
  description: string
}

export interface TaxBracketsConfig {
  brackets: TaxBracket[]
  withholdingEnabled: boolean
  showBreakdownOnPayslip: boolean
  autoComputeTax: boolean
}

interface TaxBracketsConfigCardProps {
  config: TaxBracketsConfig
  onConfigChange: (config: TaxBracketsConfig) => void
  onSave?: (config?: TaxBracketsConfig, scope?: ConfigurationScope) => Promise<ConfigurationSaveResponse>
  onFetchExternalData?: (dataType: string) => Promise<any>
  hasUnsavedChanges?: boolean
}

export function TaxBracketsConfigCard({ config, onConfigChange, onSave, onFetchExternalData, hasUnsavedChanges = false }: TaxBracketsConfigCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [showScopeSelector, setShowScopeSelector] = useState(false)
  const [currentScope, setCurrentScope] = useState<ConfigurationScope>({
    applicationType: 'ALL',
    isActive: true
  })

  const handleBracketChange = (index: number, field: keyof TaxBracket, value: number | string) => {
    const newBrackets = [...config.brackets]
    newBrackets[index] = {
      ...newBrackets[index],
      [field]: field === 'rate' || field === 'min' || field === 'max' ? Number(value) : value,
    }

    const newConfig = {
      ...config,
      brackets: newBrackets,
    }
    onConfigChange(newConfig)
  }

  const addBracket = () => {
    const lastBracket = config.brackets[config.brackets.length - 1]
    const newBracket: TaxBracket = {
      min: lastBracket ? lastBracket.max + 1 : 0,
      max: lastBracket ? lastBracket.max + 10000 : 10000,
      rate: 0,
      description: 'New tax bracket',
    }

    const newConfig = {
      ...config,
      brackets: [...config.brackets, newBracket],
    }
    onConfigChange(newConfig)
  }

  const removeBracket = (index: number) => {
    if (config.brackets.length <= 1) {
      toast.error('At least one tax bracket is required')
      return
    }

    const newBrackets = config.brackets.filter((_, i) => i !== index)
    const newConfig = {
      ...config,
      brackets: newBrackets,
    }
    onConfigChange(newConfig)
  }

  const handleSettingChange = (field: keyof TaxBracketsConfig, value: boolean) => {
    const newConfig = {
      ...config,
      [field]: value,
    }
    onConfigChange(newConfig)
  }

  const handleSave = async () => {
    if (!onSave) return
    setIsLoading(true)
    try {
      await onSave(config, currentScope)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchExternalData = async (dataType: string) => {
    if (!onFetchExternalData) return
    setIsFetchingData(true)
    try {
      const externalData = await onFetchExternalData(dataType)
      if (externalData && externalData.brackets) {
        const newConfig = {
          ...config,
          brackets: externalData.brackets.map((bracket: any) => ({
            ...bracket,
            source: 'api',
            apiReference: `BIR-${new Date().getFullYear()}`
          }))
        }
        onConfigChange(newConfig)
        toast.success('Tax brackets updated from external source')
      }
    } catch (error) {
      console.error('Error fetching external data:', error)
      toast.error('Failed to fetch tax brackets from external source')
    } finally {
      setIsFetchingData(false)
    }
  }

  const resetToDefaults = () => {
    const defaultConfig: TaxBracketsConfig = {
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
    }
    onConfigChange(defaultConfig)
    toast.info('Reset to default Philippine tax brackets (TRAIN Law)')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="h-full">
      <Card className="h-full shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator size={20} />
                Tax Brackets Configuration
              </CardTitle>
              <CardDescription className="text-red-100">
                Configure Philippines income tax brackets and withholding settings
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
                onClick={() => handleFetchExternalData('tax_brackets')}
                disabled={isFetchingData}
                className="text-white hover:bg-white/20"
                title="Fetch latest tax brackets from BIR"
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
          {/* Tax Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">
              Tax Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="withholding-enabled" className="text-sm">
                  Enable Withholding Tax
                </Label>
                <input
                  id="withholding-enabled"
                  type="checkbox"
                  checked={config.withholdingEnabled}
                  onChange={(e) => handleSettingChange('withholdingEnabled', e.target.checked)}
                  className="toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-breakdown" className="text-sm">
                  Show Tax Breakdown
                </Label>
                <input
                  id="show-breakdown"
                  type="checkbox"
                  checked={config.showBreakdownOnPayslip}
                  onChange={(e) => handleSettingChange('showBreakdownOnPayslip', e.target.checked)}
                  className="toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-compute" className="text-sm">
                  Auto Compute Tax
                </Label>
                <input
                  id="auto-compute"
                  type="checkbox"
                  checked={config.autoComputeTax}
                  onChange={(e) => handleSettingChange('autoComputeTax', e.target.checked)}
                  className="toggle"
                />
              </div>
            </div>
          </div>

          {/* Tax Brackets */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-900 border-b pb-2">
                Income Tax Brackets (Monthly)
              </h4>
              <Button
                onClick={addBracket}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Bracket
              </Button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {config.brackets.map((bracket, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Bracket {index + 1}</span>
                    {config.brackets.length > 1 && (
                      <Button
                        onClick={() => removeBracket(index)}
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
                      <Label className="text-xs">Min Amount (₱)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={bracket.min}
                        onChange={(e) => handleBracketChange(index, 'min', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Amount (₱)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={bracket.max}
                        onChange={(e) => handleBracketChange(index, 'max', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={bracket.rate}
                        onChange={(e) => handleBracketChange(index, 'rate', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="md:col-span-1 col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Input
                        type="text"
                        value={bracket.description}
                        onChange={(e) => handleBracketChange(index, 'description', e.target.value)}
                        className="text-sm"
                        placeholder="Bracket description"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <strong>Range:</strong> {formatCurrency(bracket.min)} - {bracket.max === 999999999 ? 'Above' : formatCurrency(bracket.max)} | 
                    <strong> Rate:</strong> {bracket.rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasUnsavedChanges}
              className="bg-red-600 hover:bg-red-700 text-white"
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
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Philippine TRAIN Law
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