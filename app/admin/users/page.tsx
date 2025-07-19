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
  id: number
  name: string
  email: string
  role: string
  department: string
  status: string
  dateCreated: string
  avatar?: string
  position?: string
  phone?: string
  lastLogin?: string
  notes?: string
  employeeId?: string
}

interface FormErrors {
  name?: string
  email?: string
  role?: string
  department?: string
  position?: string
  phone?: string
  employeeId?: string
}

// Mock user data
const mockUsers: User[] = [
  { 
    id: 1, 
    name: "Juan Dela Cruz", 
    email: "juan.delacruz@bisu.edu.ph", 
    role: "admin", 
    department: "IT Department", 
    status: "active",
    dateCreated: "2023-10-15",
    position: "IT Administrator",
    phone: "09123456789",
    lastLogin: "2024-06-14 09:45 AM",
    employeeId: "BISU-2023-001"
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    email: "maria.santos@bisu.edu.ph", 
    role: "employee", 
    department: "Accounting", 
    status: "active",
    dateCreated: "2023-11-01",
    position: "Senior Accountant",
    phone: "09234567890",
    lastLogin: "2024-06-13 02:30 PM",
    employeeId: "BISU-2023-002"
  },
  { 
    id: 3, 
    name: "Pedro Reyes", 
    email: "pedro.reyes@bisu.edu.ph", 
    role: "employee", 
    department: "HR", 
    status: "active",
    dateCreated: "2023-11-05",
    position: "HR Specialist",
    phone: "09345678901",
    lastLogin: "2024-06-14 08:15 AM",
    employeeId: "BISU-2023-003"
  },
  { 
    id: 4, 
    name: "Ana Gonzales", 
    email: "ana.gonzales@bisu.edu.ph", 
    role: "employee", 
    department: "Faculty", 
    status: "inactive",
    dateCreated: "2023-11-10",
    position: "Professor",
    phone: "09456789012",
    lastLogin: "2024-06-10 10:20 AM",
    employeeId: "BISU-2023-004"
  },
  { 
    id: 5, 
    name: "Roberto Carlos", 
    email: "roberto.carlos@bisu.edu.ph", 
    role: "employee", 
    department: "Maintenance", 
    status: "pending",
    dateCreated: "2023-12-01",
    position: "Facilities Manager",
    phone: "09567890123",
    lastLogin: "Not logged in yet",
    employeeId: "BISU-2023-005"
  },
  { 
    id: 6, 
    name: "Sofia Luna", 
    email: "sofia.luna@bisu.edu.ph", 
    role: "manager", 
    department: "Admin Office", 
    status: "active",
    dateCreated: "2023-12-05",
    position: "Office Manager",
    phone: "09678901234",
    lastLogin: "2024-06-14 11:05 AM",
    employeeId: "BISU-2023-006"
  },
]

// Department options
const departments = [
  "All Departments",
  "IT Department",
  "HR",
  "Accounting",
  "Faculty",
  "Maintenance",
  "Admin Office"
]

// Role options
const roles = [
  "admin",
  "manager",
  "employee"
]

// Positions options by department
const positionsByDepartment = {
  "IT Department": ["IT Administrator", "System Analyst", "Network Specialist", "Software Developer", "Database Administrator"],
  "HR": ["HR Manager", "HR Specialist", "Recruitment Officer", "Training Coordinator", "Employee Relations Specialist"],
  "Accounting": ["Chief Accountant", "Senior Accountant", "Bookkeeper", "Payroll Specialist", "Financial Analyst"],
  "Faculty": ["Professor", "Associate Professor", "Assistant Professor", "Instructor", "Research Associate"],
  "Maintenance": ["Facilities Manager", "Maintenance Technician", "Custodian", "Groundskeeper", "Electrician"],
  "Admin Office": ["Office Manager", "Administrative Assistant", "Records Officer", "Executive Secretary", "Office Coordinator"]
}

export default function UsersManagementPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    role: "",
    department: "",
    status: "pending",
    position: "",
    phone: "",
    employeeId: "",
    notes: ""
  })
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load users data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setUsers(mockUsers)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Focus search input on mount
  useEffect(() => {
    if (!isLoading && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isLoading])

  // Filter users based on search term, department, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDepartment = 
      selectedDepartment === "All Departments" || 
      user.department === selectedDepartment
    
    const matchesStatus = 
      selectedStatus === "all" || 
      user.status === selectedStatus
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset form errors
  const resetFormErrors = () => {
    setFormErrors({})
  }

  // Validate form
  const validateForm = (data: Partial<User>): boolean => {
    const errors: FormErrors = {}

    if (!data.name?.trim()) {
      errors.name = "Name is required"
    }

    if (!data.email?.trim()) {
      errors.email = "Email is required"
    } else if (!data.email.includes('@') || !data.email.includes('.') || !data.email.endsWith('bisu.edu.ph')) {
      errors.email = "Must be a valid BISU email address"
    }

    if (!data.role) {
      errors.role = "Role is required"
    }

    if (!data.department) {
      errors.department = "Department is required"
    }

    if (!data.position) {
      errors.position = "Position is required"
    }

    if (data.phone && !/^09\d{9}$/.test(data.phone)) {
      errors.phone = "Phone must be in format: 09XXXXXXXXX"
    }

    if (!data.employeeId) {
      errors.employeeId = "Employee ID is required"
    } else if (!/^BISU-\d{4}-\d{3}$/.test(data.employeeId)) {
      errors.employeeId = "Format must be BISU-YYYY-XXX"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle new user form change
  const handleNewUserChange = (field: string, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }))
    
    // Auto-fill position options when department changes
    if (field === "department" && value) {
      setNewUser(prev => ({ ...prev, position: "" }))
    }
  }

  // Handle add user
  const handleAddUser = () => {
    if (validateForm(newUser)) {
      const timestamp = new Date().toISOString().split('T')[0]
      const newUserData: User = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name: newUser.name!,
        email: newUser.email!,
        role: newUser.role!,
        department: newUser.department!,
        position: newUser.position!,
        phone: newUser.phone || "",
        status: "pending",
        dateCreated: timestamp,
        employeeId: newUser.employeeId!,
        notes: newUser.notes || "",
        lastLogin: "Not logged in yet"
      }

      setUsers(prev => [...prev, newUserData])
      setIsAddUserDialogOpen(false)
      resetForm()
      
      toast({
        title: "User Added",
        description: `${newUserData.name} has been added successfully.`,
        variant: "default",
      })
      
      // Update the updates.md file
      updateChangelog(`Added new user: ${newUserData.name} (${newUserData.employeeId})`)
    }
  }

  // Handle edit user
  const handleEditUser = () => {
    if (selectedUser && validateForm(selectedUser)) {
      setUsers(prev => 
        prev.map(user => 
          user.id === selectedUser.id ? selectedUser : user
        )
      )
      setIsEditUserDialogOpen(false)
      
      toast({
        title: "User Updated",
        description: `${selectedUser.name} has been updated successfully.`,
        variant: "default",
      })
      
      // Update the updates.md file
      updateChangelog(`Updated user: ${selectedUser.name} (${selectedUser.employeeId})`)
    }
  }

  // Handle delete user
  const handleDeleteUser = () => {
    if (selectedUser) {
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id))
      setIsDeleteUserDialogOpen(false)
      
      toast({
        title: "User Deleted",
        description: `${selectedUser.name} has been deleted from the system.`,
        variant: "destructive",
      })
      
      // Update the updates.md file
      updateChangelog(`Deleted user: ${selectedUser.name} (${selectedUser.employeeId})`)
    }
  }

  // Handle reset password
  const handleResetPassword = () => {
    if (selectedUser) {
      setIsResetPasswordDialogOpen(false)
      
      toast({
        title: "Password Reset",
        description: `Password reset link has been sent to ${selectedUser.email}.`,
        variant: "default",
      })
      
      // Update the updates.md file
      updateChangelog(`Reset password for: ${selectedUser.name} (${selectedUser.employeeId})`)
    }
  }

  // Handle status change
  const handleStatusChange = (user: User, newStatus: string) => {
    const updatedUser = { ...user, status: newStatus }
    setUsers(prev => 
      prev.map(u => 
        u.id === user.id ? updatedUser : u
      )
    )
    
    toast({
      title: "Status Updated",
      description: `${user.name}'s status changed to ${newStatus}.`,
      variant: "default",
    })
    
    // Update the updates.md file
    updateChangelog(`Changed status for ${user.name} (${user.employeeId}) to ${newStatus}`)
  }

  // Export users data
  const handleExportUsers = () => {
    try {
      const exportData = filteredUsers.map(({ id, name, email, role, department, status, dateCreated, position, employeeId }) => ({
        "Employee ID": employeeId,
        "Name": name,
        "Email": email,
        "Role": role,
        "Department": department,
        "Position": position,
        "Status": status,
        "Date Added": dateCreated
      }))
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(exportData[0]).join(",") + "\n" +
        exportData.map(row => 
          Object.values(row).map(val => `"${val}"`).join(",")
        ).join("\n")
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `bisu_users_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export Successful",
        description: `${filteredUsers.length} users exported to CSV file.`,
        variant: "default",
      })
      
      // Update the updates.md file
      updateChangelog(`Exported ${filteredUsers.length} users to CSV`)
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting users data.",
        variant: "destructive",
      })
    }
  }

  // Refresh users data
  const handleRefreshUsers = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Data Refreshed",
        description: "User data has been refreshed.",
        variant: "default",
      })
    }, 1000)
  }

  // Reset form
  const resetForm = () => {
    setNewUser({
      name: "",
      email: "",
      role: "",
      department: "",
      status: "pending",
      position: "",
      phone: "",
      employeeId: "",
      notes: ""
    })
    resetFormErrors()
  }

  // Update the changelog
  const updateChangelog = async (message: string) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const changelogEntry = `- ${message}`
    
    // This would typically be an API call to update the changelog file
    console.log(`[${timestamp}] ${changelogEntry}`)
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
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">User Management</h1>
        <p className="text-gray-600">Manage users and permissions in the system</p>
      </motion.div>

      <Toaster />

      {isLoading ? (
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
                  Users
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light/10"
                          onClick={handleRefreshUsers}
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
                          onClick={handleExportUsers}
                        >
                    <DownloadCloud size={16} className="mr-2" />
                    Export
                  </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export users to CSV</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Dialog open={isAddUserDialogOpen} onOpenChange={(open) => {
                    setIsAddUserDialogOpen(open)
                    if (!open) resetForm()
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-bisu-yellow-DEFAULT text-bisu-purple-deep hover:bg-bisu-yellow-light font-medium">
                        <UserPlus size={16} className="mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Enter the details of the new user to add to the system.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 items-center gap-2">
                          <Label htmlFor="employeeId" className="text-left font-medium">
                            Employee ID <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            id="employeeId" 
                            placeholder="BISU-YYYY-XXX" 
                            value={newUser.employeeId || ''}
                            onChange={(e) => handleNewUserChange('employeeId', e.target.value)}
                            className={formErrors.employeeId ? "border-red-500" : ""}
                          />
                          {formErrors.employeeId && (
                            <p className="text-red-500 text-xs">{formErrors.employeeId}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 items-center gap-2">
                          <Label htmlFor="name" className="text-left font-medium">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            id="name" 
                            placeholder="Full Name" 
                            value={newUser.name || ''}
                            onChange={(e) => handleNewUserChange('name', e.target.value)}
                            className={formErrors.name ? "border-red-500" : ""}
                          />
                          {formErrors.name && (
                            <p className="text-red-500 text-xs">{formErrors.name}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 items-center gap-2">
                          <Label htmlFor="email" className="text-left font-medium">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            id="email" 
                            placeholder="email@bisu.edu.ph" 
                            value={newUser.email || ''}
                            onChange={(e) => handleNewUserChange('email', e.target.value)}
                            className={formErrors.email ? "border-red-500" : ""}
                          />
                          {formErrors.email && (
                            <p className="text-red-500 text-xs">{formErrors.email}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-1 items-center gap-2">
                            <Label htmlFor="role" className="text-left font-medium">
                              Role <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={newUser.role} 
                              onValueChange={(value) => handleNewUserChange('role', value)}
                            >
                              <SelectTrigger className={formErrors.role ? "border-red-500" : ""}>
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
                            {formErrors.role && (
                              <p className="text-red-500 text-xs">{formErrors.role}</p>
                            )}
                        </div>
                          
                          <div className="grid grid-cols-1 items-center gap-2">
                            <Label htmlFor="department" className="text-left font-medium">
                              Department <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={newUser.department} 
                              onValueChange={(value) => handleNewUserChange('department', value)}
                            >
                              <SelectTrigger className={formErrors.department ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.slice(1).map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                            {formErrors.department && (
                              <p className="text-red-500 text-xs">{formErrors.department}</p>
                            )}
                        </div>
                      </div>
                        
                        <div className="grid grid-cols-1 items-center gap-2">
                          <Label htmlFor="position" className="text-left font-medium">
                            Position <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={newUser.position} 
                            onValueChange={(value) => handleNewUserChange('position', value)}
                            disabled={!newUser.department}
                          >
                            <SelectTrigger className={formErrors.position ? "border-red-500" : ""}>
                              <SelectValue placeholder={newUser.department ? "Select position" : "Select department first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {newUser.department && positionsByDepartment[newUser.department as keyof typeof positionsByDepartment]?.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.position && (
                            <p className="text-red-500 text-xs">{formErrors.position}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 items-center gap-2">
                          <Label htmlFor="phone" className="text-left font-medium">
                            Phone Number
                          </Label>
                          <Input 
                            id="phone" 
                            placeholder="09XXXXXXXXX" 
                            value={newUser.phone || ''}
                            onChange={(e) => handleNewUserChange('phone', e.target.value)}
                            className={formErrors.phone ? "border-red-500" : ""}
                          />
                          {formErrors.phone && (
                            <p className="text-red-500 text-xs">{formErrors.phone}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 items-center gap-2">
                          <Label htmlFor="notes" className="text-left font-medium">
                            Notes
                          </Label>
                          <Textarea 
                            id="notes" 
                            placeholder="Additional notes about this user..." 
                            value={newUser.notes || ''}
                            onChange={(e) => handleNewUserChange('notes', e.target.value)}
                            className="resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button onClick={handleAddUser} className="bg-bisu-yellow-DEFAULT text-bisu-purple-deep hover:bg-bisu-yellow-light">
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Add User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-bisu-yellow-DEFAULT" />
                  <Input
                    ref={searchInputRef}
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
                    {currentItems.length === 0 ? (
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
                      currentItems.map((user, index) => (
                        <TableRow 
                          key={user.id} 
                          className={`transition-all hover:bg-bisu-purple-light/5 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          onClick={() => {
                            setSelectedUser(user)
                            setIsUserDetailsDialogOpen(true)
                          }}
                        >
                          <TableCell className="font-medium border-b border-gray-100 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 bg-gradient-to-br from-bisu-purple-deep to-bisu-purple-medium text-white ring-2 ring-bisu-yellow-DEFAULT/20 ring-offset-1">
                                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                              </Avatar>
                              <div>
                                <span className="font-semibold text-bisu-purple-deep">{user.name}</span>
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
                          <TableCell className="border-b border-gray-100 text-sm text-gray-600">{user.dateCreated}</TableCell>
                          <TableCell className="text-right border-b border-gray-100">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedUser(user)
                                    setIsEditUserDialogOpen(true)
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
                                    setSelectedUser(user)
                                    setIsResetPasswordDialogOpen(true)
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
                                      handleStatusChange(user, "inactive")
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
                                      handleStatusChange(user, "active")
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
                                    setIsDeleteUserDialogOpen(true)
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
                Showing <span className="text-bisu-purple-deep">{currentItems.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="text-bisu-purple-deep">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of <span className="text-bisu-purple-deep">{filteredUsers.length}</span> users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(page)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 w-8 p-0 rounded-full border-bisu-purple-light/30 text-bisu-purple-deep disabled:opacity-50"
                >
                  <span className="sr-only">Next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="itemsPerPage" className="text-sm text-gray-500 font-medium">Items per page:</Label>
                <Select value={String(itemsPerPage)} onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="h-8 w-[70px] border-bisu-purple-light/30 focus:ring-bisu-purple-light">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {/* User Details Dialog */}
      <Dialog open={isUserDetailsDialogOpen} onOpenChange={setIsUserDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white p-6 rounded-t-lg -mt-6 -mx-6 mb-6">
            <DialogTitle className="text-bisu-yellow-DEFAULT text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Detailed information about the selected user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-6 py-2">
              <div className="flex flex-col items-center justify-center gap-2 mb-2 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-bisu-purple-light/10 to-transparent rounded-xl -z-10"></div>
                <Avatar className="h-24 w-24 text-xl bg-gradient-to-br from-bisu-purple-deep to-bisu-purple-medium text-white ring-4 ring-bisu-yellow-DEFAULT/20 ring-offset-2 mt-3">
                  <AvatarFallback>{selectedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  {selectedUser.avatar && <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />}
                </Avatar>
                <h3 className="text-xl font-bold text-bisu-purple-deep mt-2">{selectedUser.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusBadge(selectedUser.status)}
                  <Badge variant="outline" className="capitalize bg-bisu-purple-light/10 text-bisu-purple-medium border-bisu-purple-light/20 font-medium px-3 py-1 rounded-full">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                  <Label className="text-xs text-gray-500 block mb-1">Employee ID</Label>
                  <p className="font-semibold text-bisu-purple-deep">{selectedUser.employeeId}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 block mb-1">Department</Label>
                  <p className="font-semibold text-bisu-purple-deep">{selectedUser.department}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 block mb-1">Position</Label>
                  <p className="font-semibold text-bisu-purple-deep">{selectedUser.position}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 block mb-1">Date Added</Label>
                  <p className="font-semibold text-bisu-purple-deep">{selectedUser.dateCreated}</p>
                </div>
              </div>
              
              <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 block">Email Address</Label>
                    <span className="text-sm font-medium">{selectedUser.email}</span>
                  </div>
                </div>
                
                {selectedUser.phone && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 block">Phone Number</Label>
                      <span className="text-sm font-medium">{selectedUser.phone}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 block">Last Login</Label>
                    <span className="text-sm font-medium">{selectedUser.lastLogin}</span>
                  </div>
                </div>
              </div>
              
              {selectedUser.notes && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Notes</Label>
                  <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-sm">
                    {selectedUser.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsUserDetailsDialogOpen(false)} className="rounded-full">
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 rounded-full"
                onClick={() => {
                  setIsUserDetailsDialogOpen(false)
                  setIsResetPasswordDialogOpen(true)
                }}
              >
                <Lock className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <Button
                className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white hover:bg-bisu-purple-deep rounded-full"
                onClick={() => {
                  setIsUserDetailsDialogOpen(false)
                  setIsEditUserDialogOpen(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-employeeId" className="text-left font-medium">
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="edit-employeeId" 
                  placeholder="BISU-YYYY-XXX" 
                  value={selectedUser.employeeId || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, employeeId: e.target.value})}
                  className={formErrors.employeeId ? "border-red-500" : ""}
                />
                {formErrors.employeeId && (
                  <p className="text-red-500 text-xs">{formErrors.employeeId}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-name" className="text-left font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="edit-name" 
                  placeholder="Full Name" 
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs">{formErrors.name}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-email" className="text-left font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="edit-email" 
                  placeholder="email@bisu.edu.ph" 
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs">{formErrors.email}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 items-center gap-2">
                  <Label htmlFor="edit-role" className="text-left font-medium">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                  >
                    <SelectTrigger className={formErrors.role ? "border-red-500" : ""}>
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
                  {formErrors.role && (
                    <p className="text-red-500 text-xs">{formErrors.role}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 items-center gap-2">
                  <Label htmlFor="edit-department" className="text-left font-medium">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedUser.department} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, department: value, position: ""})}
                  >
                    <SelectTrigger className={formErrors.department ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.slice(1).map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.department && (
                    <p className="text-red-500 text-xs">{formErrors.department}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-position" className="text-left font-medium">
                  Position <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={selectedUser.position} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, position: value})}
                >
                  <SelectTrigger className={formErrors.position ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionsByDepartment[selectedUser.department as keyof typeof positionsByDepartment]?.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.position && (
                  <p className="text-red-500 text-xs">{formErrors.position}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-phone" className="text-left font-medium">
                  Phone Number
                </Label>
                <Input 
                  id="edit-phone" 
                  placeholder="09XXXXXXXXX" 
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                  className={formErrors.phone ? "border-red-500" : ""}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs">{formErrors.phone}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="edit-status" className="text-left font-medium">
                  Status
                </Label>
                <Select 
                  value={selectedUser.status} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, status: value})}
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
                  Notes
                </Label>
                <Textarea 
                  id="edit-notes" 
                  placeholder="Additional notes about this user..." 
                  value={selectedUser.notes || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, notes: e.target.value})}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser} 
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
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
                  Are you sure you want to delete <span className="font-bold">{selectedUser.name}</span>?
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
            <Button variant="outline" onClick={() => setIsDeleteUserDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              This will send a password reset link to the user's email address.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="p-4 border border-amber-200 bg-amber-50 rounded-md mb-4">
                <p className="text-sm text-amber-700">
                  Are you sure you want to reset the password for <span className="font-bold">{selectedUser.name}</span>?
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>Reset link will be sent to: <span className="font-medium">{selectedUser.email}</span></span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              className="bg-amber-500 text-white hover:bg-amber-600"
              onClick={handleResetPassword}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 