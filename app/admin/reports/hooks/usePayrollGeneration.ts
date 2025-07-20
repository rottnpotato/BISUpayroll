"use client"

import { useState, useCallback } from 'react'
import { PayrollData, ReportTemplate } from '../types'
import { useToast } from "@/hooks/use-toast"
import { DateRange } from "react-day-picker"

export const usePayrollGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [payrollData, setPayrollData] = useState<PayrollData[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const { toast } = useToast()

  const generatePayroll = useCallback(async (
    template: ReportTemplate,
    templateDateRange: DateRange,
    selectedDepartment: string
  ) => {
    if (!templateDateRange?.from || !templateDateRange?.to) {
      toast({
        title: "Error",
        description: "Please select both start and end dates for this template",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setSelectedTemplate(template)

    try {
      console.log("Generating payroll with params:", {
        payPeriodStart: templateDateRange.from.toISOString(),
        payPeriodEnd: templateDateRange.to.toISOString(),
        department: selectedDepartment === "all" ? undefined : selectedDepartment,
        role: "EMPLOYEE"
      })

      const response = await fetch('/api/admin/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payPeriodStart: templateDateRange.from.toISOString(),
          payPeriodEnd: templateDateRange.to.toISOString(),
          department: selectedDepartment === "all" ? undefined : selectedDepartment,
          role: "EMPLOYEE"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Payroll generation failed:', errorData)
        throw new Error(errorData.error || 'Failed to generate payroll')
      }

      const result = await response.json()
      console.log("Payroll generation result:", result)
      
      if (!result.records || result.records.length === 0) {
        toast({
          title: "No Data", 
          description: `No employees found for the selected criteria. Generated: ${result.generated || 0} records. Please check if employees have role 'EMPLOYEE', are active, and have salary configured.`,
          variant: "destructive"
        })
        return
      }

      const detailedPayroll = await Promise.all(
        result.records.map(async (record: any) => {
          const attendanceResponse = await fetch(
            `/api/admin/attendance?userId=${record.userId}&startDate=${templateDateRange.from?.toISOString()}&endDate=${templateDateRange.to?.toISOString()}`
          )
          
          if (!attendanceResponse.ok) {
            console.warn(`Failed to fetch attendance for user ${record.userId}`)
          }
          
          const attendanceData = await attendanceResponse.json()
          console.log(`Attendance data for user ${record.userId}:`, attendanceData)
          
          const daysPresent = attendanceData.records?.filter((r: any) => r.timeIn && r.timeOut).length || 0
          const hoursWorked = attendanceData.records?.reduce((sum: number, r: any) => 
            sum + (r.hoursWorked ? parseFloat(r.hoursWorked.toString()) : 0), 0) || 0
          const lateHours = attendanceData.records?.reduce((sum: number, r: any) => 
            sum + (r.isLate ? 1 : 0), 0) || 0

          const grossPay = parseFloat(record.grossPay?.toString() || '0')
          const withholdingTax = grossPay * 0.12
          const citySavingsLoan = 0
          const pagibigContribution = grossPay * 0.02

          return {
            ...record,
            attendanceData: {
              daysPresent,
              hoursWorked,
              lateHours
            },
            deductionBreakdown: {
              withholdingTax,
              citySavingsLoan,
              pagibigContribution
            }
          }
        })
      )

      console.log("Detailed payroll data:", detailedPayroll)
      setPayrollData(detailedPayroll)
      
      toast({
        title: "Success",
        description: `Payroll generated for ${result.generated} employees`,
      })

      return detailedPayroll
    } catch (error) {
      console.error('Error generating payroll:', error)
      toast({
        title: "Error",
        description: "Failed to generate payroll report",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [toast])

  const testUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/test-users')
      const data = await response.json()
      console.log("User test results:", data)
      toast({
        title: "User Test Results",
        description: `Found ${data.employeesWithSalary} eligible employees out of ${data.totalUsers} total users. Check console for details.`,
      })
    } catch (error) {
      console.error('Error testing users:', error)
      toast({
        title: "Error",
        description: "Failed to test users",
        variant: "destructive"
      })
    }
  }, [toast])

  const clearPayrollData = useCallback(() => {
    setPayrollData([])
    setSelectedTemplate(null)
  }, [])

  return {
    isGenerating,
    payrollData,
    selectedTemplate,
    generatePayroll,
    testUsers,
    clearPayrollData
  }
}
