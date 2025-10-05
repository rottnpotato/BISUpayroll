"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Briefcase, 
  GraduationCap, 
  Shield, 
  Calendar,
  FileText,
  Key,
  Lock,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  Printer
} from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EmployeeData {
  id: string
  fullName: string
  position: string
  department: string
  email: string
  phone: string
  dateHired: string
  employmentStatus: string
  employeeType: string
  address: string
  birthDate?: string
  gender?: string
  civilStatus?: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  education?: Array<{
    degree: string
    institution: string
    yearCompleted: string
  }>
  skills?: string[]
}

export default function EmployeeProfile() {
  const { userName } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    fetchEmployeeProfile()
  }, [])

  const fetchEmployeeProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employee/profile')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setEmployeeData(result.data)
          // Initialize form data with fetched data
          setFormData({
            phone: result.data.phone || "",
            address: result.data.address || "",
            emergencyContactName: result.data.emergencyContact?.name || "",
            emergencyContactRelationship: result.data.emergencyContact?.relationship || "",
            emergencyContactPhone: result.data.emergencyContact?.phone || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
        }
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = () => {
    setIsSaving(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      setIsEditing(false)
      setShowSuccess(true)
      
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    }, 1500)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  }

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-bisu-purple-deep">My Profile</h1>
          <p className="text-gray-600">View and manage your personal information</p>
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-bisu-yellow hover:bg-bisu-yellow-light text-bisu-purple-deep print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Profile
        </Button>
      </motion.div>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>Your profile has been updated successfully!</span>
        </motion.div>
      )}

      {isLoading ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard hasHeader={true} lines={6} />
          <div className="lg:col-span-2">
            <SkeletonCard hasHeader={true} lines={10} />
          </div>
        </motion.div>
      ) : !employeeData ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile data not available</h2>
          <p className="text-gray-600">Unable to load your profile information. Please try again later.</p>
          <Button onClick={fetchEmployeeProfile} className="mt-4">
            Retry
          </Button>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10 pb-2">
                <CardTitle className="text-bisu-purple-deep">Profile</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src="" alt={userName || "Employee Profile"} />
                  <AvatarFallback className="text-4xl bg-bisu-purple-light text-white">
                    {userName?.charAt(0) || "J"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-bisu-purple-deep">{employeeData.fullName}</h2>
                <p className="text-gray-600 mb-1">{employeeData.position}</p>
                <p className="text-sm text-gray-500 mb-4">{employeeData.department}</p>
                
                <div className="w-full border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 mr-3 text-bisu-purple-medium" />
                      <span className="text-gray-600">Employee ID: {employeeData.id}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-bisu-purple-medium" />
                      <span className="text-gray-600">{employeeData.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-3 text-bisu-purple-medium" />
                      <span className="text-gray-600">{employeeData.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-3 text-bisu-purple-medium" />
                      <span className="text-gray-600">Hired: {employeeData.dateHired}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Shield className="h-4 w-4 mr-3 text-bisu-purple-medium" />
                      <span className="text-gray-600">{employeeData.employmentStatus} • {employeeData.employeeType}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="mt-6 w-full bg-bisu-yellow hover:bg-bisu-yellow-light text-bisu-purple-deep"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Information */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-bisu-purple-extralight">
                <TabsTrigger value="personal" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep">
                  <User className="mr-2 h-4 w-4" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="employment" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Employment
                </TabsTrigger>
                <TabsTrigger value="security" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow data-[state=active]:text-bisu-purple-deep">
                  <Lock className="mr-2 h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-bisu-purple-deep flex items-center">
                          <User className="mr-2 h-5 w-5" />
                          Personal Information
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          Your personal and contact details
                        </CardDescription>
                      </div>
                      {isEditing && (
                        <Button 
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
                        >
                          {isSaving ? (
                            <>
                              <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-white/20 border-white animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-4">Basic Information</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
                            <Input 
                              value={employeeData.fullName} 
                              disabled 
                              className="bg-gray-50" 
                            />
                            <p className="text-xs text-gray-500 mt-1">Contact HR to update your legal name</p>
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Email Address</label>
                            <Input 
                              value={employeeData.email} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Phone Number</label>
                            <Input 
                              name="phone"
                              value={formData.phone} 
                              disabled={!isEditing} 
                              className={!isEditing ? "bg-gray-50" : ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Birth Date</label>
                            <Input 
                              value={employeeData.birthDate} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Gender</label>
                            <Input 
                              value={employeeData.gender} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Civil Status</label>
                            <Input 
                              value={employeeData.civilStatus} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-4">Address & Emergency Contact</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Home Address</label>
                            <Textarea 
                              name="address"
                              value={formData.address} 
                              disabled={!isEditing} 
                              className={!isEditing ? "bg-gray-50" : ""}
                              onChange={handleInputChange}
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Emergency Contact Name</label>
                            <Input 
                              name="emergencyContactName"
                              value={formData.emergencyContactName} 
                              disabled={!isEditing} 
                              className={!isEditing ? "bg-gray-50" : ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Relationship</label>
                            <Input 
                              name="emergencyContactRelationship"
                              value={formData.emergencyContactRelationship} 
                              disabled={!isEditing} 
                              className={!isEditing ? "bg-gray-50" : ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Emergency Contact Phone</label>
                            <Input 
                              name="emergencyContactPhone"
                              value={formData.emergencyContactPhone} 
                              disabled={!isEditing} 
                              className={!isEditing ? "bg-gray-50" : ""}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="employment">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep flex items-center">
                      <Briefcase className="mr-2 h-5 w-5" />
                      Employment Information
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Your job details and education background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-4">Job Information</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Employee ID</label>
                            <Input 
                              value={employeeData.id} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Position / Job Title</label>
                            <Input 
                              value={employeeData.position} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Department</label>
                            <Input 
                              value={employeeData.department} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Employment Status</label>
                            <Input 
                              value={employeeData.employmentStatus} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Employment Type</label>
                            <Input 
                              value={employeeData.employeeType} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">Date Hired</label>
                            <Input 
                              value={employeeData.dateHired} 
                              disabled 
                              className="bg-gray-50" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-4">Education & Skills</h3>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm text-gray-500 mb-2 block">Educational Background</label>
                            
                            {employeeData?.education?.map((edu, index) => (
                              <div key={index} className="mb-4 p-3 bg-bisu-purple-extralight/50 rounded-md">
                                <div className="flex items-start">
                                  <GraduationCap className="h-5 w-5 mr-2 text-bisu-purple-medium mt-0.5" />
                                  <div>
                                    <p className="font-medium text-bisu-purple-deep">{edu.degree}</p>
                                    <p className="text-sm text-gray-600">{edu.institution}</p>
                                    <p className="text-xs text-gray-500">Graduated: {edu.yearCompleted}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-2 block">Skills & Competencies</label>
                            <div className="flex flex-wrap gap-2">
                              {employeeData?.skills?.map((skill, index) => (
                                <span 
                                  key={index} 
                                  className="px-3 py-1 bg-bisu-purple-extralight text-bisu-purple-deep text-sm rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-6 p-4 border border-dashed border-bisu-yellow/50 rounded-lg bg-bisu-yellow-extralight/30">
                            <div className="flex">
                              <FileText className="h-5 w-5 mr-3 text-bisu-yellow-dark flex-shrink-0" />
                              <div>
                                <h4 className="font-medium text-bisu-purple-deep mb-1">Update Professional Information</h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  To update your educational background, skills, or professional certifications, please contact the HR department.
                                </p>
                                <Button variant="outline" className="text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight text-sm h-8">
                                  Contact HR
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep flex items-center">
                      <Lock className="mr-2 h-5 w-5" />
                      Account Security
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage your password and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-sm font-medium text-gray-600 mb-4">Change Password</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">Current Password</label>
                          <div className="relative">
                            <Input 
                              type="password"
                              name="currentPassword"
                              value={formData.currentPassword}
                              onChange={handleInputChange}
                              className="pr-10"
                            />
                            <Key className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">New Password</label>
                          <div className="relative">
                            <Input 
                              type="password"
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className="pr-10"
                            />
                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Password must be at least 8 characters with numbers and special characters
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">Confirm New Password</label>
                          <div className="relative">
                            <Input 
                              type="password"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="pr-10"
                            />
                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button 
                            className="w-full bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white"
                          >
                            Update Password
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-8 p-4 border border-dashed border-red-200 rounded-lg bg-red-50">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-gray-800 mb-1">Security Tips</h4>
                            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                              <li>Never share your password with anyone</li>
                              <li>Use a unique password for your work account</li>
                              <li>Include numbers, symbols, and mixed case letters</li>
                              <li>Change your password regularly</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 