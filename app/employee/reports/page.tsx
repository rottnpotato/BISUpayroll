"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { FileText, BarChart4, PieChart, Download, Filter, Printer } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { motion } from "framer-motion"

// Mock data
const attendanceReport = {
  totalWorkDays: 22,
  daysPresent: 20,
  daysAbsent: 0,
  daysLate: 2,
  totalHoursWorked: 160.5,
  averageHoursPerDay: 8.03,
  leavesTaken: 0,
  overtime: 0.5,
  monthlyAttendanceRate: "90.9%",
  yearlyAttendanceRate: "95.2%",
}

export default function EmployeeReports() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("attendance")

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

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
        type: "spring",
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
          <h1 className="text-2xl font-bold text-bisu-purple-deep">My Reports</h1>
          <p className="text-gray-600">View your personal performance reports and statistics</p>
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex mb-6 bg-bisu-purple-extralight">
          <TabsTrigger value="attendance" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
            <FileText className="mr-2 h-4 w-4" />
            Attendance Report
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-bisu-purple-deep data-[state=active]:bg-bisu-yellow-DEFAULT data-[state=active]:text-bisu-purple-deep">
            <BarChart4 className="mr-2 h-4 w-4" />
            Performance Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {isLoading ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SkeletonCard hasHeader={true} lines={6} />
              <div className="lg:col-span-2">
                <SkeletonCard hasHeader={true} lines={10} />
              </div>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <motion.div variants={itemVariants} className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-bisu-purple-deep flex items-center">
                        {/* <Calendar className="mr-2 h-5 w-5" /> */}
                        Select Period
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        modifiersClassNames={{
                          selected: "bg-bisu-yellow-DEFAULT text-bisu-purple-deep hover:bg-bisu-yellow-dark",
                          today: "bg-bisu-purple-light text-white",
                        }}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="w-full text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                      <Button className="w-full bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep">Monthly Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Work Days:</span>
                        <span className="font-semibold text-bisu-purple-deep">{attendanceReport.totalWorkDays}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Days Present:</span>
                        <span className="font-semibold text-green-600">{attendanceReport.daysPresent}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Days Absent:</span>
                        <span className="font-semibold text-red-600">{attendanceReport.daysAbsent}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Days Late:</span>
                        <span className="font-semibold text-amber-600">{attendanceReport.daysLate}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Leaves Taken:</span>
                        <span className="font-semibold text-bisu-purple-deep">{attendanceReport.leavesTaken}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Overtime:</span>
                        <span className="font-semibold text-bisu-purple-deep">{attendanceReport.overtime} hrs</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column */}
              <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-bisu-purple-deep flex items-center">
                        <BarChart4 className="mr-2 h-5 w-5" />
                        Attendance Analytics
                      </CardTitle>
                      <Button variant="outline" className="text-bisu-purple-deep border-bisu-purple-deep hover:bg-bisu-purple-extralight">
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-bisu-purple-deep">Monthly Overview</h3>
                        
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-bisu-purple-deep bg-bisu-purple-extralight">
                                Attendance Rate
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-bisu-purple-deep">
                                {attendanceReport.monthlyAttendanceRate}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-bisu-purple-extralight">
                            <div 
                              style={{ width: attendanceReport.monthlyAttendanceRate }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-bisu-purple-deep"
                            ></div>
                          </div>
                        </div>
                        
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-bisu-purple-deep bg-bisu-purple-extralight">
                                Punctuality Rate
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-bisu-purple-deep">
                                90.0%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-bisu-purple-extralight">
                            <div 
                              style={{ width: "90%" }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-bisu-yellow-DEFAULT"
                            ></div>
                          </div>
                        </div>
                        
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-bisu-purple-deep bg-bisu-purple-extralight">
                                Hours Utilization
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-bisu-purple-deep">
                                100.4%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-bisu-purple-extralight">
                            <div 
                              style={{ width: "100%" }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-bisu-purple-deep">Yearly Statistics</h3>
                        
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-bisu-purple-deep bg-bisu-purple-extralight">
                                Yearly Attendance
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-bisu-purple-deep">
                                {attendanceReport.yearlyAttendanceRate}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-bisu-purple-extralight">
                            <div 
                              style={{ width: attendanceReport.yearlyAttendanceRate }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-bisu-purple-deep"
                            ></div>
                          </div>
                        </div>
                        
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-bisu-purple-deep bg-bisu-purple-extralight">
                                Leave Utilization
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-bisu-purple-deep">
                                0%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-bisu-purple-extralight">
                            <div 
                              style={{ width: "0%" }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500"
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-center items-center h-24">
                          <div className="text-center">
                            <PieChart className="h-12 w-12 mx-auto text-bisu-purple-deep opacity-20" />
                            <p className="text-gray-500 mt-2">Detailed charts will be available in the next update</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 border border-dashed border-bisu-purple-extralight rounded-lg bg-gray-50">
                      <h3 className="text-sm font-medium text-bisu-purple-deep mb-2">Key Insights</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Your attendance rate is above the department average of 89%</li>
                        <li>• You have been consistently punctual for the past 15 working days</li>
                        <li>• Consider utilizing your leave credits before the end of the year</li>
                        <li>• Your overtime hours are within the acceptable range</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {isLoading ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-6">
              <SkeletonCard hasHeader={true} lines={10} />
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-bisu-purple-deep/10 to-bisu-purple-light/10">
                    <CardTitle className="text-bisu-purple-deep flex items-center">
                      <BarChart4 className="mr-2 h-5 w-5" />
                      Performance Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <div className="text-center px-6">
                        <PieChart className="h-16 w-16 mx-auto text-bisu-purple-deep opacity-20" />
                        <h3 className="mt-4 text-lg font-medium text-bisu-purple-deep">Performance Reports Coming Soon</h3>
                        <p className="mt-2 text-sm text-gray-600">
                          We're currently developing comprehensive performance analytics for employees. 
                          Check back in the next update for detailed performance metrics and insights.
                        </p>
                        <Button className="mt-4 bg-bisu-yellow-DEFAULT hover:bg-bisu-yellow-dark text-bisu-purple-deep">
                          Request Early Access
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 