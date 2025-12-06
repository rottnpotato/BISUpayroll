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
    selectedDepartment: string,
    selectedEmploymentStatus?: string
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
      // Normalize to start-of-day and end-of-day to avoid off-by-one inclusions
      const start = new Date(templateDateRange.from)
      start.setHours(0, 0, 0, 0)
      const end = new Date(templateDateRange.to)
      end.setHours(23, 59, 59, 999)

      const employeeType = selectedDepartment === "all" ? undefined 
        : selectedDepartment === "TEACHING" ? "TEACHING_PERSONNEL" 
        : selectedDepartment === "NON-TEACHING" ? "NON_TEACHING_PERSONNEL" 
        : selectedDepartment === "CASUAL_PLANTILLA" ? "CASUAL_PLANTILLA"
        : undefined

      console.log("Generating report with params:", {
        template: template.type,
        payPeriodStart: start.toISOString(),
        payPeriodEnd: end.toISOString(),
        employeeType,
        role: "EMPLOYEE",
        employmentStatus: selectedEmploymentStatus && selectedEmploymentStatus !== 'all' ? selectedEmploymentStatus : undefined
      })

      let response: Response
      let requestBody: any

      // Handle different report types with different endpoints and logic
      switch (template.type) {
        case "monthly":
        case "custom":
          requestBody = {
            payPeriodStart: start.toISOString(),
            payPeriodEnd: end.toISOString(),
            employeeType,
            role: "EMPLOYEE",
            employmentStatus: selectedEmploymentStatus && selectedEmploymentStatus !== 'all' ? selectedEmploymentStatus : undefined
          }
          response = await fetch('/api/admin/payroll/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          })
          break

        case "department":
          if (selectedDepartment === "all") {
            toast({
              title: "Error",
              description: "Please select a specific category for the payroll report",
              variant: "destructive"
            })
            return
          }
          
          const deptUrl = new URL('/api/admin/reports', window.location.origin)
          deptUrl.searchParams.set('type', 'department-payroll')
          deptUrl.searchParams.set('startDate', start.toISOString())
          deptUrl.searchParams.set('endDate', end.toISOString())
          if (employeeType) {
            deptUrl.searchParams.set('employeeType', employeeType)
          }
          
          response = await fetch(deptUrl.toString())
          break

        case "tax":
          const taxUrl = new URL('/api/admin/reports', window.location.origin)
          taxUrl.searchParams.set('type', 'tax-withholding-summary')
          taxUrl.searchParams.set('startDate', start.toISOString())
          taxUrl.searchParams.set('endDate', end.toISOString())
          if (employeeType) {
            taxUrl.searchParams.set('employeeType', employeeType)
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
        // For other report types, use the detailed payroll data from backend
        detailedPayroll = await Promise.all(
          records.map(async (record: any) => {
            let attendanceData = { daysPresent: 0, hoursWorked: 0, lateHours: 0, undertimeHours: 0 }
            
            // If the record already has attendance data (from PayrollResult), use it
            if (record.daysWorked !== undefined) {
              attendanceData = {
                daysPresent: record.daysWorked || 0,
                hoursWorked: parseFloat(record.hoursWorked?.toString() || '0'),
                lateHours: parseFloat(record.lateHours?.toString() || '0'),
                undertimeHours: parseFloat(record.undertimeHours?.toString() || '0')
              }
            } else {
              // Fallback: fetch attendance data if needed
              try {
                const attendanceResponse = await fetch(`/api/admin/attendance?userId=${record.userId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
                
                if (attendanceResponse.ok) {
                  const attendance = await attendanceResponse.json()
                  // Calculate late minutes from lateMinutes field
                  const totalLateMinutes = attendance.records?.reduce((sum: number, r: any) => 
                    sum + (r.lateMinutes ? parseFloat(r.lateMinutes.toString()) : 0), 0) || 0
                  // Calculate undertime minutes from undertimeMinutes field
                  const totalUndertimeMinutes = attendance.records?.reduce((sum: number, r: any) => 
                    sum + (r.undertimeMinutes ? parseFloat(r.undertimeMinutes.toString()) : 0), 0) || 0
                  
                  attendanceData = {
                    daysPresent: attendance.records?.filter((r: any) => r.timeIn && r.timeOut).length || 0,
                    hoursWorked: attendance.records?.reduce((sum: number, r: any) => 
                      sum + (r.hoursWorked ? parseFloat(r.hoursWorked.toString()) : 0), 0) || 0,
                    lateHours: totalLateMinutes / 60,
                    undertimeHours: totalUndertimeMinutes / 60
                  }
                } else {
                  console.warn(`Failed to fetch attendance for user ${record.userId}`)
                }
              } catch (error) {
                console.warn(`Error fetching attendance for user ${record.userId}:`, error)
              }
            }

            // Use the detailed breakdown from PayrollResult if available
            const deductionBreakdown = {
              withholdingTax: parseFloat(record.withholdingTax?.toString() || '0'),
              gsisContribution: parseFloat(record.gsisContribution?.toString() || '0'),
              philHealthContribution: parseFloat(record.philHealthContribution?.toString() || '0'),
              pagibigContribution: parseFloat(record.pagibigContribution?.toString() || '0'),
              lateDeductions: parseFloat(record.lateDeductions?.toString() || '0'),
              undertimeDeductions: parseFloat(record.undertimeDeductions?.toString() || '0'),
              loanDeductions: parseFloat(record.loanDeductions?.toString() || '0'),
              otherDeductions: parseFloat(record.otherDeductions?.toString() || '0')
            }

            // Use the detailed earnings breakdown from PayrollResult if available
            const earningsBreakdown = {
              regularPay: parseFloat(record.regularPay?.toString() || '0'),
              overtimePay: parseFloat(record.overtimePay?.toString() || '0'),
              holidayPay: parseFloat(record.holidayPay?.toString() || '0'),
              allowances: parseFloat(record.allowances?.toString() || '0'),
              bonuses: parseFloat(record.bonuses?.toString() || '0'),
              thirteenthMonthPay: parseFloat(record.thirteenthMonthPay?.toString() || '0'),
              serviceIncentiveLeave: parseFloat(record.serviceIncentiveLeave?.toString() || '0')
            }

            return {
              ...record,
              attendanceData,
              deductionBreakdown,
              earningsBreakdown
            }
          })
        )
      }

      console.log("Detailed payroll data:", detailedPayroll)

      // Guard: Block payroll generation when there is NO attendance in the selected range
      // Applies to monthly/custom payroll ledger generation only (not tax reports)
      if ((template.type === "monthly" || template.type === "custom") && Array.isArray(detailedPayroll)) {
        const hasAnyAttendance = detailedPayroll.some((r: any) => {
          const days = r?.attendanceData?.daysPresent ?? r?.daysWorked ?? 0
          const hours = r?.attendanceData?.hoursWorked ?? r?.hoursWorked ?? 0
          return (Number(days) > 0) || (Number(hours) > 0)
        })

        if (!hasAnyAttendance) {
          toast({
            title: "No Attendance Found",
            description: "No attendance records were found within the selected date range. Please select a range with attendance before generating the payroll ledger.",
            variant: "destructive"
          })
          // Do NOT set payroll data to avoid opening preview upstream
          return
        }
      }

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