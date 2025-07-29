import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ArrowRight, AlertCircle, Clock, FileText, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import EmptyState from "./EmptyState"

interface PayrollSchedule {
  id: string
  name: string
  days: number[]
  isActive: boolean
  cutoffDays?: number[]
  payrollReleaseDay?: number
  cutoffType?: string
  paymentMethod?: string
  description?: string
}

export default function ScheduleCard() {
  const [payrollEvents, setPayrollEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  useEffect(() => {
    const fetchPayrollSchedules = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch active schedules
        const response = await fetch('/api/admin/payroll/schedules?isActive=true')
        if (!response.ok) {
          throw new Error('Failed to fetch schedules')
        }
        
        const data = await response.json()
        const schedules: PayrollSchedule[] = data.schedules || []
        
        if (schedules.length === 0) {
          setPayrollEvents([])
          return
        }
        
        // Generate upcoming payroll events based on active schedules
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const events: any[] = []
        
        schedules.forEach(schedule => {
          if (schedule.isActive && schedule.days && schedule.days.length > 0) {
            schedule.days.forEach(day => {
              // Create dates for current and next month
              for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
                const eventDate = new Date(currentYear, currentMonth + monthOffset, day)
                
                // Only show future events
                if (eventDate >= today) {
                  events.push({
                    type: "payroll",
                    time: "End of day",
                    title: `${schedule.name} - Payroll Processing`,
                    importance: "high",
                    date: formatDate(eventDate),
                    fullDate: eventDate,
                    schedule: schedule
                  })
                }
              }
            })
            
            // Add cutoff dates if available
            if (schedule.cutoffDays && schedule.cutoffDays.length > 0) {
              schedule.cutoffDays.forEach(day => {
                for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
                  const cutoffDate = new Date(currentYear, currentMonth + monthOffset, day)
                  
                  if (cutoffDate >= today) {
                    events.push({
                      type: "report",
                      time: "End of day",
                      title: `${schedule.name} - Cutoff Date`,
                      importance: "medium",
                      date: formatDate(cutoffDate),
                      fullDate: cutoffDate,
                      schedule: schedule
                    })
                  }
                }
              })
            }
            
            // Add payroll release date if available
            if (schedule.payrollReleaseDay) {
              for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
                const releaseDate = new Date(currentYear, currentMonth + monthOffset, schedule.payrollReleaseDay)
                
                if (releaseDate >= today) {
                  events.push({
                    type: "payment",
                    time: "End of day", 
                    title: `${schedule.name} - Payment Release`,
                    importance: "high",
                    date: formatDate(releaseDate),
                    fullDate: releaseDate,
                    schedule: schedule
                  })
                }
              }
            }
          }
        })
        
        // Sort events by date and take the next 5
        events.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
        setPayrollEvents(events.slice(0, 5))
        
      } catch (error) {
        console.error('Error fetching payroll schedules:', error)
        setError('Failed to load payroll schedules')
      } finally {
        setLoading(false)
      }
    }

    fetchPayrollSchedules()
  }, [])
  
  // Helper function to format date
  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }
  
  // Get icon based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'payroll':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'report':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'payment':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (error) {
    return (
      <Card className="w-auto shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Payroll Schedule</h3>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
          <EmptyState
            icon={AlertCircle}
            title="Unable to Load Schedule"
            description="Failed to load BISU payroll schedule. Please check your connection."
            variant="default"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-auto shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Payroll Schedule
          </h3>
          <button className="text-gray-500">
            <Calendar className="h-5 w-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="min-w-[80px]">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : payrollEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Active Schedules"
            description="No active payroll schedules found. Configure payroll schedules to see upcoming events."
            variant="default"
          />
        ) : (
          <div className="space-y-3">
            {payrollEvents.map((event, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between group"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-[80px] text-xs text-gray-500">
                      {event.date}<br />
                      <span className="font-medium text-gray-700">{event.time}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <div className="flex items-center gap-1 text-xs">
                        {getEventIcon(event.type)}
                        <span className={`
                          ${event.type === 'payroll' ? 'text-blue-500' : 
                            event.type === 'report' ? 'text-green-600' : 
                            event.type === 'payment' ? 'text-purple-600' : 'text-gray-500'}
                        `}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-700">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button 
          onClick={() => router.push('/admin/payroll#schedules')}
          className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
            View full payroll calendar
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
