"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Clock, Calendar, Save, Settings, RefreshCw, Check } from "lucide-react"

import { RatesConfig, ConfigurationScope, ConfigurationSaveResponse } from "../types"
import { ConfigurationScopeSelector } from "./ConfigurationScopeSelector"
import { toast } from "sonner"

interface RatesConfigCardProps {
  config: RatesConfig
  onConfigChange: (config: RatesConfig) => void
  onSave?: (config?: RatesConfig, scope?: ConfigurationScope) => Promise<ConfigurationSaveResponse>
  hasUnsavedChanges?: boolean
}

export function RatesConfigCard({ config, onConfigChange, onSave, hasUnsavedChanges = false }: RatesConfigCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showScopeSelector, setShowScopeSelector] = useState(false)
  const [currentScope, setCurrentScope] = useState<ConfigurationScope>({
    applicationType: 'ALL',
    isActive: true
  })

  const handleInputChange = (field: keyof RatesConfig, value: number) => {
    const newConfig = {
      ...config,
      [field]: value,
      currency: 'PHP' as const
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

  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(0)}%`

  return (
    <div className="h-full">
      <Card className="shadow-lg border-2 h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-bisu-yellow to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Rates & Differentials Configuration
              </CardTitle>
              <CardDescription className="text-bisu-purple-medium">
                Configure overtime and holiday pay rates (PHP)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Unsaved
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScopeSelector(!showScopeSelector)}
                className="text-bisu-purple-deep hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 flex-1 flex flex-col">
          {showScopeSelector && (
            <>
              <ConfigurationScopeSelector
                currentScope={currentScope}
                onScopeChange={setCurrentScope}
              />
              <Separator />
            </>
          )}
          <div className="space-y-4">
            <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
              <Clock size={16} />
              Overtime Rates
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">First 2 Hours (x)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.01"
                    min="1"
                    max="3"
                    value={config.overtimeRate1.toString()}
                    onChange={(e) => handleInputChange('overtimeRate1', Math.max(1, parseFloat(e.target.value) || 1.25))}
                    className="mt-1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    x
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Currently: {formatPercentage(config.overtimeRate1 - 1)} above base</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Beyond 2 Hours (x)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.01"
                    min="1"
                    max="3"
                    value={config.overtimeRate2.toString()}
                    onChange={(e) => handleInputChange('overtimeRate2', Math.max(1, parseFloat(e.target.value) || 1.5))}
                    className="mt-1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    x
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Currently: {formatPercentage(config.overtimeRate2 - 1)} above base</p>
              </div>
            </div>
          </div>

          {/* Night differential removed */}

          <div className="space-y-4">
            <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
              <Calendar size={16} />
              Holiday Pay Rates
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Regular Holiday (%)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    min="100"
                    max="300"
                    value={config.regularHolidayRate.toString()}
                    onChange={(e) => handleInputChange('regularHolidayRate', Math.max(100, parseFloat(e.target.value) || 200))}
                    className="mt-1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Total pay rate for regular holidays</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Special Holiday (%)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    min="100"
                    max="200"
                    value={config.specialHolidayRate.toString()}
                    onChange={(e) => handleInputChange('specialHolidayRate', Math.max(100, parseFloat(e.target.value) || 130))}
                    className="mt-1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Total pay rate for special holidays</p>
              </div>
            </div>
          </div>

          <div className="bg-bisu-yellow-extralight p-4 rounded-lg">
            <h5 className="font-medium text-bisu-purple-deep mb-2">Currency Information</h5>
            <p className="text-sm text-bisu-purple-medium">
              All rates are configured in Philippine Peso (₱ PHP) as per Philippine labor standards.
            </p>
          </div>
          
          <div className="mt-auto">
            <Button 
              className="w-full bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium disabled:opacity-50"
              onClick={handleSave}
              disabled={isLoading || !hasUnsavedChanges}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save size={16} className="mr-2" />
                  Save Configuration
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Configuration Saved
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
