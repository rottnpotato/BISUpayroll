"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  Minus,
  Plus,
  Info,
  Calculator,
  TrendingUp,
  TrendingDown,
  Percent
} from "lucide-react"
import { motion } from "framer-motion"

interface PayrollRule {
  id: string
  name: string
  type: string
  amount: number
  isPercentage: boolean
  description: string | null
  calculatedAmount: number
}

interface DeductionDetail {
  name: string
  amount: number
  isPercentage?: boolean
  percentage?: number | null
  description?: string
}

interface DeductionBreakdown {
  government: {
    total: number
    details: DeductionDetail[]
  }
  loans: {
    total: number
    details: DeductionDetail[]
  }
  other: {
    total: number
    details: DeductionDetail[]
  }
}

interface PayrollRulesBreakdownProps {
  appliedRules: PayrollRule[]
  deductionBreakdown: DeductionBreakdown
  calculations: {
    dailyRate: number
    hourlyRate: number
    basePay: number
    overtimePay: number
    bonuses: number
    grossPay: number
    totalDeductions: number
    netPay: number
  }
}

export function PayrollRulesBreakdown({ 
  appliedRules, 
  deductionBreakdown, 
  calculations 
}: PayrollRulesBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  // Separate rules by type
  const earningsRules = appliedRules.filter(rule => 
    ['base', 'additional', 'bonus', 'allowance'].includes(rule.type)
  )
  
  const deductionRules = appliedRules.filter(rule => 
    rule.type === 'deduction'
  )

  // Calculate total earnings from rules
  const totalEarningsFromRules = earningsRules.reduce((sum, rule) => 
    sum + rule.calculatedAmount, 0
  )

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
            <Calculator className="h-5 w-5" />
            Payroll Rules Applied to Your Account
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed breakdown of all earnings and deductions based on your employment terms
          </p>
        </CardHeader>
        <CardContent>
          {/* Rate Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center justify-between rounded-lg border border-bisu-purple-light bg-bisu-purple-extralight px-4 py-3">
              <span className="text-sm text-muted-foreground">Rate per Day</span>
              <span className="font-semibold text-bisu-purple-deep">
                {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(calculations.dailyRate)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-bisu-purple-light bg-bisu-purple-extralight px-4 py-3">
              <span className="text-sm text-muted-foreground">Rate per Hour</span>
              <span className="font-semibold text-bisu-purple-deep">
                {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(calculations.hourlyRate)}
              </span>
            </div>
          </div>

          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Earnings Summary */}
                <Card className="border-bisu-purple-light bg-bisu-purple-extralight">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-bisu-purple-deep">
                      <TrendingUp className="h-5 w-5" />
                      Total Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Base Pay:</span>
                      <span className="font-medium">{formatCurrency(calculations.basePay)}</span>
                    </div>
                    {calculations.overtimePay > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Overtime Pay:</span>
                        <span className="font-medium text-bisu-purple-deep">{formatCurrency(calculations.overtimePay)}</span>
                      </div>
                    )}
                    {calculations.bonuses > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Bonuses & Allowances:</span>
                        <span className="font-medium text-bisu-purple-deep">{formatCurrency(calculations.bonuses)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Gross Pay:</span>
                      <span className="text-bisu-purple-deep">{formatCurrency(calculations.grossPay)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Deductions Summary */}
                <Card className="border-bisu-purple-light bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-bisu-purple-deep">
                      <TrendingDown className="h-5 w-5" />
                      Total Deductions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deductionBreakdown.government.total > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Government Contributions:</span>
                        <span className="font-medium">{formatCurrency(deductionBreakdown.government.total)}</span>
                      </div>
                    )}
                    {deductionBreakdown.loans.total > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Loan Deductions:</span>
                        <span className="font-medium">{formatCurrency(deductionBreakdown.loans.total)}</span>
                      </div>
                    )}
                    {deductionBreakdown.other.total > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Other Deductions:</span>
                        <span className="font-medium">{formatCurrency(deductionBreakdown.other.total)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Deductions:</span>
                      <span className="text-bisu-purple-deep">{formatCurrency(calculations.totalDeductions)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Net Pay */}
              <Card className="border-bisu-purple-deep bg-gradient-to-r from-bisu-purple-deep/10 to-blue-500/10">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-lg font-medium text-muted-foreground mb-2">Your Net Pay</p>
                    <p className="text-4xl font-bold text-bisu-purple-deep">{formatCurrency(calculations.netPay)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Gross Pay - Total Deductions = Net Pay
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                    <Plus className="h-5 w-5" />
                    Earnings Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {earningsRules.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No specific earning rules found. Your earnings are calculated based on basic salary and attendance.
                    </p>
                  ) : (
                    earningsRules.map((rule, index) => (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-bisu-purple-light bg-bisu-purple-extralight"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{rule.name}</h4>
                            {rule.type === 'base' && (
                              <Badge variant="outline" className="text-xs">Base</Badge>
                            )}
                            {rule.type === 'additional' && (
                              <Badge variant="outline" className="text-xs bg-bisu-purple-extralight">Additional</Badge>
                            )}
                            {rule.type === 'bonus' && (
                              <Badge variant="outline" className="text-xs bg-bisu-purple-extralight">Bonus</Badge>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {rule.isPercentage ? (
                              <span className="flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                {rule.amount}% of base pay
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Fixed amount
                              </span>
                            )}
                            {rule.type === 'base' && (
                              <span className="ml-2 rounded-full bg-white border border-bisu-purple-light px-2 py-0.5 font-medium text-bisu-purple-deep">
                                Rate/Day: {formatCurrency(calculations.dailyRate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-bisu-purple-deep">{formatCurrency(rule.calculatedAmount)}</p>
                          {rule.isPercentage && (
                            <p className="text-xs text-muted-foreground">
                              {rule.amount}% rate
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deductions" className="space-y-4">
              {/* Government Contributions */}
              {deductionBreakdown.government.details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                      <Minus className="h-5 w-5" />
                      Government Contributions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Mandatory government contributions and taxes
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deductionBreakdown.government.details.map((deduction, index) => (
                      <motion.div
                        key={`govt-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-bisu-purple-light bg-bisu-purple-extralight"
                      >
                        <div>
                          <h4 className="font-medium">{deduction.name}</h4>
                          {deduction.isPercentage && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {deduction.percentage}% of gross pay
                            </p>
                          )}
                        </div>
                        <p className="font-bold text-bisu-purple-deep">{formatCurrency(deduction.amount)}</p>
                      </motion.div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Government Deductions:</span>
                      <span className="text-bisu-purple-deep">{formatCurrency(deductionBreakdown.government.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loan Deductions */}
              {deductionBreakdown.loans.details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                      <Minus className="h-5 w-5" />
                      Loan Deductions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deductionBreakdown.loans.details.map((deduction, index) => (
                      <motion.div
                        key={`loan-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-bisu-purple-light bg-bisu-purple-extralight"
                      >
                        <div>
                          <h4 className="font-medium">{deduction.name}</h4>
                          {deduction.description && (
                            <p className="text-sm text-muted-foreground mt-1">{deduction.description}</p>
                          )}
                        </div>
                        <p className="font-bold text-bisu-purple-deep">{formatCurrency(deduction.amount)}</p>
                      </motion.div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Loan Deductions:</span>
                      <span className="text-bisu-purple-deep">{formatCurrency(deductionBreakdown.loans.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Other Deductions */}
              {deductionBreakdown.other.details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                      <Minus className="h-5 w-5" />
                      Other Deductions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deductionBreakdown.other.details.map((deduction, index) => (
                      <motion.div
                        key={`other-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-bisu-purple-light bg-bisu-purple-extralight"
                      >
                        <div>
                          <h4 className="font-medium">{deduction.name}</h4>
                          {deduction.description && (
                            <p className="text-sm text-muted-foreground mt-1">{deduction.description}</p>
                          )}
                        </div>
                        <p className="font-bold text-bisu-purple-deep">{formatCurrency(deduction.amount)}</p>
                      </motion.div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Other Deductions:</span>
                      <span className="text-bisu-purple-deep">{formatCurrency(deductionBreakdown.other.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Deductions */}
              {deductionRules.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
                      <Info className="h-5 w-5" />
                      All Applicable Deduction Rules
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete list of deduction rules that apply to your account
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deductionRules.map((rule, index) => (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-bisu-purple-light bg-bisu-purple-extralight"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{rule.name}</h4>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {rule.isPercentage ? (
                              <span className="flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                {rule.amount}% of gross pay
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Fixed amount
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-bisu-purple-deep">{formatCurrency(rule.calculatedAmount)}</p>
                          {rule.isPercentage && (
                            <p className="text-xs text-muted-foreground">
                              {rule.amount}% rate
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}