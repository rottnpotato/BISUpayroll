"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarRange, FileText, RefreshCcw } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { motion } from "framer-motion"

interface TemplateData {
  id: string
  name: string
  description: string
  iconName: string
  iconColor: string
  category: string
  type: string
}

interface PayrollGenerationCardProps {
  template: TemplateData
  templateDateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  selectedDepartment: string
  onDepartmentChange: (department: string) => void
  onGenerate: () => void
  isGenerating: boolean
}

const getIcon = (iconName: string, iconColor: string) => {
  const className = `h-6 w-6 text-${iconColor}`
  
  switch (iconName) {
    case 'FileText':
      return <FileText className={className} />
    case 'Users':
      return <FileText className={className} />
    case 'CalendarRange':
      return <CalendarRange className={className} />
    case 'BarChart':
      return <FileText className={className} />
    default:
      return <FileText className={className} />
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
}

export const PayrollGenerationCard = ({
  template,
  templateDateRange,
  onDateRangeChange,
  selectedDepartment,
  onDepartmentChange,
  onGenerate,
  isGenerating
}: PayrollGenerationCardProps) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-transparent hover:border-bisu-yellow-DEFAULT h-full">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
            {getIcon(template.iconName, template.iconColor)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-bisu-purple-deep">{template.name}</CardTitle>
            <CardDescription className="text-gray-600">{template.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Payroll Period</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarRange className="mr-2 h-4 w-4" />
                      {templateDateRange?.from ? (
                        templateDateRange?.to ? (
                          <>
                            {format(templateDateRange.from, "LLL dd, yyyy")} - {format(templateDateRange.to, "LLL dd, yyyy")}
                          </>
                        ) : (
                          format(templateDateRange.from, "LLL dd, yyyy")
                        )
                      ) : (
                        <span>Select date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={templateDateRange?.from}
                      selected={templateDateRange}
                      onSelect={onDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {(template.type === 'department' || template.type === 'tax' || template.type === 'custom') && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    {template.type === 'department' ? 'Department (Required)' : 'Department (Optional)'}
                  </p>
                  <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="CCIS">CCIS</SelectItem>
                      <SelectItem value="CTAS">CTAS</SelectItem>
                      <SelectItem value="CCJ">CCJ</SelectItem>
                      <SelectItem value="CTE">CTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            className="w-full bg-bisu-purple-deep hover:bg-bisu-purple-medium mt-4"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Payroll
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
