"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'time-action'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  autoClose?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      autoClose: notification.autoClose ?? true
    }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto remove notification
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface NotificationCardProps {
  notification: Notification
  onClose: () => void
}

const NotificationCard = ({ notification, onClose }: NotificationCardProps) => {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!notification.autoClose) return

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (notification.duration! / 100))
        return newProgress <= 0 ? 0 : newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [notification.autoClose, notification.duration])

  const getIcon = () => {
    const iconClass = "h-5 w-5"
    switch (notification.type) {
      case 'success':
        return <CheckCircle className={cn(iconClass, "text-green-500")} />
      case 'error':
        return <XCircle className={cn(iconClass, "text-red-500")} />
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-amber-500")} />
      case 'time-action':
        return <Clock className={cn(iconClass, "text-blue-500")} />
      default:
        return <Info className={cn(iconClass, "text-blue-500")} />
    }
  }

  const getThemeClasses = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
          progress: 'bg-green-400',
          shadow: 'shadow-green-100/50'
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
          progress: 'bg-red-400',
          shadow: 'shadow-red-100/50'
        }
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
          progress: 'bg-amber-400',
          shadow: 'shadow-amber-100/50'
        }
      case 'time-action':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
          progress: 'bg-blue-400',
          shadow: 'shadow-blue-100/50'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
          progress: 'bg-blue-400',
          shadow: 'shadow-blue-100/50'
        }
    }
  }

  const theme = getThemeClasses()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-sm",
        "shadow-lg",
        theme.bg,
        theme.shadow
      )}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {notification.message}
                </p>
                
                {notification.action && (
                  <button
                    onClick={notification.action.onClick}
                    className="mt-3 text-xs font-medium text-bisu-purple-deep hover:text-bisu-purple-light transition-colors duration-200"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      {notification.autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
          <motion.div
            className={cn("h-full", theme.progress)}
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  )
}

// Convenience functions for different notification types
export const useNotificationHelpers = () => {
  const { addNotification } = useNotification()

  const showSuccess = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  const showError = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 7000, // Error messages stay longer
      ...options
    })
  }

  const showWarning = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  const showInfo = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  const showTimeAction = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'time-action',
      title,
      message,
      ...options
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTimeAction
  }
} 