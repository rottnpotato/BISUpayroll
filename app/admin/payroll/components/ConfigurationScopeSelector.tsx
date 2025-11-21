"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, User, Briefcase, Tag } from "lucide-react"
import { motion } from "framer-motion"
import { ConfigurationScope, ApplicationType } from "../types"

interface ConfigurationScopeSelectorProps {
  currentScope?: ConfigurationScope
  onScopeChange: (scope: ConfigurationScope) => void
  disabled?: boolean
  className?: string
}

interface Department {
  id: string
  name: string
  employeeCount: number
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
}

// Mock data - in real implementation, fetch from API
const MOCK_DEPARTMENTS: Department[] = [
  { id: "CCIS", name: "College of Computer and Information Sciences", employeeCount: 25 },
  { id: "CTAS", name: "College of Technology and Allied Sciences", employeeCount: 45 },
  { id: "CCJ", name: "College of Criminal Justice", employeeCount: 15 }
]

const MOCK_EMPLOYEES: Employee[] = [
  { id: "1", firstName: "John", lastName: "Doe", employeeId: "EMP001", department: "CCIS" },
  { id: "2", firstName: "Jane", lastName: "Smith", employeeId: "EMP002", department: "CTAS" },
  { id: "3", firstName: "Bob", lastName: "Johnson", employeeId: "EMP003", department: "CCJ" }
]

const STATUSES = ["Permanent", "Temporary", "Contractual"]

export function ConfigurationScopeSelector({ 
  currentScope, 
  onScopeChange, 
  disabled = false,
  className = ""
}: ConfigurationScopeSelectorProps) {
  const [applicationType, setApplicationType] = useState<ApplicationType>(
    currentScope?.applicationType || 'ALL'
  )
  const [targetId, setTargetId] = useState<string>(currentScope?.targetId || '')
  const [targetName, setTargetName] = useState<string>(currentScope?.targetName || '')
  const [priority, setPriority] = useState<number>(currentScope?.priority || 0)

  useEffect(() => {
    const scope: ConfigurationScope = {
      applicationType,
      targetId: applicationType === 'ALL' ? undefined : targetId,
      targetName: applicationType === 'ALL' ? undefined : targetName,
      priority,
      isActive: true
    }
    onScopeChange(scope)
  }, [applicationType, targetId, targetName, priority, onScopeChange])

  const handleApplicationTypeChange = (value: ApplicationType) => {
    setApplicationType(value)
    setTargetId('')
    setTargetName('')
  }

  const handleTargetChange = (value: string) => {
    setTargetId(value)
    
    // Set target name based on type and selection
    let name = ''
    if (applicationType === 'DEPARTMENT') {
      const dept = MOCK_DEPARTMENTS.find(d => d.id === value)
      name = dept?.name || ''
    } else if (applicationType === 'INDIVIDUAL') {
      const emp = MOCK_EMPLOYEES.find(e => e.id === value)
      name = emp ? `${emp.firstName} ${emp.lastName}` : ''
    } else if (applicationType === 'STATUS') {
      name = value
    }
    setTargetName(name)
  }

  const getApplicationTypeIcon = (type: ApplicationType) => {
    switch (type) {
      case 'ALL': return <Users className="w-4 h-4" />
      case 'DEPARTMENT': return <Building2 className="w-4 h-4" />
      case 'INDIVIDUAL': return <User className="w-4 h-4" />
      case 'STATUS': return <Tag className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const renderTargetSelector = () => {
    if (applicationType === 'ALL') return null

    switch (applicationType) {
      case 'DEPARTMENT':
        return (
          <div>
            <Label htmlFor="department-select">Select Department</Label>
            <Select value={targetId} onValueChange={handleTargetChange} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a department" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{dept.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {dept.id}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'INDIVIDUAL':
        return (
          <div>
            <Label htmlFor="employee-select">Select Employee</Label>
            <Select value={targetId} onValueChange={handleTargetChange} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_EMPLOYEES.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex flex-col">
                      <span>{emp.firstName} {emp.lastName}</span>
                      <span className="text-xs text-muted-foreground">
                        {emp.employeeId} - {emp.department}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'STATUS':
        return (
          <div>
            <Label htmlFor="status-select">Select Status</Label>
            <Select value={targetId} onValueChange={handleTargetChange} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 ${className}`}
    >
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getApplicationTypeIcon(applicationType)}
            Configuration Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="application-type">Apply Configuration To</Label>
            <Select value={applicationType} onValueChange={handleApplicationTypeChange} disabled={disabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    All Employees
                  </div>
                </SelectItem>
                <SelectItem value="DEPARTMENT">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Specific Department
                  </div>
                </SelectItem>
                <SelectItem value="INDIVIDUAL">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Individual Employee
                  </div>
                </SelectItem>
                <SelectItem value="STATUS">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    By Status
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderTargetSelector()}

          {applicationType !== 'ALL' && (
            <div>
              <Label htmlFor="priority">Priority (higher number = higher priority)</Label>
              <Select 
                value={priority.toString()} 
                onValueChange={(value) => setPriority(Number(value))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((p) => (
                    <SelectItem key={p} value={p.toString()}>
                      Priority {p} {p === 0 && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetName && (
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                Applied to: {targetName}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}