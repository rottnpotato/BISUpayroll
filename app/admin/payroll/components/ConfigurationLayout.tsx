"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  TrendingUp, 
  Briefcase, 
  PiggyBank, 
  Receipt, 
  Calendar,
  Settings,
  Save,
  AlertCircle,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { 
  WorkingHoursConfig, 
  RatesConfig, 
  LeaveBenefitsConfig, 
  ContributionsConfig, 
  TaxBracketsConfig 
} from "../types"
import { WorkingHoursCard } from "./WorkingHoursCard"
import { RatesConfigCard } from "./RatesConfigCard"
import { LeaveBenefitsCard } from "./LeaveBenefitsCard"
import { ContributionsConfigCard } from "./ContributionsConfigCard"
import { TaxBracketsConfigCard } from "./TaxBracketsConfigCard"
import { HolidayConfigCard } from "./HolidayConfigCard"
import { TaxConfigSummaryCard } from "./TaxConfigSummaryCard"
import { PayrollRoleTogglesCard } from "./PayrollRoleTogglesCard"

interface ConfigurationLayoutProps {
  workingHoursConfig: WorkingHoursConfig
  ratesConfig: RatesConfig
  leaveBenefitsConfig: LeaveBenefitsConfig
  contributionsConfig: ContributionsConfig
  taxBracketsConfig: TaxBracketsConfig
  setWorkingHoursConfig: (config: WorkingHoursConfig) => void
  setRatesConfig: (config: RatesConfig) => void
  setLeaveBenefitsConfig: (config: LeaveBenefitsConfig) => void
  saveWorkingHoursConfig: any
  saveRatesConfig: any
  saveLeaveBenefitsConfig: any
  fetchExternalData: any
  unsavedChanges: any
  hasUnsavedChanges: boolean
  isAutoSaving: boolean
  saveAllConfigurations: () => Promise<boolean>
}

type ConfigSection = 
  | 'working-hours' 
  | 'rates' 
  | 'leave-benefits' 
  | 'holidays'
  | 'role-toggles'
  | 'summary'

interface MenuItem {
  id: ConfigSection
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  hasUnsavedChanges?: boolean
}

export function ConfigurationLayout(props: ConfigurationLayoutProps) {
  const [activeSection, setActiveSection] = useState<ConfigSection>('working-hours')

  const menuItems: MenuItem[] = [
    {
      id: 'working-hours',
      title: 'Working Hours',
      description: 'Configure daily work schedules and overtime policies',
      icon: Clock,
      hasUnsavedChanges: props.unsavedChanges.workingHours
    },
    {
      id: 'rates',
      title: 'Pay Rates',
      description: 'Set overtime and special rates for payroll calculations',
      icon: TrendingUp,
      hasUnsavedChanges: props.unsavedChanges.rates
    },
    {
      id: 'leave-benefits',
      title: 'Leave Benefits',
      description: 'Manage leave policies and benefit calculations',
      icon: Briefcase,
      hasUnsavedChanges: props.unsavedChanges.leaveBenefits
    },
    {
      id: 'holidays',
      title: 'Holiday Management',
      description: 'Define public holidays and special work days',
      icon: Calendar
    }
  ]

  const renderConfigurationContent = () => {
    switch (activeSection) {
      case 'working-hours':
        return (
          <WorkingHoursCard
            config={props.workingHoursConfig}
            onConfigChange={props.setWorkingHoursConfig}
            onSave={props.saveWorkingHoursConfig}
            hasUnsavedChanges={props.unsavedChanges.workingHours}
          />
        )
      case 'rates':
        return (
          <RatesConfigCard
            config={props.ratesConfig}
            onConfigChange={props.setRatesConfig}
            onSave={props.saveRatesConfig}
            hasUnsavedChanges={props.unsavedChanges.rates}
          />
        )
      case 'leave-benefits':
        return (
          <LeaveBenefitsCard
            config={props.leaveBenefitsConfig}
            onConfigChange={props.setLeaveBenefitsConfig}
            onSave={props.saveLeaveBenefitsConfig}
            hasUnsavedChanges={props.unsavedChanges.leaveBenefits}
          />
        )
      case 'holidays':
        return <HolidayConfigCard />
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Please select a configuration section from the menu.</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-gray-900"><b>Work Days & Employee Contribution</b> Configuration</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your preferences and configure various payroll options.
            </p>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {props.isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                Auto-saving...
              </div>
            )}
            
            {props.hasUnsavedChanges && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </div>
                <Button 
                  onClick={props.saveAllConfigurations}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Menu */}
        <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">SELECT CONFIGURATION</h3>
            
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <motion.div
                    key={item.id}
                    className={`w-full p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => setActiveSection(item.id)}
                      >
                        <div className={`p-2 rounded-lg ${
                          isActive ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isActive ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${
                              isActive ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </span>
                            {item.hasUnsavedChanges && (
                              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="max-w-4xl"
            >
              {renderConfigurationContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}