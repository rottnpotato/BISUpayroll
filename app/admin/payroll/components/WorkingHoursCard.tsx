"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Timer, Moon, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { WorkingHoursConfig } from "../types"

interface WorkingHoursCardProps {
  config: WorkingHoursConfig
  onConfigChange: (config: WorkingHoursConfig) => void
}

export function WorkingHoursCard({ config, onConfigChange }: WorkingHoursCardProps) {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const handleInputChange = (field: keyof WorkingHoursConfig, value: number | boolean | string) => {
    const newConfig = {
      ...config,
      [field]: value
    }
    onConfigChange(newConfig)
  }

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Card className="shadow-lg border-2 h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-light to-bisu-purple-medium text-white rounded-t-lg">
          <CardTitle className="text-bisu-yellow-DEFAULT flex items-center gap-2">
            <Timer size={20} />
            Working Hours & Attendance
          </CardTitle>
          <CardDescription className="text-bisu-yellow-light">
            Configure work schedules and attendance policies
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 flex-1">
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
                <Moon size={16} />
                Night Shift Settings
              </h4>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Enable Night Shift</Label>
                <Switch
                  checked={config.nightShiftEnabled}
                  onCheckedChange={(checked) => handleInputChange('nightShiftEnabled', checked)}
                />
              </div>
            </div>
            
            {config.nightShiftEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-bisu-purple-light">
                <div>
                  <Label className="text-sm">Start Time (24h)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="23"
                    value={config.nightShiftStart.toString()}
                    onChange={(e) => handleInputChange('nightShiftStart', Math.min(23, Math.max(0, parseInt(e.target.value) || 22)))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">End Time (24h)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="23"
                    value={config.nightShiftEnd.toString()}
                    onChange={(e) => handleInputChange('nightShiftEnd', Math.min(23, Math.max(0, parseInt(e.target.value) || 6)))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

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

          <div className="bg-bisu-yellow-extralight p-4 rounded-lg">
            <h5 className="font-medium text-bisu-purple-deep mb-2">Auto-Save Information</h5>
            <p className="text-sm text-bisu-purple-medium">
              All changes are automatically saved to the database. Configuration changes are applied system-wide.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
