"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, Plus, Edit, Trash2, CheckCircle, XCircle, 
  RefreshCcw, DownloadCloud, Filter, UserPlus 
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface User {
  id: number
  name: string
  email: string
  role: string
  department: string
  status: string
  dateCreated: string
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
    dateCreated: "2023-10-15" 
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    email: "maria.santos@bisu.edu.ph", 
    role: "employee", 
    department: "Accounting", 
    status: "active",
    dateCreated: "2023-11-01" 
  },
  { 
    id: 3, 
    name: "Pedro Reyes", 
    email: "pedro.reyes@bisu.edu.ph", 
    role: "employee", 
    department: "HR", 
    status: "active",
    dateCreated: "2023-11-05" 
  },
  { 
    id: 4, 
    name: "Ana Gonzales", 
    email: "ana.gonzales@bisu.edu.ph", 
    role: "employee", 
    department: "Faculty", 
    status: "inactive",
    dateCreated: "2023-11-10" 
  },
  { 
    id: 5, 
    name: "Roberto Carlos", 
    email: "roberto.carlos@bisu.edu.ph", 
    role: "employee", 
    department: "Maintenance", 
    status: "pending",
    dateCreated: "2023-12-01" 
  },
  { 
    id: 6, 
    name: "Sofia Luna", 
    email: "sofia.luna@bisu.edu.ph", 
    role: "manager", 
    department: "Admin Office", 
    status: "active",
    dateCreated: "2023-12-05" 
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

export default function UsersManagementPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
      setUsers(mockUsers)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Filter users based on search term, department, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = 
      selectedDepartment === "All Departments" || 
      user.department === selectedDepartment
    
    const matchesStatus = 
      selectedStatus === "all" || 
      user.status === selectedStatus
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

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
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-400">Inactive</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">User Management</h1>
        <p className="text-gray-600">Manage users and permissions in the system</p>
      </motion.div>

      {isLoading ? (
        <SkeletonCard lines={10} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-bisu-yellow-DEFAULT">Users</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light">
                    
                    <RefreshCcw size={16} className="mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" className="text-bisu-yellow-DEFAULT bg-transparent border-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light">
                    <DownloadCloud size={16} className="mr-2" />
                    Export
                  </Button>
                  <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-bisu-yellow-DEFAULT text-bisu-yellow-DEFAULT hover:bg-bisu-yellow-light font-medium">
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
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="name" className="text-right">
                            Name
                          </label>
                          <Input id="name" placeholder="Full Name" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="email" className="text-right">
                            Email
                          </label>
                          <Input id="email" placeholder="email@bisu.edu.ph" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="role" className="text-right">
                            Role
                          </label>
                          <Select>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="department" className="text-right">
                            Department
                          </label>
                          <Select>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.slice(1).map((dept) => (
                                <SelectItem key={dept} value={dept.toLowerCase()}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsAddUserDialogOpen(false)}>
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
                    placeholder="Search users..."
                    className="pl-10 bg-bisu-purple-light text-white placeholder:text-bisu-yellow-DEFAULT/70 border-bisu-yellow-DEFAULT/30"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                        No users found matching the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="transition-colors hover:bg-gray-50">
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{user.dateCreated}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {user.status === "active" ? (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
                                <XCircle size={16} />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500">
                                <CheckCircle size={16} />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500">
                              <Edit size={16} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
} 