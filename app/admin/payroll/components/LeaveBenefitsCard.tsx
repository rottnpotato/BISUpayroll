"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, Save, RefreshCw, Settings } from "lucide-react"

import { LeaveBenefitsConfig, ConfigurationScope, ConfigurationSaveResponse } from "../types"
import { ConfigurationScopeSelector } from "./ConfigurationScopeSelector"

interface LeaveBenefitsCardProps {
  config: LeaveBenefitsConfig
  onConfigChange: (config: LeaveBenefitsConfig) => void
  onSave?: (config?: LeaveBenefitsConfig, scope?: ConfigurationScope) => Promise<ConfigurationSaveResponse>
  hasUnsavedChanges?: boolean
}

export function LeaveBenefitsCard({ config, onConfigChange, onSave, hasUnsavedChanges = false }: LeaveBenefitsCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showScopeSelector, setShowScopeSelector] = useState(false)
  const [currentScope, setCurrentScope] = useState<ConfigurationScope>({
    applicationType: 'ALL',
    isActive: true
  })

  const handleInputChange = (field: keyof LeaveBenefitsConfig, value: number) => {
    const newConfig = {
      ...config,
      [field]: value
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

  return (
    <div className="h-full">
      <Card className="shadow-lg border-2 h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-medium to-bisu-purple-deep text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-bisu-yellow flex items-center gap-2">
                <Users size={20} />
                Leave Benefits Configuration
              </CardTitle>
              <CardDescription className="text-bisu-yellow-light">
                Configure annual leave entitlements for government employees (Philippine standards)
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
                onClick={() => setShowScopeSelector(!showScopeSelector)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 flex-1">
          {showScopeSelector && (
            <>
              <ConfigurationScopeSelector
                currentScope={currentScope}
                onScopeChange={setCurrentScope}
              />
              <Separator />
            </>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-sm font-medium">Vacation Leave (days/year)</Label>
              <Input 
                type="number"
                min="0"
                max="30"
                value={config.vacationLeave.toString()}
                onChange={(e) => handleInputChange('vacationLeave', Math.max(0, parseInt(e.target.value) || 15))}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">Philippine government standard: 15 days</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Sick Leave (days/year)</Label>
              <Input 
                type="number"
                min="0"
                max="15"
                value={config.sickLeave.toString()}
                onChange={(e) => handleInputChange('sickLeave', Math.max(0, parseInt(e.target.value) || 7))}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">Philippine government standard: 7 days</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Service Incentive Leave (days/year)</Label>
              <Input 
                type="number"
                min="0"
                max="10"
                value={config.serviceIncentiveLeave.toString()}
                onChange={(e) => handleInputChange('serviceIncentiveLeave', Math.max(0, parseInt(e.target.value) || 5))}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">Philippine government standard: 5 days</p>
            </div>
            {config.maternityLeave !== undefined && (
              <div>
                <Label className="text-sm font-medium">Maternity Leave (days)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="120"
                  value={config.maternityLeave.toString()}
                  onChange={(e) => handleInputChange('maternityLeave', Math.max(0, parseInt(e.target.value) || 105))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">Philippine standard: 105 days (15 weeks)</p>
              </div>
            )}
            {config.paternityLeave !== undefined && (
              <div>
                <Label className="text-sm font-medium">Paternity Leave (days)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="14"
                  value={config.paternityLeave.toString()}
                  onChange={(e) => handleInputChange('paternityLeave', Math.max(0, parseInt(e.target.value) || 7))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">Philippine standard: 7 days</p>
              </div>
            )}
          </div>

          <div className="bg-bisu-purple-extralight p-4 rounded-lg">
            <h5 className="font-medium text-bisu-purple-deep mb-2">Philippine Leave Benefits</h5>
            <p className="text-sm text-bisu-purple-medium">
              All leave benefits are configured according to Philippine Civil Service Commission standards for government employees.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasUnsavedChanges}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
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
