"use client"

import { FC, useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreHorizontal, ArrowUpDown, Eye, FileEdit, Trash2, TrendingUp, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import EmptyState from './EmptyState'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Employee {
  id?: string
  userId?: string
  firstName: string
  lastName: string
  grossPay?: number
  netPay?: number
  benefits?: number
  expenses?: number
  deductions?: number
  other?: number
  salary?: number
  baseSalary?: number
  overtime?: number
  bonuses?: number
  status?: 'PERMANENT' | 'INACTIVE' | 'CONTRACTUAL' | 'TEMPORARY' | 'pending' | 'leave'
  department?: string
  employeeId?: string
  user?: {
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
    status?: string
  }
}

interface EmployeeTableProps {
  data: any[]
  isLoading: boolean
  searchTerm?: string
  selectedDepartment?: string
  selectedStatus?: string
  sortBy?: string
}

const EmployeeTable: FC<EmployeeTableProps> = ({ 
  data, 
  isLoading, 
  searchTerm = "", 
  selectedDepartment = "All Departments", 
  selectedStatus = "All Status", 
  sortBy = "Name" 
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Transform the payroll data to match our employee interface
  let employees: Employee[] = data?.map((payroll: any) => ({
    id: payroll.id,
    userId: payroll.userId,
    firstName: payroll.user?.firstName || 'Unknown',
    lastName: payroll.user?.lastName || 'Employee',
    grossPay: Number(payroll.grossPay || 0),
    netPay: Number(payroll.netPay || 0),
    baseSalary: Number(payroll.baseSalary || 0),
    overtime: Number(payroll.overtime || 0),
    bonuses: Number(payroll.bonuses || 0),
    deductions: Number(payroll.deductions || 0),
    status: payroll.user?.status || 'ACTIVE',
    department: payroll.user?.department || 'Unassigned',
    employeeId: payroll.user?.employeeId
  })) || []

  // Dedupe by employee (prefer employeeId, then userId, then record id)
  if (employees.length > 1) {
    const seen = new Set<string>()
    employees = employees.filter((emp) => {
      const key = (emp.employeeId || emp.userId || emp.id || `${emp.firstName}-${emp.lastName}`) as string
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Apply search filter
  if (searchTerm) {
    employees = employees.filter(emp => 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Apply department filter
  if (selectedDepartment !== "All Departments") {
    employees = employees.filter(emp => emp.department === selectedDepartment)
  }

  // Apply status filter
  if (selectedStatus !== "All Status") {
    const statusFilter = selectedStatus.toLowerCase().replace(" ", "")
    employees = employees.filter(emp => {
      const empStatus = emp.status?.toLowerCase()
      if (selectedStatus === "On Leave") return empStatus === "leave"
      return empStatus === statusFilter
    })
  }

  // Apply sorting based on sortBy prop
  if (sortBy !== "Name") {
    employees.sort((a, b) => {
      switch (sortBy.toLowerCase()) {
        case 'department':
          return (a.department || '').localeCompare(b.department || '')
        case 'salary':
          return (b.grossPay || 0) - (a.grossPay || 0)
        case 'status':
          return (a.status || '').localeCompare(b.status || '')
        default:
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      }
    })
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedDepartment, selectedStatus, sortBy])

  // Calculate pagination
  const totalEmployees = employees.length
  const totalPages = Math.ceil(totalEmployees / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalEmployees)
  const currentEmployees = employees.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-t border-gray-100 bg-gray-50"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!employees.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <EmptyState
          icon={Users}
          title="No Employee Payroll Data"
          description="No payroll has been generated for this period yet. Generate payroll to see employee salary details and take-home pay calculations."
          variant="default"
        />
      </div>
    )
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
    return sortDirection === 'asc' 
      ? <ArrowUpDown className="ml-1 h-4 w-4 text-purple-600" /> 
      : <ArrowUpDown className="ml-1 h-4 w-4 text-purple-600 rotate-180" />
  }

  const getStatusBadge = (status: string | undefined) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case 'PERMANENT':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/70">Active</Badge>
      case 'inactive':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100/70">Inactive</Badge>
      case 'contractual':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100/70">Terminated</Badge>
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100/70">Pending</Badge>
      case 'leave':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/70">On Leave</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/70">Active</Badge>
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <TableRow className="hover:bg-transparent border-b border-purple-200">
              <TableCell className="w-12 pl-4">
                <Checkbox className="border-purple-300" />
              </TableCell>
              <TableCell 
                className="text-gray-900 font-medium cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Employee Name {getSortIcon('name')}
                </div>
              </TableCell>
              <TableCell 
                className="text-gray-900 font-medium cursor-pointer"
                onClick={() => handleSort('grossPay')}
              >
                <div className="flex items-center">
                  Total Earnings {getSortIcon('grossPay')}
                </div>
              </TableCell>
              <TableCell 
                className="text-gray-900 font-medium cursor-pointer"
                onClick={() => handleSort('n  etPay')}
              >
                <div className="flex items-center">
                  Salary to Receive {getSortIcon('netPay')}
                </div>
              </TableCell>
              <TableCell className="text-gray-900 font-medium">Department</TableCell>
              <TableCell className="font-medium">Status</TableCell>
              <TableCell 
                className="text-gray-900 font-medium cursor-pointer"
                onClick={() => handleSort('totalCost')}
              >
                <div className="flex items-center">
                  Total Cost {getSortIcon('totalCost')}
                </div>
              </TableCell>
              <TableCell className="text-gray-900 font-medium text-center">Details</TableCell>
              <TableCell className="w-12 text-center">Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentEmployees.map((employee) => {
              const isHovered = hoveredRow === employee.id
              
              return (
                <TableRow 
                  key={employee.id}
                  className={`${isHovered ? 'bg-purple-50' : ''} transition-colors duration-200`}
                  onMouseEnter={() => setHoveredRow(employee.id || null)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <TableCell className="pl-4">
                    <Checkbox className="border-purple-200" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border-2 border-purple-100">
                        <AvatarImage src={`/placeholder-user.jpg`} alt={`${employee.firstName} ${employee.lastName}`} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-xs text-gray-800">{employee.employeeId || 'No ID'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{formatCurrency(employee.grossPay || 0)}</div>
                    <div className="text-xs text-gray-800">Before deductions</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-700">{formatCurrency(employee.netPay || 0)}</div>
                    <div className="text-xs text-gray-800">Take-home pay</div>
                  </TableCell>
                  <TableCell>
                    <div className="px-2 py-1 rounded-md bg-purple-50 text-purple-800 text-sm inline-block">
                      {employee.department}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(employee.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{formatCurrency(employee.grossPay || 0)}</div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center space-x-1">
                            <div 
                              className="w-2 rounded-sm bg-purple-400" 
                              style={{ 
                                height: `${Math.max(12, Math.min(32, (employee.baseSalary || 0) / 2000))}px` 
                              }}
                            ></div>
                            <div 
                              className="w-2 rounded-sm bg-amber-400" 
                              style={{ 
                                height: `${Math.max(8, Math.min(24, (employee.bonuses || 0) / 2000))}px` 
                              }}
                            ></div>
                            <div 
                              className="w-2 rounded-sm bg-green-400" 
                              style={{ 
                                height: `${Math.max(6, Math.min(20, (employee.overtime || 0) / 1000 + 10))}px` 
                              }}
                            ></div>
                            <div 
                              className="w-2 rounded-sm bg-red-400" 
                              style={{ 
                                height: `${Math.max(4, Math.min(16, (employee.deductions || 0) / 1500))}px` 
                              }}
                            ></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-purple-400 mr-2 rounded"></div>
                              <span>Base Salary: {formatCurrency(employee.baseSalary || 0)}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-amber-400 mr-2 rounded"></div>
                              <span>Bonuses: {formatCurrency(employee.bonuses || 0)}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-400 mr-2 rounded"></div>
                              <span>Overtime: {formatCurrency(employee.overtime || 0)}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-red-400 mr-2 rounded"></div>
                              <span>Deductions: {formatCurrency(employee.deductions || 0)}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 hover:bg-purple-100 rounded-full mx-auto flex">
                          <MoreHorizontal className="h-5 w-5 text-gray-800" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Employee Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center cursor-pointer">
                          <FileEdit className="mr-2 h-4 w-4" />
                          <span>Edit Employee</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center text-red-600 cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-800">
          Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalEmployees}</span> employees
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1
            return (
              <button
                key={pageNum}
                className={`px-2 py-1 text-xs rounded ${
                  currentPage === pageNum
                    ? 'bg-purple-600 text-white'
                    : 'border border-gray-300 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmployeeTable
