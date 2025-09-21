"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  Save, 
  RefreshCw, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  Briefcase,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"
import { PayrollRole, PayrollRoleFormData } from "../types"

interface PayrollRoleTogglesCardProps {
  onSave?: () => Promise<void>
  hasUnsavedChanges?: boolean
}

const departments = [
  "Information Technology",
  "Human Resources", 
  "Accounting",
  "Faculty",
  "Maintenance",
  "Administration"
]

const positionsByDepartment = {
  "Information Technology": ["System Administrator", "Network Specialist", "Software Developer", "Database Administrator", "IT Support"],
  "Human Resources": ["HR Manager", "HR Specialist", "Recruitment Officer", "Training Coordinator", "Employee Relations"],
  "Accounting": ["Accountant", "Senior Accountant", "Bookkeeper", "Payroll Specialist", "Financial Analyst"],
  "Faculty": ["Professor", "Associate Professor", "Assistant Professor", "Instructor", "Research Associate"],
  "Maintenance": ["Facilities Manager", "Maintenance Technician", "Custodian", "Groundskeeper", "Electrician"],
  "Administration": ["Office Manager", "Administrative Assistant", "Records Officer", "Executive Secretary", "Office Coordinator"]
}

export function PayrollRoleTogglesCard({ onSave, hasUnsavedChanges = false }: PayrollRoleTogglesCardProps) {
  const [payrollRoles, setPayrollRoles] = useState<PayrollRole[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<PayrollRole | null>(null)
  const [formData, setFormData] = useState<PayrollRoleFormData>({
    name: "",
    description: "",
    department: "",
    position: "",
    baseSalary: "",
  overtimeEligible: true,
    holidayPayEligible: true,
    gsisEligible: true,
    philHealthEligible: true,
    pagibigEligible: true,
    withholdingTaxEligible: true,
    thirteenthMonthEligible: true,
    leaveEligible: true
  })

  const fetchPayrollRoles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/payroll/roles?includeUsers=true')
      const data = await response.json()
      
      if (response.ok) {
        setPayrollRoles(data.payrollRoles)
      } else {
        toast.error(data.error || 'Failed to fetch payroll roles')
      }
    } catch (error) {
      console.error('Error fetching payroll roles:', error)
      toast.error('Failed to fetch payroll roles')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrollRoles()
  }, [])

  const filteredRoles = payrollRoles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.position?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || role.department === selectedDepartment
    const matchesActive = showInactive || role.isActive
    
    return matchesSearch && matchesDepartment && matchesActive
  })

  const handleToggleRole = async (roleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payroll/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        await fetchPayrollRoles()
        toast.success(`Role ${isActive ? 'enabled' : 'disabled'} successfully`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    }
  }

  const handleToggleEligibility = async (roleId: string, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/admin/payroll/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        await fetchPayrollRoles()
        toast.success('Eligibility updated successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update eligibility')
      }
    } catch (error) {
      console.error('Error updating eligibility:', error)
      toast.error('Failed to update eligibility')
    }
  }

  const handleSaveRole = async () => {
    try {
      setIsLoading(true)
      const url = editingRole ? `/api/admin/payroll/roles/${editingRole.id}` : '/api/admin/payroll/roles'
      const method = editingRole ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchPayrollRoles()
        setIsDialogOpen(false)
        setEditingRole(null)
        resetForm()
        toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`)
      } else {
        const data = await response.json()
        toast.error(data.error || `Failed to ${editingRole ? 'update' : 'create'} role`)
      }
    } catch (error) {
      console.error('Error saving role:', error)
      toast.error('Failed to save role')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRole = (role: PayrollRole) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
      department: role.department || "",
      position: role.position || "",
      baseSalary: role.baseSalary?.toString() || "",
      overtimeEligible: role.overtimeEligible,
      holidayPayEligible: role.holidayPayEligible,
      gsisEligible: role.gsisEligible,
      philHealthEligible: role.philHealthEligible,
      pagibigEligible: role.pagibigEligible,
      withholdingTaxEligible: role.withholdingTaxEligible,
      thirteenthMonthEligible: role.thirteenthMonthEligible,
      leaveEligible: role.leaveEligible
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      department: "",
      position: "",
      baseSalary: "",
  overtimeEligible: true,
      holidayPayEligible: true,
      gsisEligible: true,
      philHealthEligible: true,
      pagibigEligible: true,
      withholdingTaxEligible: true,
      thirteenthMonthEligible: true,
      leaveEligible: true
    })
  }

  const getRoleStatusColor = (role: PayrollRole) => {
    if (!role.isActive) return "bg-gray-100 text-gray-800"
    const userCount = role.userRoles?.length || 0
    if (userCount === 0) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getRoleStatusText = (role: PayrollRole) => {
    if (!role.isActive) return "Inactive"
    const userCount = role.userRoles?.length || 0
    if (userCount === 0) return "No Users"
    return `${userCount} User${userCount !== 1 ? 's' : ''}`
  }

  return (
    <div className="h-full">
      <Card className="shadow-lg border-2 h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users size={20} />
                Payroll Role Toggles
              </CardTitle>
              <CardDescription className="text-indigo-100">
                Manage role-based payroll configurations and eligibility settings
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Unsaved
                </Badge>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      setEditingRole(null)
                      resetForm()
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRole ? 'Edit Payroll Role' : 'Create Payroll Role'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Role Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g., Senior Developer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="baseSalary">Base Salary (₱)</Label>
                        <Input
                          id="baseSalary"
                          type="number"
                          value={formData.baseSalary}
                          onChange={(e) => setFormData({...formData, baseSalary: e.target.value})}
                          placeholder="45000"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Select 
                          value={formData.department} 
                          onValueChange={(value) => setFormData({...formData, department: value, position: ""})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="position">Position</Label>
                        <Select 
                          value={formData.position} 
                          onValueChange={(value) => setFormData({...formData, position: value})}
                          disabled={!formData.department}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.department && positionsByDepartment[formData.department as keyof typeof positionsByDepartment]?.map(pos => (
                              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Role description and responsibilities"
                        rows={3}
                      />
                    </div>

                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-sm mb-3">Payroll Rule Eligibility</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="overtimeEligible" className="text-sm">Overtime Pay</Label>
                            <Switch 
                              id="overtimeEligible"
                              checked={formData.overtimeEligible}
                              onCheckedChange={(checked) => setFormData({...formData, overtimeEligible: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                              {/* Night differential removed */}
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="holidayPayEligible" className="text-sm">Holiday Pay</Label>
                            <Switch 
                              id="holidayPayEligible"
                              checked={formData.holidayPayEligible}
                              onCheckedChange={(checked) => setFormData({...formData, holidayPayEligible: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="thirteenthMonthEligible" className="text-sm">13th Month Pay</Label>
                            <Switch 
                              id="thirteenthMonthEligible"
                              checked={formData.thirteenthMonthEligible}
                              onCheckedChange={(checked) => setFormData({...formData, thirteenthMonthEligible: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="leaveEligible" className="text-sm">Leave Benefits</Label>
                            <Switch 
                              id="leaveEligible"
                              checked={formData.leaveEligible}
                              onCheckedChange={(checked) => setFormData({...formData, leaveEligible: checked})}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="gsisEligible" className="text-sm">GSIS</Label>
                            <Switch 
                              id="gsisEligible"
                              checked={formData.gsisEligible}
                              onCheckedChange={(checked) => setFormData({...formData, gsisEligible: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="philHealthEligible" className="text-sm">PhilHealth</Label>
                            <Switch 
                              id="philHealthEligible"
                              checked={formData.philHealthEligible}
                              onCheckedChange={(checked) => setFormData({...formData, philHealthEligible: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="pagibigEligible" className="text-sm">Pag-IBIG</Label>
                            <Switch 
                              id="pagibigEligible"
                              checked={formData.pagibigEligible}
                              onCheckedChange={(checked) => setFormData({...formData, pagibigEligible: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="withholdingTaxEligible" className="text-sm">Withholding Tax</Label>
                            <Switch 
                              id="withholdingTaxEligible"
                              checked={formData.withholdingTaxEligible}
                              onCheckedChange={(checked) => setFormData({...formData, withholdingTaxEligible: checked})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveRole} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingRole ? 'Update' : 'Create'} Role
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4 flex-1">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className="flex items-center gap-2"
            >
              {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPayrollRoles}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Separator />

          {/* Roles List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading roles...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No roles found</p>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <Card key={role.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{role.name}</h4>
                        <Badge className={getRoleStatusColor(role)}>
                          {getRoleStatusText(role)}
                        </Badge>
                        <Switch
                          checked={role.isActive}
                          onCheckedChange={(checked) => handleToggleRole(role.id, checked)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {role.department && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {role.department}
                          </div>
                        )}
                        {role.position && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {role.position}
                          </div>
                        )}
                        {role.baseSalary && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ₱{role.baseSalary.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {role.description && (
                        <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                      )}

                      {/* Eligibility toggles in compact grid */}
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={role.overtimeEligible}
                            onCheckedChange={(checked) => handleToggleEligibility(role.id, 'overtimeEligible', checked)}
                            disabled={!role.isActive}
                          />
                          <span className={!role.isActive ? 'text-gray-400' : ''}>OT</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Night differential removed */}
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={role.holidayPayEligible}
                            onCheckedChange={(checked) => handleToggleEligibility(role.id, 'holidayPayEligible', checked)}
                            disabled={!role.isActive}
                          />
                          <span className={!role.isActive ? 'text-gray-400' : ''}>Holiday</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={role.gsisEligible}
                            onCheckedChange={(checked) => handleToggleEligibility(role.id, 'gsisEligible', checked)}
                            disabled={!role.isActive}
                          />
                          <span className={!role.isActive ? 'text-gray-400' : ''}>GSIS</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={role.thirteenthMonthEligible}
                            onCheckedChange={(checked) => handleToggleEligibility(role.id, 'thirteenthMonthEligible', checked)}
                            disabled={!role.isActive}
                          />
                          <span className={!role.isActive ? 'text-gray-400' : ''}>13th</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Save button */}
          {onSave && (
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={onSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}