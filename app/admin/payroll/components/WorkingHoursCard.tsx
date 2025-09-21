"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Timer, AlertTriangle, Save, RefreshCw, Settings } from "lucide-react"

import { WorkingHoursConfig, ConfigurationScope, ConfigurationSaveResponse } from "../types"
import { ConfigurationScopeSelector } from "./ConfigurationScopeSelector"

interface WorkingHoursCardProps {
  config: WorkingHoursConfig
  onConfigChange: (config: WorkingHoursConfig) => void
  onSave: (config?: WorkingHoursConfig, scope?: ConfigurationScope) => Promise<ConfigurationSaveResponse>
  hasUnsavedChanges?: boolean
}

export function WorkingHoursCard({ config, onConfigChange, onSave, hasUnsavedChanges = false }: WorkingHoursCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showScopeSelector, setShowScopeSelector] = useState(false)
  const [currentScope, setCurrentScope] = useState<ConfigurationScope>({
    applicationType: 'ALL',
    isActive: true
  })

  const handleInputChange = (field: keyof WorkingHoursConfig, value: number | boolean | string) => {
    const newConfig = {
      ...config,
      [field]: value
    }
    onConfigChange(newConfig)
  }

  const handleSave = async () => {
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
        <CardHeader className="bg-gradient-to-r from-bisu-purple-light to-bisu-purple-medium text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-bisu-yellow-300 flex items-center gap-2">
                <Timer size={20} />
                Working Hours & Attendance
              </CardTitle>
              <CardDescription className="text-bisu-yellow-100">
                Configure work schedules and attendance policies
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Daily Hours</Label>
              <Input 
                type="number"
                value={config.dailyHours.toString()}
                onChange={(e) => handleInputChange('dailyHours', Math.max(1, parseInt(e.target.value) || 8))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Weekly Hours</Label>
              <Input 
                type="number"
                value={config.weeklyHours.toString()}
                onChange={(e) => handleInputChange('weeklyHours', Math.max(1, parseInt(e.target.value) || 40))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Night shift settings removed */}

          <div className="space-y-4">
            <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
              <AlertTriangle size={16} />
              Late Policy Configuration
            </h4>
            <div>
              <Label className="text-sm">Grace Period (Minutes)</Label>
              <Input 
                type="number"
                value={config.lateGraceMinutes.toString()}
                onChange={(e) => handleInputChange('lateGraceMinutes', Math.max(0, parseInt(e.target.value) || 15))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Deduction Basis</Label>
              <Select 
                value={config.lateDeductionBasis} 
                onValueChange={(value: any) => handleInputChange('lateDeductionBasis', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_minute">Per Minute</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Deduction Amount (₱)</Label>
              <Input 
                type="number"
                step="0.01"
                value={config.lateDeductionAmount.toString()}
                onChange={(e) => handleInputChange('lateDeductionAmount', Math.max(0, parseFloat(e.target.value) || 0))}
                className="mt-1"
              />
            </div>
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
