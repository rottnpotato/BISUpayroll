"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus } from "lucide-react"
import { motion } from "framer-motion"
import { HolidayType } from "../types"
import { philippineHolidays } from "../constants"

interface HolidayConfigCardProps {
  holidays?: HolidayType[]
  onToggleHoliday?: (holiday: HolidayType) => Promise<boolean>
  onAddHoliday?: () => void
}

export function HolidayConfigCard({ 
  holidays = philippineHolidays, 
  onToggleHoliday,
  onAddHoliday 
}: HolidayConfigCardProps) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getHolidayTypeColor = (type: 'regular' | 'special') => {
    return type === 'regular' 
      ? "bg-red-100 text-red-800" 
      : "bg-blue-100 text-blue-800"
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-lg border-2 h-full">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Holiday Configuration
              </CardTitle>
              <CardDescription className="text-green-100">
                Manage government holidays and pay multipliers
              </CardDescription>
            </div>
            {onAddHoliday && (
              <Button
                onClick={onAddHoliday}
                variant="outline"
                size="sm"
                className="border-white text-white hover:bg-white hover:text-green-700"
              >
                <Plus size={16} className="mr-2" />
                Add Holiday
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="space-y-3 max-h-[28rem] overflow-y-auto">
            {holidays.map((holiday) => (
              <div 
                key={holiday.id} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{holiday.name}</h4>
                    <Badge className={`text-xs ${getHolidayTypeColor(holiday.type)}`}>
                      {holiday.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>{formatDate(holiday.date)} • {holiday.payMultiplier}x pay</p>
                    {holiday.description && (
                      <p className="mt-1 truncate">{holiday.description}</p>
                    )}
                  </div>
                </div>
                <Switch 
                  checked={holiday.isActive} 
                  onCheckedChange={() => onToggleHoliday?.(holiday)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
