"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"

export default function SettingsPage() {
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
              <Input id="companyName" defaultValue="Bohol Island State University" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTitle">System Title</Label>
              <Input id="siteTitle" defaultValue="BISU Payroll Management System" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input id="adminEmail" type="email" defaultValue="admin@bisu.edu.ph" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input id="contactNumber" defaultValue="+63 38 123 4567" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="systemAddress">Address</Label>
            <Input id="systemAddress" defaultValue="CPG North Avenue, Tagbilaran City, Bohol" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="systemActive">System Active</Label>
              <div className="text-sm text-gray-500">Temporarily disable access to the system</div>
            </div>
            <Switch id="systemActive" defaultChecked />
          </div>
          <div className="flex justify-end">
            <Button className="bg-bisu-purple-deep hover:bg-bisu-purple-medium">
              <Save className="mr-2 h-4 w-4" />
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
              <Switch id="twoFactorAuth" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireUppercase">Require Uppercase</Label>
                <div className="text-sm text-gray-500">Require at least one uppercase letter</div>
              </div>
              <Switch id="requireUppercase" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireSpecial">Require Special Characters</Label>
                <div className="text-sm text-gray-500">Require at least one special character</div>
              </div>
              <Switch id="requireSpecial" defaultChecked />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-bisu-purple-deep hover:bg-bisu-purple-medium">
              <Save className="mr-2 h-4 w-4" />
              Save Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 