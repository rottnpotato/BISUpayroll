"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calculator, FileText, DollarSign, Clock, Calendar, Save } from "lucide-react"

import { RatesConfig, LeaveBenefitsConfig } from "../types"
import { taxBrackets } from "../constants"

interface TaxConfigSummaryCardProps {
  ratesConfig: RatesConfig
  leaveBenefitsConfig: LeaveBenefitsConfig
  onSave?: () => Promise<void>
}

export function TaxConfigSummaryCard({ 
  ratesConfig, 
  leaveBenefitsConfig,
  onSave 
}: TaxConfigSummaryCardProps) {
  return (
    <div className="w-full">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator size={20} />
                Tax Configuration & Summary
              </CardTitle>
              <CardDescription className="text-red-100">
                Philippines government tax brackets and contribution summary
              </CardDescription>
            </div>
            <Button className="bg-white text-red-700 hover:bg-red-50">
              <Calculator size={16} className="mr-2" />
              View Tax Calculator
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Tax Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={16} />
                Tax Configuration
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useWithholding" className="text-sm">Withholding Tax</Label>
                  <Switch id="useWithholding" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showBreakdown" className="text-sm">Show Breakdown</Label>
                  <Switch id="showBreakdown" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoCompute" className="text-sm">Auto Compute</Label>
                  <Switch id="autoCompute" defaultChecked />
                </div>
              </div>
            </div>

            {/* Mandatory Contributions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign size={16} />
                Mandatory Contributions
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GSIS:</span>
                  <span className="font-mono">9%</span>
                </div>
                <div className="flex justify-between">
                  <span>PhilHealth:</span>
                  <span className="font-mono">2.75%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pag-IBIG:</span>
                  <span className="font-mono">2%</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total:</span>
                  <span className="font-mono">13.75%</span>
                </div>
              </div>
            </div>

            {/* Overtime & Differentials */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={16} />
                Rates & Differentials
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Overtime (2h):</span>
                  <span className="font-mono">{ratesConfig.overtimeRate1}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime ({'>'}2h):</span>
                  <span className="font-mono">{ratesConfig.overtimeRate2}x</span>
                </div>
                {/* Night differential removed */}
                <div className="flex justify-between">
                  <span>Holiday (Reg):</span>
                  <span className="font-mono">{ratesConfig.regularHolidayRate}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Holiday (Spl):</span>
                  <span className="font-mono">{ratesConfig.specialHolidayRate}x</span>
                </div>
              </div>
            </div>

            {/* Leave Benefits */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={16} />
                Leave Benefits
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Vacation:</span>
                  <span className="font-mono">{leaveBenefitsConfig.vacationLeave} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Sick:</span>
                  <span className="font-mono">{leaveBenefitsConfig.sickLeave} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Incentive:</span>
                  <span className="font-mono">{leaveBenefitsConfig.serviceIncentiveLeave} days</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total:</span>
                  <span className="font-mono">
                    {leaveBenefitsConfig.vacationLeave + leaveBenefitsConfig.sickLeave + leaveBenefitsConfig.serviceIncentiveLeave} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-wrap gap-4">
              {onSave && (
                <Button 
                  className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium"
                  onClick={onSave}
                >
                  <Save size={16} className="mr-2" />
                  Save All Configurations
                </Button>
              )}
              <Button variant="outline" className="border-bisu-purple-deep text-bisu-purple-deep hover:bg-bisu-yellow-light">
                <FileText size={16} className="mr-2" />
                Export Configuration
              </Button>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Calculator size={16} className="mr-2" />
                Test Payroll Calculation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
