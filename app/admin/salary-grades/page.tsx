"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SalaryGrade {
  id: string
  grade: number
  position: string
  rank: number
  monthlyRate: number
  dailyRate: number
  description: string | null
  isActive: boolean
  effectiveDate: string
}

interface FormData {
  grade: string
  position: string
  rank: string
  monthlyRate: string
  dailyRate: string
  description: string
  isActive: boolean
}

export default function SalaryGradesPage() {
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<SalaryGrade | null>(null)
  const [formData, setFormData] = useState<FormData>({
    grade: "",
    position: "",
    rank: "",
    monthlyRate: "",
    dailyRate: "",
    description: "",
    isActive: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSalaryGrades()
  }, [])

  const fetchSalaryGrades = async () => {
    try {
      const response = await fetch("/api/admin/salary-grades")
      if (!response.ok) throw new Error("Failed to fetch salary grades")
      const data = await response.json()
      setSalaryGrades(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load salary grades"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (grade?: SalaryGrade) => {
    if (grade) {
      setEditingGrade(grade)
      setFormData({
        grade: grade.grade.toString(),
        position: grade.position,
        rank: grade.rank.toString(),
        monthlyRate: grade.monthlyRate.toString(),
        dailyRate: grade.dailyRate.toString(),
        description: grade.description || "",
        isActive: grade.isActive
      })
    } else {
      setEditingGrade(null)
      setFormData({
        grade: "",
        position: "",
        rank: "",
        monthlyRate: "",
        dailyRate: "",
        description: "",
        isActive: true
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingGrade(null)
  }

  const calculateDailyRate = (monthly: string) => {
    const monthlyRate = parseFloat(monthly)
    if (!isNaN(monthlyRate)) {
      const daily = (monthlyRate / 22).toFixed(2)
      setFormData(prev => ({ ...prev, dailyRate: daily }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingGrade
      ? `/api/admin/salary-grades/${editingGrade.id}`
      : "/api/admin/salary-grades"
    
    const method = editingGrade ? "PATCH" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save salary grade")
      }

      toast({
        title: "Success",
        description: `Salary grade ${editingGrade ? "updated" : "created"} successfully`
      })

      handleCloseDialog()
      fetchSalaryGrades()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`Are you sure you want to delete ${description}?`)) return

    try {
      const response = await fetch(`/api/admin/salary-grades/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete salary grade")
      }

      toast({
        title: "Success",
        description: "Salary grade deleted successfully"
      })

      fetchSalaryGrades()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  const positions = ["Instructor", "Assistant Professor", "Associate Professor", "Professor"]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Salary Grade Management</h1>
          <p className="text-muted-foreground">Manage salary grades for academic personnel</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Salary Grade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Grades</CardTitle>
          <CardDescription>
            View and manage all salary grades. Changes will affect future employee assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Monthly Rate</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">SG {grade.grade}</TableCell>
                    <TableCell>{grade.position} {grade.rank}</TableCell>
                    <TableCell>{grade.rank}</TableCell>
                    <TableCell>₱{grade.monthlyRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>₱{grade.dailyRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant={grade.isActive ? "default" : "secondary"}>
                        {grade.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(grade)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(grade.id, grade.description || `SG ${grade.grade}`)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGrade ? "Edit" : "Add"} Salary Grade</DialogTitle>
            <DialogDescription>
              {editingGrade ? "Update" : "Create"} salary grade information for academic personnel
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Salary Grade *</Label>
                  <Input
                    id="grade"
                    type="number"
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rank">Rank *</Label>
                  <Input
                    id="rank"
                    type="number"
                    required
                    value={formData.rank}
                    onChange={(e) => setFormData(prev => ({ ...prev, rank: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyRate">Monthly Rate *</Label>
                <Input
                  id="monthlyRate"
                  type="number"
                  step="0.01"
                  required
                  value={formData.monthlyRate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, monthlyRate: e.target.value }))
                    calculateDailyRate(e.target.value)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate *</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  required
                  value={formData.dailyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyRate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Calculated as: Monthly Rate ÷ 22 working days</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Professor 1 - Salary Grade 24"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingGrade ? "Update" : "Create"} Salary Grade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
