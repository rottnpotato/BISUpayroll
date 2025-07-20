"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Clock, Moon, Calendar, Save } from "lucide-react"
import { motion } from "framer-motion"
import { RatesConfig } from "../types"

interface RatesConfigCardProps {
  config: RatesConfig
  onConfigChange: (config: RatesConfig) => void
  onSave?: () => Promise<void>
}

export function RatesConfigCard({ config, onConfigChange, onSave }: RatesConfigCardProps) {
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

  const handleInputChange = (field: keyof RatesConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    })
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-lg border-2 h-full">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Rates & Differentials Configuration
          </CardTitle>
          <CardDescription className="text-orange-100">
            Configure overtime rates, night differentials, and holiday pay rates
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-orange-700 flex items-center gap-2">
              <Clock size={16} />
              Overtime Rates
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">First 2 Hours (x)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="1"
                  max="3"
                  value={config.overtimeRate1.toString()}
                  onChange={(e) => handleInputChange('overtimeRate1', Math.max(1, parseFloat(e.target.value) || 1.25))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">Default: 1.25x for first 2 hours</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Beyond 2 Hours (x)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="1"
                  max="3"
                  value={config.overtimeRate2.toString()}
                  onChange={(e) => handleInputChange('overtimeRate2', Math.max(1, parseFloat(e.target.value) || 1.5))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">Default: 1.5x beyond 2 hours</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-orange-700 flex items-center gap-2">
              <Moon size={16} />
              Night Differential
            </h4>
            <div>
              <Label className="text-sm font-medium">Night Differential (%)</Label>
              <Input 
                type="number"
                min="0"
                max="50"
                value={config.nightDifferential.toString()}
                onChange={(e) => handleInputChange('nightDifferential', Math.max(0, parseFloat(e.target.value) || 10))}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">Default: 10% additional pay for night shifts (10PM-6AM)</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-orange-700 flex items-center gap-2">
              <Calendar size={16} />
              Holiday Pay Rates
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Regular Holiday (%)</Label>
                <Input 
                  type="number"
                  min="100"
                  max="300"
                  value={config.regularHolidayRate.toString()}
                  onChange={(e) => handleInputChange('regularHolidayRate', Math.max(100, parseFloat(e.target.value) || 200))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">Default: 200% (double pay)</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Special Holiday (%)</Label>
                <Input 
                  type="number"
                  min="100"
                  max="200"
                  value={config.specialHolidayRate.toString()}
                  onChange={(e) => handleInputChange('specialHolidayRate', Math.max(100, parseFloat(e.target.value) || 130))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">Default: 130% additional pay</p>
              </div>
            </div>
          </div>
          
          {onSave && (
            <Button 
              className="w-full bg-orange-600 text-white hover:bg-orange-700"
              onClick={onSave}
            >
              <Save size={16} className="mr-2" />
              Save Rates Configuration
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
