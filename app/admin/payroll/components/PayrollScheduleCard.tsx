"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Plus, Save, Clock, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { PayrollSchedule, ScheduleFormData } from "../types"
import { ScheduleDialog } from "./ScheduleDialog"
import { toast } from "sonner"

interface PayrollScheduleCardProps {
  schedules: PayrollSchedule[]
  onRefresh: () => void
}

export function PayrollScheduleCard({
  schedules,
  onRefresh
}: PayrollScheduleCardProps) {
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  const formatCutoffType = (type?: string) => {
    switch (type) {
      case 'bi-monthly': return 'Bi-Monthly'
      case 'monthly': return 'Monthly'
      case 'weekly': return 'Weekly'
      default: return 'Bi-Monthly'
    }
  }

  const handleToggleStatus = async (schedule: PayrollSchedule) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/payroll/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !schedule.isActive
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update schedule status')
      }

      toast.success(`Schedule ${!schedule.isActive ? 'activated' : 'deactivated'} successfully`)
      onRefresh()
    } catch (error) {
      console.error('Error toggling schedule status:', error)
      toast.error('Failed to update schedule status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSchedule = async (formData: ScheduleFormData): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/payroll/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create schedule')
      }

      toast.success('Payroll schedule created successfully')
      onRefresh()
      return true
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create payroll schedule')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div variants={itemVariants} className="h-full ">
      <Card className="shadow-lg border-2 h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-bisu-yellow-DEFAULT to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays size={20} />
                Payroll Schedules
              </CardTitle>
              <CardDescription className="text-bisu-purple-medium">
                Configure payroll release dates and cutoff periods
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddScheduleDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-bisu-purple-medium hover:bg-bisu-purple-light text-bisu-purple-deep"
              disabled={isLoading}
            >
              <Plus size={16} className="mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500 flex-1 flex flex-col justify-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No schedules configured</p>
                <p className="text-sm mt-1">Create a new schedule to manage payroll releases</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-bisu-purple-deep">{schedule.name}</h4>
                        {schedule.isActive && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <Switch 
                        checked={schedule.isActive} 
                        onCheckedChange={() => handleToggleStatus(schedule)}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-bisu-purple-medium" />
                          <span className="font-medium text-gray-700">Cutoff Type:</span>
                        </div>
                        <p className="text-gray-600 ml-4">{formatCutoffType(schedule.cutoffType)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-bisu-purple-medium" />
                          <span className="font-medium text-gray-700">Processing Time:</span>
                        </div>
                        <p className="text-gray-600 ml-4">{schedule.processHour}:{schedule.processMinute.toString().padStart(2, '0')}</p>
                      </div>
                      
                      {schedule.payrollReleaseDay && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-bisu-purple-medium" />
                            <span className="font-medium text-gray-700">Release Day:</span>
                          </div>
                          <p className="text-gray-600 ml-4">{schedule.payrollReleaseDay}{schedule.payrollReleaseDay === 1 ? 'st' : schedule.payrollReleaseDay === 2 ? 'nd' : schedule.payrollReleaseDay === 3 ? 'rd' : 'th'} of month</p>
                        </div>
                      )}
                      
                      {schedule.cutoffDays && schedule.cutoffDays.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-bisu-purple-medium" />
                            <span className="font-medium text-gray-700">Cutoff Days:</span>
                          </div>
                          <p className="text-gray-600 ml-4">{formatDays(schedule.cutoffDays)}</p>
                        </div>
                      )}
                    </div>
                    
                    {schedule.description && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500">{schedule.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ScheduleDialog
        isOpen={isAddScheduleDialogOpen}
        onClose={() => setIsAddScheduleDialogOpen(false)}
        onSubmit={handleAddSchedule}
        isLoading={isLoading}
      />
    </motion.div>
  )
}
