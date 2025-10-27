"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, DollarSign, Percent } from "lucide-react"
import { PayrollRule } from "../types"

interface PayrollRulesTableProps {
  rules: PayrollRule[]
  onEdit: (rule: PayrollRule) => void
  onDelete: (id: string) => Promise<boolean>
  onToggleStatus: (rule: PayrollRule) => Promise<boolean>
  onAdd: () => void
}

export function PayrollRulesTable({ 
  rules, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onAdd 
}: PayrollRulesTableProps) {
  const [activeTab, setActiveTab] = useState("all")

  const filteredRules = rules.filter(rule => {
    if (activeTab === "all") return true
    return rule.type === activeTab
  })

  const formatAmount = (amount: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${amount}%`
    } else {
      return `₱${amount.toLocaleString()}`
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "daily_rate": return "bg-blue-100 text-blue-800"
      case "additional": return "bg-green-100 text-green-800"
      case "deduction": return "bg-red-100 text-red-800"
      case "tax": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
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

  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="text-bisu-yellow text-xl">Payroll Calculations</CardTitle>
              <CardDescription className="text-bisu-yellow-light">
                Manage salary calculation items and deductions
              </CardDescription>
            </div>
            <Button 
              onClick={onAdd}
              className="bg-bisu-yellow text-bisu-purple-deep hover:bg-bisu-yellow-light hover:text-bisu-purple-medium border-2 border-bisu-yellow-light shadow-md"
            >
              <Plus size={16} className="mr-2" />
              Add Calculation
            </Button>
          </div>
          
          <Tabs defaultValue="all" className="mt-6" onValueChange={setActiveTab}>
            <TabsList className="bg-bisu-purple-light border-bisu-yellow/30 text-bisu-yellow-light grid grid-cols-2 lg:grid-cols-5 w-full lg:w-auto">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
              >
                All Calculations
              </TabsTrigger>
              <TabsTrigger 
                value="daily_rate" 
                className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
              >
                Daily Rate
              </TabsTrigger>
              <TabsTrigger 
                value="additional" 
                className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
              >
                Additions
              </TabsTrigger>
              <TabsTrigger 
                value="deduction" 
                className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
              >
                Deductions
              </TabsTrigger>
              <TabsTrigger 
                value="tax" 
                className="data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep"
              >
                Tax & Benefits
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Calculation Name</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No calculations found for this category. Create your first item to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{rule.name}</span>
                          {rule.createdByRole === 'EMPLOYEE' && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Employee Added
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(rule.type)} capitalize`}>
                          {rule.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-1">
                          {rule.isPercentage ? <Percent size={14} /> : ""}
                          {formatAmount(rule.amount, rule.isPercentage)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {rule.category?.replace('_', ' ') || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={rule.description || ""}>
                          {rule.description || "No description provided"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={rule.isActive} 
                          onCheckedChange={() => onToggleStatus(rule)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(rule)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(rule.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
