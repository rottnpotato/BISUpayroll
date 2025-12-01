"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Save, AlertCircle } from "lucide-react"
import { ConfigurationLayout, UnsavedChangesDialog } from '../components'
import { usePayrollConfig } from '../hooks/usePayrollConfig'
import { useState } from "react"

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
} as const

export default function PayrollConfigurationPage() {
  const {
    workingHoursConfig,
    ratesConfig,
    leaveBenefitsConfig,
    contributionsConfig,
    taxBracketsConfig,
    setWorkingHoursConfig,
    setRatesConfig,
    setLeaveBenefitsConfig,
    loadConfigurations,
    saveAllConfigurations,
    saveWorkingHoursConfig,
    saveRatesConfig,
    saveLeaveBenefitsConfig,
    fetchExternalData,
    unsavedChanges,
    hasUnsavedChanges,
    isAutoSaving
  } = usePayrollConfig()

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  const handleSaveAll = async () => {
    return await saveAllConfigurations()
  }

  const getChangedSections = () => {
    const sections = []
    if (unsavedChanges.workingHours) sections.push('workingHours')
    if (unsavedChanges.rates) sections.push('rates')
    if (unsavedChanges.leaveBenefits) sections.push('leaveBenefits')
    return sections
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal tracking-tight text-bisu-purple-deep">
             <b>Browse All </b> Payroll Configuration
            </h1>
            <p className="text-muted-foreground">
              Configure working hours, rates, benefits, and tax settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-bisu-purple-medium">
                <div className="animate-spin h-4 w-4 border-2 border-bisu-purple-medium border-t-transparent rounded-full" />
                Auto-saving...
              </div>
            )}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes ({getChangedSections().length} section{getChangedSections().length !== 1 ? 's' : ''})
                </div>
                <Button 
                  onClick={handleSaveAll}
                  size="sm"
                  className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <ConfigurationLayout
          workingHoursConfig={workingHoursConfig}
          ratesConfig={ratesConfig}
          leaveBenefitsConfig={leaveBenefitsConfig}
          contributionsConfig={contributionsConfig}
          taxBracketsConfig={taxBracketsConfig}
          setWorkingHoursConfig={setWorkingHoursConfig}
          setRatesConfig={setRatesConfig}
          setLeaveBenefitsConfig={setLeaveBenefitsConfig}
          saveWorkingHoursConfig={saveWorkingHoursConfig}
          saveRatesConfig={saveRatesConfig}
          saveLeaveBenefitsConfig={saveLeaveBenefitsConfig}
          fetchExternalData={fetchExternalData}
          unsavedChanges={unsavedChanges}
          hasUnsavedChanges={hasUnsavedChanges}
          isAutoSaving={isAutoSaving}
          saveAllConfigurations={saveAllConfigurations}
        />
      </motion.div>

      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onSave={saveAllConfigurations}
        onDiscard={() => {
          loadConfigurations()
        }}
        changedSections={getChangedSections()}
      />

      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button 
              onClick={handleSaveAll}
              size="lg"
              className="bg-bisu-purple-deep text-white hover:bg-bisu-purple-medium shadow-2xl border-2 border-white rounded-full px-6 py-4 min-w-[200px]"
            >
              <Save className="h-5 w-5 mr-2" />
              Save All Changes
              <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                {getChangedSections().length}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
