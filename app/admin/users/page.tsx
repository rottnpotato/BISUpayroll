"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, Plus, Edit, Trash2, RefreshCcw, Filter, UserPlus,
  ChevronLeft, ChevronRight, Clock, Users
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Import types and constants
import { User, FormData, BulkEmployee } from "./types"
import { departments } from "./constants"
import { formatDate, validateForm, getInitialFormData } from "./utils"
import { useUsers } from "./hooks/useUsers"
import { AddEmployeeDialog } from "./components/AddEmployeeDialog"
import { EditEmployeeDialog } from "./components/EditEmployeeDialog"
import { DeleteEmployeeDialog } from "./components/DeleteEmployeeDialog"
import { BulkImportDialog } from "./components/BulkImportDialog"
import { useSidebar } from "@/contexts/sidebar-context"

export default function AdminUsersPage() {
  const { isCollapsed } = useSidebar()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [formData, setFormData] = useState<FormData>(getInitialFormData())

  const { toast } = useToast()
  
  // Use custom hook for fetching users
  const { users, loading, totalPages, totalUsers, fetchUsers } = useUsers({
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedDepartment,
    selectedStatus
  })

  // Reset form data
  const resetForm = () => {
    setFormData(getInitialFormData())
    setErrors({})
  }

  // Handle add user
  const handleAddUser = async () => {
    const validationErrors = validateForm(formData, false)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      toast({
        title: "Success",
        description: "User created successfully.",
      })

      setShowAddDialog(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit user
  const handleEditUser = async () => {
    const validationErrors = validateForm(formData, true)
    if (Object.keys(validationErrors).length > 0 || !selectedUser) {
      setErrors(validationErrors)
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      toast({
        title: "Success",
        description: "User updated successfully.",
      })

      setShowEditDialog(false)
      resetForm()
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
      })

      setShowDeleteDialog(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit dialog with user data
  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      employeeType: user.employeeType || "",
      department: user.department || "",
      position: user.position || "",
      salaryGrade: user.salaryGrade?.toString() || "",
      salaryStep: user.salaryStep?.toString() || "",
      dailyRate: user.dailyRate?.toString() || "",
      phone: user.phone || "",
      employeeId: user.employeeId || "",
      hireDate: user.hireDate ? new Date(user.hireDate).toISOString().split('T')[0] : "",
      salary: "",
      address: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      status: user.status,
      notes: ""
    })
    setShowEditDialog(true)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-400/10 text-gray-500 border-gray-400/20 font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            Inactive
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="font-medium px-3 py-1 rounded-full">
            {status}
          </Badge>
        )
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
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

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Employee Management</h1>
        <p className="text-gray-600">Manage employees and permissions in the system</p>
      </motion.div>

      <Toaster />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-bisu-yellow flex items-center">
                <UserPlus size={20} className="mr-2" />
                Employee Management
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="text-bisu-yellow bg-transparent border-bisu-yellow hover:bg-bisu-yellow-light/10"
                        onClick={fetchUsers}
                      >
                        <RefreshCcw size={16} className="mr-2" />
                        Refresh
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh user data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="text-bisu-yellow bg-transparent border-bisu-yellow hover:bg-bisu-yellow-light/10"
                        onClick={() => setShowAddDialog(true)}
                      >
                        <Plus size={16} className="mr-2" />
                        Add Employee
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add new employee</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="text-bisu-yellow bg-transparent border-bisu-yellow hover:bg-bisu-yellow-light/10"
                        onClick={() => setShowBulkImportDialog(true)}
                      >
                        <Users size={16} className="mr-2" />
                        Bulk Import
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Import multiple employees</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className={`relative transition-all duration-300 ${isCollapsed ? 'md:w-[760px]' : 'md:w-[600px]'}`}>
                <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow" />
                <Input
                  placeholder="Search by name, email, ID..."
                  className="pl-8 bg-bisu-purple-light text-white placeholder:text-bisu-yellow/70 border-bisu-yellow/30 focus:border-bisu-yellow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap flex-1">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[180px] bg-bisu-purple-light text-white border-bisu-yellow/30">
                    <Filter size={16} className="mr-2 text-bisu-yellow" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Departments">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="flex-1">
                  <TabsList className="bg-bisu-purple-light border-bisu-yellow/30 text-bisu-yellow-light hover:text-bisu-yellow">
                    <TabsTrigger value="" className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="PERMANENT" className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep">
                      Permanent
                    </TabsTrigger>
                    <TabsTrigger value="CONTRACTUAL" className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep">
                      Contractual
                    </TabsTrigger>
                    <TabsTrigger value="TEMPORARY" className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep">
                      Temporary
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bisu-purple-deep"></div>
                  <p className="text-sm text-gray-500">Loading employees...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-bisu-purple-deep/90 to-bisu-purple-medium/90 text-white hover:bg-bisu-purple-deep/90">
                      <TableHead className="font-semibold text-bisu-yellow border-b border-bisu-purple-light/20 py-3">Name</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow border-b border-bisu-purple-light/20">Email</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow border-b border-bisu-purple-light/20">Position</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow border-b border-bisu-purple-light/20">Department</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow border-b border-bisu-purple-light/20">Status</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow border-b border-bisu-purple-light/20">Date Added</TableHead>
                      <TableHead className="text-right font-semibold text-bisu-yellow border-b border-bisu-purple-light/20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <Users size={48} className="text-gray-300" />
                            <p className="text-lg font-medium">No employees found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user, index) => (
                        <TableRow 
                          key={user.id} 
                          className={`transition-all hover:bg-bisu-yellow-light/5 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <TableCell className="font-medium border-b border-gray-100 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border-2 border-bisu-purple-light/30">
                                <AvatarFallback className="bg-gradient-to-br from-bisu-purple-deep to-bisu-purple-medium text-white text-sm font-semibold">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-bisu-purple-deep">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-gray-500">{user.employeeId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="border-b border-gray-100">
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="text-sm">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="border-b border-gray-100 font-medium">{user.position || 'N/A'}</TableCell>
                          <TableCell className="border-b border-gray-100">{user.department || 'N/A'}</TableCell>
                          <TableCell className="border-b border-gray-100">{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="border-b border-gray-100 text-sm text-gray-600">{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right border-b border-gray-100">
                            <div className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(user)}
                                      className="hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      <Edit size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit employee</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(user)
                                        setShowDeleteDialog(true)
                                      }}
                                      className="hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete employee</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-gray-100 p-4 bg-gray-50/50">
              <div className="text-sm text-gray-500 font-medium">
                Showing <span className="text-bisu-purple-deep">{currentPage * itemsPerPage - itemsPerPage + 1}</span> to <span className="text-bisu-purple-deep">{Math.min(currentPage * itemsPerPage, totalUsers)}</span> of <span className="text-bisu-purple-deep">{totalUsers}</span> users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 rounded-full border-bisu-purple-light/30 text-bisu-purple-deep disabled:opacity-50"
                >
                  <span className="sr-only">Previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 rounded-full ${
                        page === currentPage 
                          ? 'bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white border-0' 
                          : 'border-bisu-purple-light/30 text-bisu-purple-deep hover:bg-bisu-yellow-light/10'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 w-8 p-0 rounded-full border-bisu-purple-light/30 text-bisu-purple-deep disabled:opacity-50"
                >
                  <span className="sr-only">Next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-500 font-medium">Items per page: {itemsPerPage}</Label>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

      {/* Dialogs */}
      <AddEmployeeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={handleAddUser}
      />

      <EditEmployeeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={handleEditUser}
      />

      <DeleteEmployeeDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        user={selectedUser}
        isSubmitting={isSubmitting}
        onConfirm={handleDeleteUser}
      />

      <BulkImportDialog
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
