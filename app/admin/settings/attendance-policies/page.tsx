"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  Settings, 
  Calendar,
  AlertCircle,
  Save,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface AttendancePolicySettings {
  attendance_morning_start: string
  attendance_morning_end: string
  attendance_afternoon_start: string
  attendance_afternoon_end: string
  attendance_allow_half_day: boolean
  attendance_allow_early_out: boolean
  attendance_early_out_threshold_minutes: number
  attendance_half_day_minimum_hours: number
  attendance_prevent_duplicate_entries: boolean
  attendance_duplicate_range_hours: number
}

export default function AttendancePoliciesPage() {
  const [settings, setSettings] = useState<AttendancePolicySettings>({
    attendance_morning_start: '08:00',
    attendance_morning_end: '12:00',
    attendance_afternoon_start: '13:00',
    attendance_afternoon_end: '17:00',
    attendance_allow_half_day: true,
    attendance_allow_early_out: false,
    attendance_early_out_threshold_minutes: 60,
    attendance_half_day_minimum_hours: 4,
    attendance_prevent_duplicate_entries: true,
    attendance_duplicate_range_hours: 2
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/settings/attendance-policies')
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance policy settings')
      }
      
      const data = await response.json()
      
      // Convert the settings array to an object
      const settingsObject = data.settings.reduce((acc: any, setting: any) => {
        if (setting.key.includes('allow_half_day') || 
            setting.key.includes('allow_early_out') || 
            setting.key.includes('prevent_duplicate_entries')) {
          acc[setting.key] = setting.value === 'true'
        } else if (setting.key.includes('threshold_minutes') || 
                   setting.key.includes('minimum_hours') || 
                   setting.key.includes('range_hours')) {
          acc[setting.key] = parseFloat(setting.value)
        } else {
          acc[setting.key] = setting.value
        }
        return acc
      }, {})

      setSettings(prev => ({ ...prev, ...settingsObject }))
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load attendance policy settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      
      const response = await fetch('/api/admin/settings/attendance-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save attendance policy settings')
      }

      toast.success('Attendance policy settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save attendance policy settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (key: keyof AttendancePolicySettings, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bisu-purple-deep"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-bisu-purple-deep mb-2">Attendance Policy Settings</h1>
        <p className="text-gray-600">Configure attendance rules, time windows, and policy enforcement</p>
      </div>

      <div className="space-y-6">
        {/* Working Hours Configuration */}
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-bisu-yellow to-bisu-yellow-light text-bisu-purple-deep rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Working Hours & Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Morning Session */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-bisu-purple-deep">Morning Session</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="morning_start">Start Time</Label>
                    <Input
                      id="morning_start"
                      type="time"
                      value={settings.attendance_morning_start}
                      onChange={(e) => handleInputChange('attendance_morning_start', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="morning_end">End Time</Label>
                    <Input
                      id="morning_end"
                      type="time"
                      value={settings.attendance_morning_end}
                      onChange={(e) => handleInputChange('attendance_morning_end', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Afternoon Session */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-bisu-purple-deep">Afternoon Session</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="afternoon_start">Start Time</Label>
                    <Input
                      id="afternoon_start"
                      type="time"
                      value={settings.attendance_afternoon_start}
                      onChange={(e) => handleInputChange('attendance_afternoon_start', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="afternoon_end">End Time</Label>
                    <Input
                      id="afternoon_end"
                      type="time"
                      value={settings.attendance_afternoon_end}
                      onChange={(e) => handleInputChange('attendance_afternoon_end', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Policies */}
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-bisu-purple-deep to-bisu-purple-medium text-white rounded-t-lg">
            <CardTitle className="text-bisu-yellow flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Attendance Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Half-Day Policy */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Allow Half-Day Attendance</Label>
                  <p className="text-sm text-gray-600">
                    Permit employees to work only morning or afternoon sessions
                  </p>
                </div>
                <Switch
                  checked={settings.attendance_allow_half_day}
                  onCheckedChange={(checked) => handleInputChange('attendance_allow_half_day', checked)}
                />
              </div>

              {settings.attendance_allow_half_day && (
                <div className="pl-4 border-l-2 border-bisu-yellow-light">
                  <div className="space-y-2">
                    <Label htmlFor="half_day_hours">Minimum Hours for Half-Day</Label>
                    <Input
                      id="half_day_hours"
                      type="number"
                      min="1"
                      max="8"
                      step="0.5"
                      value={settings.attendance_half_day_minimum_hours}
                      onChange={(e) => handleInputChange('attendance_half_day_minimum_hours', parseFloat(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500">Hours required to qualify as half-day attendance</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Early Out Policy */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Allow Early Timeout</Label>
                  <p className="text-sm text-gray-600">
                    Allow employees to time out before their scheduled end time
                  </p>
                </div>
                <Switch
                  checked={settings.attendance_allow_early_out}
                  onCheckedChange={(checked) => handleInputChange('attendance_allow_early_out', checked)}
                />
              </div>

              {settings.attendance_allow_early_out && (
                <div className="pl-4 border-l-2 border-bisu-yellow-light">
                  <div className="space-y-2">
                    <Label htmlFor="early_out_threshold">Early Out Threshold (Minutes)</Label>
                    <Input
                      id="early_out_threshold"
                      type="number"
                      min="15"
                      max="240"
                      step="15"
                      value={settings.attendance_early_out_threshold_minutes}
                      onChange={(e) => handleInputChange('attendance_early_out_threshold_minutes', parseInt(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500">Minutes before end time to trigger early out warning</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Duplicate Entry Prevention */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Prevent Duplicate Entries</Label>
                  <p className="text-sm text-gray-600">
                    Block multiple attendance entries within a specified time range
                  </p>
                </div>
                <Switch
                  checked={settings.attendance_prevent_duplicate_entries}
                  onCheckedChange={(checked) => handleInputChange('attendance_prevent_duplicate_entries', checked)}
                />
              </div>

              {settings.attendance_prevent_duplicate_entries && (
                <div className="pl-4 border-l-2 border-bisu-yellow-light">
                  <div className="space-y-2">
                    <Label htmlFor="duplicate_range">Duplicate Check Range (Hours)</Label>
                    <Input
                      id="duplicate_range"
                      type="number"
                      min="1"
                      max="12"
                      step="1"
                      value={settings.attendance_duplicate_range_hours}
                      onChange={(e) => handleInputChange('attendance_duplicate_range_hours', parseInt(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500">Hours range to check for duplicate time-in entries</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Policy Summary */}
        <Card className="shadow-md border-bisu-yellow border-2">
          <CardHeader className="bg-bisu-yellow-light">
            <CardTitle className="flex items-center gap-2 text-bisu-purple-deep">
              <AlertCircle className="h-5 w-5" />
              Current Policy Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-bisu-purple-deep">Session Times</h4>
                <ul className="space-y-1 text-sm">
                  <li>Morning: {settings.attendance_morning_start} - {settings.attendance_morning_end}</li>
                  <li>Afternoon: {settings.attendance_afternoon_start} - {settings.attendance_afternoon_end}</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-bisu-purple-deep">Active Policies</h4>
                <ul className="space-y-1 text-sm">
                  <li className={settings.attendance_allow_half_day ? "text-green-600" : "text-red-600"}>
                    Half-day attendance: {settings.attendance_allow_half_day ? "Allowed" : "Not allowed"}
                    {settings.attendance_allow_half_day && ` (${settings.attendance_half_day_minimum_hours}h min)`}
                  </li>
                  <li className={settings.attendance_allow_early_out ? "text-green-600" : "text-red-600"}>
                    Early timeout: {settings.attendance_allow_early_out ? "Allowed" : "Not allowed"}
                    {settings.attendance_allow_early_out && ` (${settings.attendance_early_out_threshold_minutes}min threshold)`}
                  </li>
                  <li className={settings.attendance_prevent_duplicate_entries ? "text-green-600" : "text-red-600"}>
                    Duplicate prevention: {settings.attendance_prevent_duplicate_entries ? "Enabled" : "Disabled"}
                    {settings.attendance_prevent_duplicate_entries && ` (${settings.attendance_duplicate_range_hours}h range)`}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={fetchSettings} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reset Changes
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={isSaving}
            className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
          >
            <Save className={`mr-2 h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}