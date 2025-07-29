"use client"

import { useCallback } from 'react'
import { PayrollData } from '../types'
import { generatePrintHTML } from '../utils/reports'
import { useToast } from "@/hooks/use-toast"
import { DateRange } from "react-day-picker"

export const usePrintPayroll = () => {
  const { toast } = useToast()

  const printPayroll = useCallback((
    payrollData: PayrollData[],
    templateDateRange: DateRange | undefined
  ) => {
    if (!templateDateRange?.from || !templateDateRange?.to || !payrollData.length) {
      toast({
        title: "Error",
        description: "No payroll data available to print",
        variant: "destructive"
      })
      return false
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to print the payroll",
        variant: "destructive"
      })
      return false
    }

    const printContent = generatePrintHTML(payrollData, templateDateRange)
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 100)
    }
    
    return true
  }, [toast])

  return { printPayroll }
} 