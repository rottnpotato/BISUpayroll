"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  User
} from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"

interface User {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
  position: string
}

interface AttendanceRecord {
  id: string
  userId: string
  date: string
  timeIn: string | null
  timeOut: string | null
  hoursWorked: number | null
  isLate: boolean
  isAbsent: boolean
  user: User
}

interface AttendanceCardProps {
  record: AttendanceRecord
  onEdit: (record: AttendanceRecord) => void
  onDelete: (id: string) => void
  index: number
}

export function AttendanceCard({ record, onEdit, onDelete, index }: AttendanceCardProps) {
  const getStatusInfo = () => {
    if (record.isAbsent) {
      return {
        status: "Absent",
        color: "bg-red-500",
        textColor: "text-red-500",
        icon: XCircle,
        bgClass: "bg-red-50 border-red-200"
      }
    }
    if (record.timeIn && record.isLate) {
      return {
        status: "Late",
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
        icon: AlertCircle,
        bgClass: "bg-yellow-50 border-yellow-200"
      }
    }
    if (record.timeIn) {
      return {
        status: "Present",
        color: "bg-green-500",
        textColor: "text-green-600",
        icon: CheckCircle,
        bgClass: "bg-green-50 border-green-200"
      }
    }
    return {
      status: "No Data",
      color: "bg-gray-500",
      textColor: "text-gray-500",
      icon: Clock,
      bgClass: "bg-gray-50 border-gray-200"
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--"
    return format(new Date(dateString), 'HH:mm')
  }

  const formatHours = (hours: number | null) => {
    if (!hours) return "--:--"
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const getInitials = () => {
    return `${record.user.firstName.charAt(0)}${record.user.lastName.charAt(0)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="w-full"
    >
      <Card className={`attendance-card relative overflow-hidden ${statusInfo.bgClass} border-l-4`}>
        <CardContent className="p-6">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                  <AvatarImage src="/placeholder-user.jpg" alt={`${record.user.firstName} ${record.user.lastName}`} />
                  <AvatarFallback className="bg-bisu-purple-medium text-white font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className={`status-indicator absolute -bottom-1 -right-1 w-4 h-4 ${statusInfo.color} rounded-full border-2 border-white`} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-bisu-purple-deep">
                  {record.user.firstName} {record.user.lastName}
                </h3>
                <p className="text-sm text-gray-600 font-medium">ID: {record.user.employeeId}</p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <User className="h-3 w-3 mr-1" />
                  {record.user.position}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <Badge className={`${statusInfo.color} text-white font-medium px-3 py-1 shadow-md`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.status}
              </Badge>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-bisu-yellow-light hover:text-white transition-all duration-200"
                  onClick={() => onEdit(record)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white transition-all duration-200"
                  onClick={() => onDelete(record.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Department and Date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-bisu-purple-medium" />
              <span className="font-medium">{record.user.department}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-bisu-purple-medium" />
              <span>{format(new Date(record.date), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Time Information Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-xs text-gray-500 mb-1 font-medium">TIME IN</div>
              <div className="text-lg font-bold text-bisu-purple-deep">
                {formatTime(record.timeIn)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-xs text-gray-500 mb-1 font-medium">TIME OUT</div>
              <div className="text-lg font-bold text-bisu-purple-deep">
                {formatTime(record.timeOut)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-xs text-gray-500 mb-1 font-medium">HOURS</div>
              <div className="text-lg font-bold text-bisu-purple-deep">
                {formatHours(record.hoursWorked)}
              </div>
            </div>
          </div>

          {/* Progress Bar for Hours Worked */}
          {record.hoursWorked && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Work Progress</span>
                <span>{Math.round((record.hoursWorked / 8) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-bisu-purple-medium to-bisu-purple-light h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((record.hoursWorked / 8) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
