"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Timer, Moon, AlertTriangle, Save } from "lucide-react"
import { motion } from "framer-motion"
import { WorkingHoursConfig } from "../types"

interface WorkingHoursCardProps {
  config: WorkingHoursConfig
  onConfigChange: (config: WorkingHoursConfig) => void
  onSave?: () => Promise<void>
}

export function WorkingHoursCard({ config, onConfigChange, onSave }: WorkingHoursCardProps) {
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

  const handleInputChange = (field: keyof WorkingHoursConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    })
  }

  const handleSelectChange = (field: keyof WorkingHoursConfig, value: string) => {
    onConfigChange({
      ...config,
      [field]: value
    })
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-lg border-2 h-full">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-light to-bisu-purple-medium text-white rounded-t-lg">
          <CardTitle className="text-bisu-yellow-DEFAULT flex items-center gap-2">
            <Timer size={20} />
            Working Hours & Attendance
          </CardTitle>
          <CardDescription className="text-bisu-yellow-light">
            Configure work schedules and attendance policies
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
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
            <h4 className="font-medium text-bisu-purple-deep flex items-center gap-2">
              <Moon size={16} />
              Night Shift Settings
            </h4>
            <div className="grid grid-cols-2 gap-4">
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
                onValueChange={(value: any) => handleSelectChange('lateDeductionBasis', value)}
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

          {onSave && (
            <Button 
              className="w-full bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium"
              onClick={onSave}
            >
              <Save size={16} className="mr-2" />
              Save Configuration
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
