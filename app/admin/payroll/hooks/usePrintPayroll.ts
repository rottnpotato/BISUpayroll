"use client"

import { useCallback } from 'react'
import { PayrollData, ReportTemplate } from '../types'
import { generatePrintHTML } from '../utils/reports'
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"

export const usePrintPayroll = () => {
  const { toast } = useToast()

  const savePayrollFile = async (
    fileName: string,
    reportType: string,
    payrollData: PayrollData[],
    templateDateRange: DateRange,
    generatedBy: string,
    scheduleId?: string,
    scheduleName?: string,
    employmentStatus?: string
  ) => {
    try {
      // Calculate file metadata
      const departments = [...new Set(payrollData.map(p => p.user.department).filter(d => d))]
      const employeeCount = payrollData.length
      const totalGrossPay = payrollData.reduce((sum, p) => sum + p.grossPay, 0)
      const totalNetPay = payrollData.reduce((sum, p) => sum + p.netPay, 0)
      const totalDeductions = payrollData.reduce((sum, p) => sum + (p.deductions || p.totalDeductions || 0), 0)

      // Create file record
      const fileData = {
        fileName,
        filePath: `/payroll-files/${fileName}`,
        fileSize: 0, // Will be updated after actual file creation
        fileType: 'pdf',
        reportType,
        payPeriodStart: templateDateRange.from?.toISOString(),
        payPeriodEnd: templateDateRange.to?.toISOString(),
        generatedBy,
        department: departments.length === 1 ? departments[0] : null,
        employeeCount,
        totalGrossPay,
        totalNetPay,
        totalDeductions,
        scheduleId,
        scheduleName,
        metadata: {
          departments,
          generationTime: new Date().toISOString(),
          payrollDataCount: payrollData.length,
          employmentStatus: employmentStatus || 'all'
        }
      }

      const response = await fetch('/api/admin/payroll/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Payroll file record saved:', result.file.id)
        return result.file
      } else {
        console.warn('Failed to save payroll file record')
      }
    } catch (error) {
      console.error('Error saving payroll file record:', error)
    }
  }

  const printPayroll = useCallback(async (
    data: PayrollData[], 
    templateDateRange?: DateRange,
    reportType: string = 'custom',
    scheduleId?: string,
    scheduleName?: string,
    selectedTemplate?: ReportTemplate | null,
    employmentStatus?: string
  ): Promise<boolean> => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No payroll data available to print",
          variant: "destructive"
        })
        return false
      }

      if (!templateDateRange?.from || !templateDateRange?.to) {
        toast({
          title: "Invalid Date Range",
          description: "Please provide a valid date range",
          variant: "destructive"
        })
        return false
      }

      // Generate HTML content
  const htmlContent = generatePrintHTML(data, templateDateRange, selectedTemplate || null, employmentStatus)
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({
          title: "Print Blocked",
          description: "Popup blocked. Please allow popups for this site.",
          variant: "destructive"
        })
        return false
      }

      // Write content to the new window
      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Generate file name
  const dateStr = templateDateRange.from.toISOString().split('T')[0]
  const suffix = selectedTemplate?.type ? selectedTemplate.type : reportType
  const statusSuffix = employmentStatus && employmentStatus !== 'all' ? `_${employmentStatus.toLowerCase()}` : ''
  const fileName = `payroll_${suffix}${statusSuffix}_${dateStr}_${Date.now()}.pdf`

      // Save file record to database
      try {
        // Get current user ID (you might need to implement this based on your auth system)
        const currentUser = await fetch('/api/auth/verify')
        let generatedBy = 'unknown'
        
        if (currentUser.ok) {
          const userData = await currentUser.json()
          generatedBy = userData.user?.id || 'unknown'
        }

        await savePayrollFile(
          fileName,
          reportType,
          data,
          templateDateRange,
          generatedBy,
          scheduleId,
          scheduleName,
          employmentStatus
        )
      } catch (error) {
        console.warn('Failed to save file record, but print will continue:', error)
      }

      // Wait a bit for content to load, then print
      setTimeout(() => {
        try {
          printWindow.print()
          
          toast({
            title: "Payroll Report Generated",
            description: `Generated ${reportType} payroll report for ${data.length} employees and saved for backup.`,
            variant: "default"
          })
          
          // Close the window after printing (with delay to ensure print dialog appears)
          setTimeout(() => {
            printWindow.close()
          }, 1000)
          
        } catch (error) {
          console.error('Print error:', error)
          toast({
            title: "Print Error",
            description: "There was an issue with printing. Please try again.",
            variant: "destructive"
          })
        }
      }, 500)

      return true
      
    } catch (error) {
      console.error('Error in printPayroll:', error)
      toast({
        title: "Error",
        description: "Failed to generate payroll report",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  return { printPayroll }
} 