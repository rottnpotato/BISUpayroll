"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Save } from "lucide-react"
import { motion } from "framer-motion"
import { LeaveBenefitsConfig } from "../types"

interface LeaveBenefitsCardProps {
  config: LeaveBenefitsConfig
  onConfigChange: (config: LeaveBenefitsConfig) => void
  onSave?: () => Promise<void>
}

export function LeaveBenefitsCard({ config, onConfigChange, onSave }: LeaveBenefitsCardProps) {
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

  const handleInputChange = (field: keyof LeaveBenefitsConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    })
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-lg border-2 h-full">
        <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Leave Benefits Configuration
          </CardTitle>
          <CardDescription className="text-teal-100">
            Configure annual leave entitlements for government employees
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-xs text-gray-600 mt-1">Government standard: 15 days</p>
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
              <p className="text-xs text-gray-600 mt-1">Government standard: 7 days</p>
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
              <p className="text-xs text-gray-600 mt-1">Government standard: 5 days</p>
            </div>
          </div>
          
          {onSave && (
            <Button 
              className="w-full bg-teal-600 text-white hover:bg-teal-700"
              onClick={onSave}
            >
              <Save size={16} className="mr-2" />
              Save Leave Benefits Configuration
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
