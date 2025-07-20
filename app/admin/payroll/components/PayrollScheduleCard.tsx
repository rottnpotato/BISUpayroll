"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CalendarDays, Plus, Save } from "lucide-react"
import { motion } from "framer-motion"
import { PayrollSchedule, ScheduleFormData } from "../types"
import { ScheduleDialog } from "./ScheduleDialog"

interface PayrollScheduleCardProps {
  schedules: PayrollSchedule[]
  onToggleStatus: (schedule: PayrollSchedule) => Promise<boolean>
  onSaveProcessingTime: () => Promise<void>
  scheduleFormData: ScheduleFormData
  onScheduleFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PayrollScheduleCard({
  schedules,
  onToggleStatus,
  onSaveProcessingTime,
  scheduleFormData,
  onScheduleFormChange
}: PayrollScheduleCardProps) {
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false)

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

  const formatDays = (days: number[]) => {
    return days.map(day => {
      if (day === 15 || day === 30) return `${day}th`
      if (day === 31) return "End of Month"
      return `${day}th`
    }).join(", ")
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-lg border-2 h-full">
        <CardHeader className="bg-gradient-to-r from-bisu-yellow-DEFAULT to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays size={20} />
                Payroll Schedule
              </CardTitle>
              <CardDescription className="text-bisu-purple-medium">
                Configure processing schedules and cutoff dates
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddScheduleDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-bisu-purple-medium hover:bg-bisu-purple-light"
            >
              <Plus size={16} className="mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No schedules configured. Create a new schedule to begin.
              </div>
            ) : (
              schedules.map((schedule) => (
                <div 
                  key={schedule.id} 
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{schedule.name}</h4>
                      {schedule.isActive && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Payment Days: {formatDays(schedule.days)}</p>
                      <p>Processing Time: {schedule.processHour}:{schedule.processMinute.toString().padStart(2, '0')}</p>
                      {schedule.cutoffDays && schedule.cutoffDays.length > 0 && (
                        <p>Cutoff Days: {formatDays(schedule.cutoffDays)}</p>
                      )}
                    </div>
                  </div>
                  <Switch 
                    checked={schedule.isActive} 
                    onCheckedChange={() => onToggleStatus(schedule)}
                  />
                </div>
              ))
            )}
            
            {schedules.some(s => s.isActive) && (
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-3">Processing Time Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Hour (24h format)</Label>
                    <Input 
                      type="number"
                      min="0"
                      max="23"
                      name="processHour"
                      value={scheduleFormData.processHour.toString()}
                      onChange={onScheduleFormChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Minute</Label>
                    <Input 
                      type="number"
                      min="0"
                      max="59"
                      name="processMinute"
                      value={scheduleFormData.processMinute.toString()}
                      onChange={onScheduleFormChange}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium"
                  onClick={onSaveProcessingTime}
                >
                  <Save size={16} className="mr-2" />
                  Save Processing Time
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ScheduleDialog
        isOpen={isAddScheduleDialogOpen}
        onClose={() => setIsAddScheduleDialogOpen(false)}
        onSubmit={async () => {
          // This would be handled by parent component
          setIsAddScheduleDialogOpen(false)
          return true
        }}
        formData={scheduleFormData}
        onFormChange={onScheduleFormChange}
        onDayToggle={() => {}} // Would be passed from parent
      />
    </motion.div>
  )
}
