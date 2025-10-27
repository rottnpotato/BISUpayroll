import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PayrollRule, User, PayrollSchedule } from '../types'

export const usePayrollData = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [rules, setRules] = useState<PayrollRule[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [schedules, setSchedules] = useState<PayrollSchedule[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)

  const fetchRules = async () => {
    try {
      const response = await fetch("/api/admin/payroll/rules")
      const data = await response.json()
      if (data.rules) {
        setRules(data.rules)
      }
    } catch (error) {
      console.error("Error fetching rules:", error)
      toast.error("Failed to load payroll calculations")
    }
  }

  const fetchUsers = async () => {
    try {
      setIsUsersLoading(true)
      // Fetch all users without pagination by setting a high limit
      const response = await fetch("/api/admin/users?limit=1000")
      const data = await response.json()
      if (data.users) {
        setUsers(data.users.filter((user: User) => 
          user.status !== "INACTIVE" && user.role !== "ADMIN"
        ))
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsUsersLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/admin/payroll/schedules")
      const data = await response.json()
      if (data.schedules) {
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
      toast.error("Failed to load payroll schedules")
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    await Promise.all([fetchRules(), fetchSchedules(), fetchUsers()])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    isLoading,
    rules,
    users,
    schedules,
    isUsersLoading,
    fetchRules,
    fetchUsers,
    fetchSchedules,
    loadData
  }
}
