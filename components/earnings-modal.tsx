import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Moon, 
  CheckCircle,
  Banknote
} from "lucide-react"

interface EarningsData {
  dailyRate: number
  hourlyRate: number
  regularPay: number
  overtimePay: number
  holidayPay: number
  weekendPay: number
  nightDifferentialPay: number
  totalEarnings: number
  breakdown: {
    regularHours: { hours: number; rate: number; amount: number }
    overtime: { hours: number; rate: number; amount: number }
    holiday?: { multiplier: number; amount: number; type: string } | null
    weekend?: { multiplier: number; amount: number } | null
    nightDifferential?: { rate: number; amount: number } | null
  }
}

interface TimeoutData {
  time: string
  hoursWorked: number
  regularHours: number
  overtimeHours: number
  isHoliday: boolean
  holidayType?: string
  holidayName?: string
  isWeekend: boolean
  earnings: EarningsData
}

interface EarningsModalProps {
  isOpen: boolean
  onClose: () => void
  timeoutData: TimeoutData | null
}

export function EarningsModal({ isOpen, onClose, timeoutData }: EarningsModalProps) {
  if (!timeoutData) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-bisu-purple-deep text-xl">
            <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
            Daily Earnings Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Out Confirmation */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">Time Out Recorded</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-800">{timeoutData.time}</div>
                  <div className="text-sm text-green-600">
                    Total: {formatHours(timeoutData.hoursWorked)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Day Indicators */}
          {(timeoutData.isHoliday || timeoutData.isWeekend) && (
            <div className="flex gap-2">
              {timeoutData.isHoliday && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <Calendar className="mr-1 h-3 w-3" />
                  {timeoutData.holidayType} Holiday: {timeoutData.holidayName}
                </Badge>
              )}
              {timeoutData.isWeekend && !timeoutData.isHoliday && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Calendar className="mr-1 h-3 w-3" />
                  Weekend
                </Badge>
              )}
            </div>
          )}

          {/* Earnings Overview */}
          <Card className="border-bisu-purple-light">
            <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white">
              <CardTitle className="flex items-center text-bisu-yellow">
                <Banknote className="mr-2 h-5 w-5" />
                Today's Earnings (Gross)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-bisu-purple-deep mb-2">
                  {formatCurrency(timeoutData.earnings.totalEarnings)}
                </div>
                <div className="text-sm text-gray-600">
                  Based on {formatHours(timeoutData.hoursWorked)} worked
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Daily Rate</div>
                  <div className="font-semibold text-bisu-purple-deep">
                    {formatCurrency(timeoutData.earnings.dailyRate)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Hourly Rate</div>
                  <div className="font-semibold text-bisu-purple-deep">
                    {formatCurrency(timeoutData.earnings.hourlyRate)}
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-bisu-purple-deep mb-3">Earnings Breakdown:</h4>
                
                {/* Regular Hours */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Regular Hours ({formatHours(timeoutData.earnings.breakdown.regularHours.hours)})
                    </span>
                  </div>
                  <span className="font-medium text-bisu-purple-deep">
                    {formatCurrency(timeoutData.earnings.breakdown.regularHours.amount)}
                  </span>
                </div>

                {/* Overtime */}
                {timeoutData.earnings.breakdown.overtime.hours > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">
                        Overtime ({formatHours(timeoutData.earnings.breakdown.overtime.hours)})
                      </span>
                    </div>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(timeoutData.earnings.breakdown.overtime.amount)}
                    </span>
                  </div>
                )}

                {/* Holiday Pay */}
                {timeoutData.earnings.breakdown.holiday && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-sm">
                        Holiday Pay ({timeoutData.earnings.breakdown.holiday.multiplier}x rate)
                      </span>
                    </div>
                    <span className="font-medium text-red-600">
                      {formatCurrency(timeoutData.earnings.breakdown.holiday.amount)}
                    </span>
                  </div>
                )}

                {/* Weekend Pay */}
                {timeoutData.earnings.breakdown.weekend && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">
                        Weekend Pay ({timeoutData.earnings.breakdown.weekend.multiplier}x rate)
                      </span>
                    </div>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(timeoutData.earnings.breakdown.weekend.amount)}
                    </span>
                  </div>
                )}

                {/* Night Differential */}
                {timeoutData.earnings.breakdown.nightDifferential && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">
                        Night Differential ({(timeoutData.earnings.breakdown.nightDifferential.rate * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(timeoutData.earnings.breakdown.nightDifferential.amount)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center py-3 border-t-2 border-bisu-purple-light bg-bisu-purple-light/10 px-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-bisu-purple-deep" />
                    <span className="font-semibold text-bisu-purple-deep">Total Gross Earnings</span>
                  </div>
                  <span className="font-bold text-lg text-bisu-purple-deep">
                    {formatCurrency(timeoutData.earnings.totalEarnings)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Note */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <div className="text-amber-600 mt-0.5">ℹ️</div>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important Note:</p>
                  <p>
                    This amount represents your gross earnings for today before deductions 
                    (taxes, contributions, etc.). Your final take-home pay will be calculated 
                    during payroll processing with all applicable deductions applied.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
