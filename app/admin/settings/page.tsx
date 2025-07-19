"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SystemSetting {
  id: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

interface SettingsForm {
  companyName: string
  siteTitle: string
  adminEmail: string
  contactNumber: string
  systemAddress: string
  systemActive: boolean
  twoFactorAuth: boolean
  requireUppercase: boolean
  requireSpecial: boolean
  minPasswordLength: string
  sessionTimeout: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [formData, setFormData] = useState<SettingsForm>({
    companyName: "Bohol Island State University",
    siteTitle: "BISU Payroll Management System",
    adminEmail: "admin@bisu.edu.ph",
    contactNumber: "+63 38 123 4567",
    systemAddress: "CPG North Avenue, Tagbilaran City, Bohol",
    systemActive: true,
    twoFactorAuth: false,
    requireUppercase: true,
    requireSpecial: true,
    minPasswordLength: "8",
    sessionTimeout: "30"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      
      const data = await response.json()
      setSettings(data.settings)
      
      // Map settings to form data
      const settingsMap = data.settings.reduce((acc: any, setting: SystemSetting) => {
        acc[setting.key] = setting.value
        return acc
      }, {})
      
      setFormData(prev => ({
        ...prev,
        ...settingsMap,
        systemActive: settingsMap.systemActive === 'true',
        twoFactorAuth: settingsMap.twoFactorAuth === 'true',
        requireUppercase: settingsMap.requireUppercase === 'true',
        requireSpecial: settingsMap.requireSpecial === 'true'
      }))
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (key: keyof SettingsForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      
      const settingsToSave = Object.entries(formData).map(([key, value]) => ({
        key,
        value: String(value)
      }))

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsToSave })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Settings saved successfully')
      await fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-bisu-purple-deep" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">System Settings</h1>
        <p className="text-gray-600">Configure system preferences and parameters</p>
      </div>

      <Card className="shadow-md mb-6">
        <CardHeader className="bg-gradient-to-r from-bisu-yellow-DEFAULT to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input 
                id="companyName" 
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTitle">System Title</Label>
              <Input 
                id="siteTitle" 
                value={formData.siteTitle}
                onChange={(e) => handleInputChange('siteTitle', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input 
                id="adminEmail" 
                type="email" 
                value={formData.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input 
                id="contactNumber" 
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="systemAddress">Address</Label>
            <Input 
              id="systemAddress" 
              value={formData.systemAddress}
              onChange={(e) => handleInputChange('systemAddress', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="systemActive">System Active</Label>
              <div className="text-sm text-gray-500">Temporarily disable access to the system</div>
            </div>
            <Switch 
              id="systemActive" 
              checked={formData.systemActive}
              onCheckedChange={(checked) => handleInputChange('systemActive', checked)}
            />
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md mb-6">
        <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
          <CardTitle className="text-bisu-yellow-DEFAULT">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <div className="text-sm text-gray-500">Require 2FA for admin accounts</div>
              </div>
              <Switch 
                id="twoFactorAuth" 
                checked={formData.twoFactorAuth}
                onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireUppercase">Require Uppercase</Label>
                <div className="text-sm text-gray-500">Require at least one uppercase letter</div>
              </div>
              <Switch 
                id="requireUppercase" 
                checked={formData.requireUppercase}
                onCheckedChange={(checked) => handleInputChange('requireUppercase', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireSpecial">Require Special Characters</Label>
                <div className="text-sm text-gray-500">Require at least one special character</div>
              </div>
              <Switch 
                id="requireSpecial" 
                checked={formData.requireSpecial}
                onCheckedChange={(checked) => handleInputChange('requireSpecial', checked)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                <Input 
                  id="minPasswordLength" 
                  type="number"
                  min="6"
                  max="20"
                  value={formData.minPasswordLength}
                  onChange={(e) => handleInputChange('minPasswordLength', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input 
                  id="sessionTimeout" 
                  type="number"
                  min="5"
                  max="120"
                  value={formData.sessionTimeout}
                  onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 