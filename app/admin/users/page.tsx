"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, Plus, Edit, Trash2, CheckCircle, XCircle, 
  RefreshCcw, DownloadCloud, Filter, UserPlus, AlertTriangle,
  Save, X, Lock, Mail, FileText, CheckSquare, ChevronLeft, ChevronRight,
  Clock, Phone
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department?: string
  status: string
  createdAt: string
  position?: string
  phone?: string
  employeeId?: string
  salary?: number
  hireDate?: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  department?: string
  position?: string
  phone?: string
  employeeId?: string
  password?: string
}

interface ApiResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Department options
const departments = [
  "Information Technology",
  "Human Resources", 
  "Accounting",
  "Faculty",
  "Maintenance",
  "Administration"
]

// Role options
const roles = [
  "ADMIN",
  "EMPLOYEE"
]

// Positions by department
const positionsByDepartment = {
  "Information Technology": ["System Administrator", "Network Specialist", "Software Developer", "Database Administrator", "IT Support"],
  "Human Resources": ["HR Manager", "HR Specialist", "Recruitment Officer", "Training Coordinator", "Employee Relations"],
  "Accounting": ["Accountant", "Senior Accountant", "Bookkeeper", "Payroll Specialist", "Financial Analyst"],
  "Faculty": ["Professor", "Associate Professor", "Assistant Professor", "Instructor", "Research Associate"],
  "Maintenance": ["Facilities Manager", "Maintenance Technician", "Custodian", "Groundskeeper", "Electrician"],
  "Administration": ["Office Manager", "Administrative Assistant", "Records Officer", "Executive Secretary", "Office Coordinator"]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [itemsPerPage] = useState(10)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "",
    position: "",
    phone: "",
    employeeId: "",
    hireDate: "",
    salary: "",
    address: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    status: "ACTIVE",
    notes: ""
  })

  const { toast } = useToast()

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedDepartment !== "All Departments" && { department: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: ApiResponse = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.pages)
      setTotalUsers(data.pagination.total)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, selectedDepartment, selectedStatus])

  // Reset form data
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      department: "",
      position: "",
      phone: "",
      employeeId: "",
      hireDate: "",
      salary: "",
      address: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      status: "ACTIVE",
      notes: ""
    })
    setErrors({})
  }

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.email.includes('@')) newErrors.email = "Invalid email format"
    if (!showEditDialog && !formData.password) newErrors.password = "Password is required"
    if (!formData.role) newErrors.role = "Role is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle add user
  const handleAddUser = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    if (!validateForm() || !selectedUser) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      department: user.department || "",
      position: user.position || "",
      phone: user.phone || "",
      employeeId: user.employeeId || "",
      hireDate: user.hireDate ? new Date(user.hireDate).toISOString().split('T')[0] : "",
      salary: user.salary?.toString() || "",
      address: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      status: user.status,
      notes: ""
    })
    setShowEditDialog(true)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'terminated': return 'destructive'
      default: return 'outline'
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
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

  // Function to get status badge color
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

      {loading ? (
        <SkeletonCard lines={10} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-bisu-yellow-DEFAULT flex items-center">
                  <UserPlus size={20} className="mr-2" />
                  Employee Management
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light/10"
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
                          className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light/10"
                          onClick={() => setShowAddDialog(true)}
                        >
                    <Plus size={16} className="mr-2" />
                    Add User
                  </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add new user</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light/10"
                          onClick={() => setShowAddDialog(true)}
                        >
                    <UserPlus size={16} className="mr-2" />
                    Add User
                  </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add new user</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow-DEFAULT" />
                  <Input
                    placeholder="Search by name, email, ID, or position..."
                    className="pl-10 bg-bisu-purple-light text-white placeholder:text-bisu-yellow-DEFAULT/70 border-bisu-yellow-DEFAULT/30 focus:border-bisu-yellow-DEFAULT"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[180px] bg-bisu-purple-light text-white border-bisu-yellow-DEFAULT/30">
                      <Filter size={16} className="mr-2 text-bisu-yellow-DEFAULT" />
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-[260px]">
                    <TabsList className="bg-bisu-purple-light border-bisu-yellow-DEFAULT/30 text-bisu-yellow-light hover:text-bisu-yellow-DEFAULT">
                      <TabsTrigger value="all" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="active" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                        Active
                      </TabsTrigger>
                      <TabsTrigger value="inactive" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                        Inactive
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
                        Pending
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-bisu-purple-deep/90 to-bisu-purple-medium/90 text-white hover:bg-bisu-purple-deep/90">
                      <TableHead className="font-semibold text-bisu-yellow-DEFAULT border-b border-bisu-purple-light/20 py-3">Name</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow-DEFAULT border-b border-bisu-purple-light/20">Email</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow-DEFAULT border-b border-bisu-purple-light/20">Position</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow-DEFAULT border-b border-bisu-purple-light/20">Department</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow-DEFAULT border-b border-bisu-purple-light/20">Status</TableHead>
                      <TableHead className="font-semibold text-bisu-yellow-DEFAULT border-b border-bisu-purple-light/20">Date Added</TableHead>
                      <TableHead className="text-right font-semibold text-bisu-yellow-DEFAULT border-b border-bisu-purple-light/20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-16 w-16 text-gray-300 mb-3" />
                            <p className="text-xl font-medium text-gray-400">No users found</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                          </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                      users.map((user, index) => (
                        <TableRow 
                          key={user.id} 
                          className={`transition-all hover:bg-bisu-purple-light/5 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          onClick={() => {
                            setSelectedUser(user)
                            // setIsUserDetailsDialogOpen(true) // This dialog is no longer used
                          }}
                        >
                          <TableCell className="font-medium border-b border-gray-100 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 bg-gradient-to-br from-bisu-purple-deep to-bisu-purple-medium text-white ring-2 ring-bisu-yellow-DEFAULT/20 ring-offset-1">
                                <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                {/* {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />} */}
                              </Avatar>
                              <div>
                                <span className="font-semibold text-bisu-purple-deep">{user.firstName} {user.lastName}</span>
                                {user.employeeId && (
                                  <p className="text-xs text-gray-500">{user.employeeId}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="border-b border-gray-100 font-medium">{user.position}</TableCell>
                          <TableCell className="border-b border-gray-100">{user.department}</TableCell>
                          <TableCell className="border-b border-gray-100">{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="border-b border-gray-100 text-sm text-gray-600">{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right border-b border-gray-100">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild onClick={(e) => {
                                    e.stopPropagation()
                                    openEditDialog(user)
                                  }}>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                                      <Edit size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit user</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild onClick={(e) => {
                                    e.stopPropagation()
                                    // setSelectedUser(user) // This dialog is no longer used
                                    // setIsResetPasswordDialogOpen(true) // This dialog is no longer used
                                  }}>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                                      <Lock size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reset password</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                            {user.status === "active" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild onClick={(e) => {
                                      e.stopPropagation()
                                      // handleStatusChange(user, "inactive") // This function is no longer used
                                    }}>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                                <XCircle size={16} />
                              </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deactivate user</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild onClick={(e) => {
                                      e.stopPropagation()
                                      // handleStatusChange(user, "active") // This function is no longer used
                                    }}>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-full">
                                <CheckCircle size={16} />
                              </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Activate user</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedUser(user)
                                    setShowDeleteDialog(true)
                                  }}>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                              <Trash2 size={16} />
                            </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete user</p>
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
                          : 'border-bisu-purple-light/30 text-bisu-purple-deep hover:bg-bisu-purple-light/10'
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
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Enter the details of the new user to add to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-firstName" className="text-left font-medium">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="add-firstName" 
                placeholder="First Name" 
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs">{errors.firstName}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-lastName" className="text-left font-medium">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="add-lastName" 
                placeholder="Last Name" 
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs">{errors.lastName}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-email" className="text-left font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="add-email" 
                placeholder="email@bisu.edu.ph" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-password" className="text-left font-medium">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="add-password" 
                type="password" 
                placeholder="Password" 
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="add-role" className="text-left font-medium">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role} className="capitalize">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-xs">{errors.role}</p>
                )}
              </div>
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="add-department" className="text-left font-medium">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value, position: "" }))}
                >
                  <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-red-500 text-xs">{errors.department}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-position" className="text-left font-medium">
                Position <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.position} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                disabled={!formData.department}
              >
                <SelectTrigger className={errors.position ? "border-red-500" : ""}>
                  <SelectValue placeholder={formData.department ? "Select position" : "Select department first"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.department && positionsByDepartment[formData.department as keyof typeof positionsByDepartment]?.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.position && (
                <p className="text-red-500 text-xs">{errors.position}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-phone" className="text-left font-medium">
                Phone Number
              </Label>
              <Input 
                id="add-phone" 
                placeholder="09XXXXXXXXX" 
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs">{errors.phone}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-employeeId" className="text-left font-medium">
                Employee ID <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="add-employeeId" 
                placeholder="BISU-YYYY-XXX" 
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                className={errors.employeeId ? "border-red-500" : ""}
              />
              {errors.employeeId && (
                <p className="text-red-500 text-xs">{errors.employeeId}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-hireDate" className="text-left font-medium">
                Hire Date
              </Label>
              <Input 
                id="add-hireDate" 
                type="date" 
                value={formData.hireDate}
                onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                className="border-bisu-purple-light/30"
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-salary" className="text-left font-medium">
                Salary (optional)
              </Label>
              <Input 
                id="add-salary" 
                type="number" 
                placeholder="Enter salary" 
                value={formData.salary}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                className="border-bisu-purple-light/30"
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-address" className="text-left font-medium">
                Address (optional)
              </Label>
              <Textarea 
                id="add-address" 
                placeholder="Enter address" 
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-emergencyContactName" className="text-left font-medium">
                Emergency Contact Name (optional)
              </Label>
              <Input 
                id="add-emergencyContactName" 
                placeholder="Enter emergency contact name" 
                value={formData.emergencyContactName}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                className="border-bisu-purple-light/30"
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-emergencyContactRelationship" className="text-left font-medium">
                Emergency Contact Relationship (optional)
              </Label>
              <Input 
                id="add-emergencyContactRelationship" 
                placeholder="Enter relationship" 
                value={formData.emergencyContactRelationship}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                className="border-bisu-purple-light/30"
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="add-emergencyContactPhone" className="text-left font-medium">
                Emergency Contact Phone (optional)
              </Label>
              <Input 
                id="add-emergencyContactPhone" 
                placeholder="Enter phone number" 
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                className="border-bisu-purple-light/30"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-employeeId" className="text-left font-medium">
                Employee ID <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="edit-employeeId" 
                placeholder="BISU-YYYY-XXX" 
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                className={errors.employeeId ? "border-red-500" : ""}
              />
              {errors.employeeId && (
                <p className="text-red-500 text-xs">{errors.employeeId}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-firstName" className="text-left font-medium">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="edit-firstName" 
                placeholder="First Name" 
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs">{errors.firstName}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-lastName" className="text-left font-medium">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="edit-lastName" 
                placeholder="Last Name" 
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs">{errors.lastName}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-email" className="text-left font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="edit-email" 
                placeholder="email@bisu.edu.ph" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-password" className="text-left font-medium">
                Password (leave empty to keep current)
              </Label>
              <Input 
                id="edit-password" 
                type="password" 
                placeholder="Password" 
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-role" className="text-left font-medium">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role} className="capitalize">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-xs">{errors.role}</p>
                )}
              </div>
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-department" className="text-left font-medium">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value, position: "" }))}
                >
                  <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-red-500 text-xs">{errors.department}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-position" className="text-left font-medium">
                Position <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.position} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger className={errors.position ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positionsByDepartment[formData.department as keyof typeof positionsByDepartment]?.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.position && (
                <p className="text-red-500 text-xs">{errors.position}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-phone" className="text-left font-medium">
                Phone Number
              </Label>
              <Input 
                id="edit-phone" 
                placeholder="09XXXXXXXXX" 
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs">{errors.phone}</p>
              )}
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-status" className="text-left font-medium">
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="edit-notes" className="text-left font-medium">
                Notes (optional)
              </Label>
              <Textarea 
                id="edit-notes" 
                placeholder="Additional notes about this user..." 
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user
              from the system.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-md mb-4">
                <p className="text-sm text-red-700">
                  Are you sure you want to delete <span className="font-bold">{selectedUser.firstName} {selectedUser.lastName}</span>?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Employee ID</Label>
                  <p className="font-medium">{selectedUser.employeeId}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Department</Label>
                  <p className="font-medium">{selectedUser.department}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Position</Label>
                  <p className="font-medium">{selectedUser.position}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 