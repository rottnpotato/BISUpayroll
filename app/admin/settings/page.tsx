"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Activity, 
  Calendar as CalendarIcon, 
  Filter, 
  RefreshCw, 
  Search, 
  User, 
  FileText, 
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface AuditLog {
  id: string
  userId: string | null
  action: string
  entityType: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  } | null
}

interface LogFilters {
  action: string
  entityType: string
  userId: string
  startDate: Date | undefined
  endDate: Date | undefined
  search: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState<LogFilters>({
    action: "all",
    entityType: "all",
    userId: "",
    startDate: undefined,
    endDate: undefined,
    search: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, filters])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.action && filters.action !== "all") searchParams.set("action", filters.action)
      if (filters.entityType && filters.entityType !== "all") searchParams.set("entityType", filters.entityType)
      if (filters.userId) searchParams.set("userId", filters.userId)
      if (filters.startDate) searchParams.set("startDate", filters.startDate.toISOString())
      if (filters.endDate) searchParams.set("endDate", filters.endDate.toISOString())

      const response = await fetch(`/api/admin/logs?${searchParams}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`Failed to fetch logs: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      setLogs(data.logs || [])
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error(`Failed to load audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshLogs = async () => {
    setIsRefreshing(true)
    await fetchLogs()
  }

  const clearFilters = () => {
    setFilters({
      action: "all",
      entityType: "all",
      userId: "",
      startDate: undefined,
      endDate: undefined,
      search: ""
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'login': return 'bg-purple-100 text-purple-800'
      case 'logout': return 'bg-gray-100 text-gray-800 '
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user': return <User className="h-4 w-4" />
      case 'payroll': return <FileText className="h-4 w-4" />
      case 'attendance': return <Clock className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">System Activity Logs</h1>
            <p className="text-gray-600">Monitor and track all system activities and user actions</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white">
                <Maximize2 className="h-4 w-4 mr-2" />
                Expanded View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-bisu-purple-deep text-xl">Activity Logs - Expanded View</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Modal Filters */}
                <Card className="shadow-md mb-4 flex-shrink-0">
                  <CardHeader className="bg-gradient-to-r from-bisu-yellow to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg py-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Filter className="h-4 w-4" />
                      Filters & Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Action</Label>
                        <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value === "all" ? "" : value }))}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="All Actions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="create">Create</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="delete">Delete</SelectItem>
                            <SelectItem value="login">Login</SelectItem>
                            <SelectItem value="logout">Logout</SelectItem>
                            <SelectItem value="approve">Approve</SelectItem>
                            <SelectItem value="reject">Reject</SelectItem>
                            <SelectItem value="process">Process</SelectItem>
                            <SelectItem value="view">View</SelectItem>
                            <SelectItem value="export">Export</SelectItem>
                            <SelectItem value="system_start">System Start</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">Entity Type</Label>
                        <Select value={filters.entityType} onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value === "all" ? "" : value }))}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="User">User</SelectItem>
                            <SelectItem value="Payroll">Payroll</SelectItem>
                            <SelectItem value="Attendance">Attendance</SelectItem>
                            <SelectItem value="Leave">Leave</SelectItem>
                            <SelectItem value="System">System</SelectItem>
                            <SelectItem value="Auth">Auth</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal h-8 text-sm">
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {filters.startDate ? format(filters.startDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={filters.startDate}
                              onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal h-8 text-sm">
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {filters.endDate ? format(filters.endDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={filters.endDate}
                              onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <Input 
                            placeholder="Search logs..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-8 h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={clearFilters} variant="outline" size="sm">
                        Clear Filters
                      </Button>
                      <Button onClick={refreshLogs} disabled={isRefreshing} size="sm">
                        <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Modal Table */}
                <Card className="shadow-md flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg py-3 flex-shrink-0">
                    <CardTitle className="text-bisu-yellow flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4" />
                      Activity Logs ({pagination.total} total)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bisu-purple-deep"></div>
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium">No logs found</p>
                        <p className="text-sm">Try adjusting your filters or check back later</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                              <TableRow className="text-center">
                                <TableHead className="text-center">Timestamp</TableHead>
                                <TableHead className="text-center">User</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                                <TableHead className="text-center">Entity</TableHead>
                                <TableHead className="text-center">Details</TableHead>
                                <TableHead className="text-center">IP Address</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-yellow-50/80">
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {format(new Date(log.createdAt), "MMM d, yyyy")}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        {format(new Date(log.createdAt), "HH:mm:ss")}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {formatTimeAgo(log.createdAt)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {log.user ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-bisu-purple-light rounded-full flex items-center justify-center">
                                          <User className="h-4 w-4 text-bisu-purple-deep" />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {log.user.firstName} {log.user.lastName}
                                          </span>
                                          <span className="text-sm text-gray-500">{log.user.email}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">System</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getActionBadgeColor(log.action)}>
                                      {log.action.toUpperCase()}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getEntityIcon(log.entityType)}
                                      <span className="font-medium">{log.entityType}</span>
                                      {log.entityId && (
                                        <span className="text-sm text-gray-500">#{log.entityId.slice(-8)}</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-md">
                                    <div className="truncate" title={log.details || undefined}>
                                      {log.details || <span className="text-gray-400 italic">No details</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-mono text-sm">
                                      {log.ipAddress || <span className="text-gray-400 italic">Unknown</span>}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Modal Pagination */}
                        <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50 flex-shrink-0">
                          <div className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                              disabled={!pagination.hasPrev}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <span className="px-3 py-1 text-sm bg-bisu-purple-light text-bisu-purple-deep rounded">
                              {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                              disabled={!pagination.hasNext}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-md mb-6">
        <CardHeader className="bg-gradient-to-r from-bisu-yellow to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="process">Process</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="system_start">System Start</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={filters.entityType} onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Payroll">Payroll</SelectItem>
                  <SelectItem value="Attendance">Attendance</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                  <SelectItem value="Auth">Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
            <Button onClick={refreshLogs} disabled={isRefreshing} size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
          <CardTitle className="text-bisu-yellow flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs ({pagination.total} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bisu-purple-deep"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No logs found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="text-center">
                    <TableHead className="text-center">Timestamp</TableHead>
                    <TableHead className="text-center">User</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                    <TableHead className="text-center">Entity</TableHead>
                    <TableHead className="text-center">Details</TableHead>
                    <TableHead className="text-center">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-yellow-50/80">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(log.createdAt), "MMM d, yyyy")}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(log.createdAt), "HH:mm:ss")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(log.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-bisu-purple-light rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-bisu-purple-deep" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {log.user.firstName} {log.user.lastName}
                              </span>
                              <span className="text-sm text-gray-500">{log.user.email}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEntityIcon(log.entityType)}
                          <span className="font-medium">{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-sm text-gray-500">#{log.entityId.slice(-8)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={log.details || undefined}>
                          {log.details || <span className="text-gray-400 italic">No details</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {log.ipAddress || <span className="text-gray-400 italic">Unknown</span>}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm bg-bisu-purple-light text-bisu-purple-deep rounded">
                    {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 