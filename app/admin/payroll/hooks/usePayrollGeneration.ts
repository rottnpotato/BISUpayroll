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
      console.log("Generating report with params:", {
        template: template.type,
        payPeriodStart: templateDateRange.from.toISOString(),
        payPeriodEnd: templateDateRange.to.toISOString(),
        department: selectedDepartment === "all" ? undefined : selectedDepartment,
        role: "EMPLOYEE"
      })

      let response: Response
      let requestBody: any

      // Handle different report types with different endpoints and logic
      switch (template.type) {
        case "monthly":
        case "custom":
          // Use existing payroll generation endpoint for monthly and custom period reports
          requestBody = {
            payPeriodStart: templateDateRange.from.toISOString(),
            payPeriodEnd: templateDateRange.to.toISOString(),
            department: selectedDepartment === "all" ? undefined : selectedDepartment,
            role: "EMPLOYEE"
          }
          response = await fetch('/api/admin/payroll/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          })
          break

        case "department":
          // Use reports endpoint for department-specific payroll
          if (selectedDepartment === "all") {
            toast({
              title: "Error",
              description: "Please select a specific department for the department payroll report",
              variant: "destructive"
            })
            return
          }
          
          const deptUrl = new URL('/api/admin/reports', window.location.origin)
          deptUrl.searchParams.set('type', 'department-payroll')
          deptUrl.searchParams.set('startDate', templateDateRange.from.toISOString())
          deptUrl.searchParams.set('endDate', templateDateRange.to.toISOString())
          deptUrl.searchParams.set('department', selectedDepartment)
          
          response = await fetch(deptUrl.toString())
          break

        case "tax":
          // Use reports endpoint for tax withholding summary
          const taxUrl = new URL('/api/admin/reports', window.location.origin)
          taxUrl.searchParams.set('type', 'tax-withholding-summary')
          taxUrl.searchParams.set('startDate', templateDateRange.from.toISOString())
          taxUrl.searchParams.set('endDate', templateDateRange.to.toISOString())
          if (selectedDepartment !== "all") {
            taxUrl.searchParams.set('department', selectedDepartment)
          }
          
          response = await fetch(taxUrl.toString())
          break

        default:
          throw new Error(`Unsupported report type: ${template.type}`)
      }

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Report generation failed:', errorData)
        throw new Error(errorData.error || `Failed to generate ${template.name}`)
      }

      const result = await response.json()
      console.log("Report generation result:", result)
      
      // Handle different response formats
      let records = result.records || []
      let generatedCount = 0
      
      if (template.type === "monthly" || template.type === "custom") {
        generatedCount = result.generated || 0
      } else {
        generatedCount = records.length
      }
      
      if (!records || records.length === 0) {
        const errorMessage = result.message || 
          `No data found for the selected criteria. Generated: ${generatedCount} records. Please check if employees have role 'EMPLOYEE', are active, and have salary configured.`
        
        toast({
          title: "No Data", 
          description: errorMessage,
          variant: "destructive"
        })
        return
      }

      // Process data based on report type
      let detailedPayroll: any[]

      if (template.type === "tax") {
        // Tax withholding reports already have the tax breakdown calculated
        detailedPayroll = records.map((record: any) => ({
          ...record,
          attendanceData: {
            daysPresent: 0, // Tax reports don't need attendance data
            hoursWorked: 0,
            lateHours: 0
          },
          deductionBreakdown: {
            withholdingTax: record.taxBreakdown?.withholdingTax || 0,
            citySavingsLoan: 0,
            pagibigContribution: record.taxBreakdown?.pagibigContribution || 0,
            sssContribution: record.taxBreakdown?.sssContribution || 0,
            philHealthContribution: record.taxBreakdown?.philHealthContribution || 0
          }
        }))
      } else {
        // For other report types, fetch attendance data if needed
        detailedPayroll = await Promise.all(
          records.map(async (record: any) => {
            let attendanceData = { daysPresent: 0, hoursWorked: 0, lateHours: 0 }
            
            try {
              const attendanceResponse = await fetch(
                `/api/admin/attendance?userId=${record.userId}&startDate=${templateDateRange.from?.toISOString()}&endDate=${templateDateRange.to?.toISOString()}`
              )
              
              if (attendanceResponse.ok) {
                const attendance = await attendanceResponse.json()
                attendanceData = {
                  daysPresent: attendance.records?.filter((r: any) => r.timeIn && r.timeOut).length || 0,
                  hoursWorked: attendance.records?.reduce((sum: number, r: any) => 
                    sum + (r.hoursWorked ? parseFloat(r.hoursWorked.toString()) : 0), 0) || 0,
                  lateHours: attendance.records?.reduce((sum: number, r: any) => 
                    sum + (r.isLate ? 1 : 0), 0) || 0
                }
              } else {
                console.warn(`Failed to fetch attendance for user ${record.userId}`)
              }
            } catch (error) {
              console.warn(`Error fetching attendance for user ${record.userId}:`, error)
            }

            const grossPay = parseFloat(record.grossPay?.toString() || '0')
            return {
              ...record,
              attendanceData,
              deductionBreakdown: {
                withholdingTax: grossPay * 0.12,
                citySavingsLoan: 0,
                pagibigContribution: grossPay * 0.02
              }
            }
          })
        )
      }

      console.log("Detailed payroll data:", detailedPayroll)
      setPayrollData(detailedPayroll)
      
      toast({
        title: "Success",
        description: `${template.name} generated successfully for ${generatedCount} employees`,
      })

      return detailedPayroll
    } catch (error) {
      console.error('Error generating report:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report'
      toast({
        title: "Error",
        description: `Failed to generate ${template.name}: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [toast])

  const testUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/test-users')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("User test results:", data)
      toast({
        title: "User Test Results",
        description: `Found ${data.employeesWithSalary} eligible employees out of ${data.totalUsers} total users. Check console for details.`,
      })
    } catch (error) {
      console.error('Error testing users:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: "Error",
        description: `Failed to test users: ${errorMessage}`,
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