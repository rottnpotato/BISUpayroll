import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ArrowRight, AlertCircle, Clock, FileText, Bell } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function ScheduleCard() {
  const [payrollEvents, setPayrollEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // In a real implementation, this would fetch from API
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      const today = new Date()
      const month = today.getMonth()
      const year = today.getFullYear()
      
      // Calculate upcoming payroll dates (15th and end of month)
      const midMonth = new Date(year, month, 15)
      if (midMonth < today) {
        midMonth.setMonth(month + 1)
      }
      
      const endMonth = new Date(year, month + 1, 0) // Last day of current month
      if (endMonth < today) {
        endMonth.setMonth(month + 1)
      }
      
      // Calculate report submission deadline (3 days before payroll)
      const reportDeadline = new Date(midMonth)
      reportDeadline.setDate(midMonth.getDate() - 3)
      if (reportDeadline < today) {
        reportDeadline.setMonth(month + 1)
      }
      
      // Calculate tax filing reminder (20th of month)
      const taxFiling = new Date(year, month, 20)
      if (taxFiling < today) {
        taxFiling.setMonth(month + 1)
      }
      
      setPayrollEvents([
        {
          type: "payroll",
          time: "End of day",
          title: "Mid-month Payroll Processing",
          importance: "high",
          date: formatDate(midMonth)
        },
        {
          type: "payroll",
          time: "End of day",
          title: "End-month Payroll Processing",
          importance: "high",
          date: formatDate(endMonth)
        },
        {
          type: "report",
          time: "12:00 PM",
          title: "Attendance Report Submission",
          importance: "medium",
          date: formatDate(reportDeadline)
        },
        {
          type: "tax",
          time: "End of day",
          title: "Monthly Tax Filing Deadline",
          importance: "high",
          date: formatDate(taxFiling)
        }
      ])
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
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
      case 'tax':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

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
                            event.type === 'tax' ? 'text-orange-500' : 'text-gray-500'}
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
          <button className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
            View full payroll calendar
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
