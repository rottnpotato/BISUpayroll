"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, Users, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "@/components/simple-motion"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { login, isLoading: authLoading, isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin/dashboard")
      } else if (user.role === "EMPLOYEE") {
        router.replace("/employee/dashboard")
      }
    }
  }, [isAuthenticated, authLoading, user, router])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Use the auth context login function instead of direct fetch
      const result = await login({ email, password })
      
      if (result.success) {
        toast({ 
          title: "Login Successful", 
          description: result.message || "Welcome back!" 
        })
        
        // The auth context will handle the redirection based on user role
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#46246C] via-[#623B93] to-[#46246C] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#46246C] via-[#623B93] to-[#46246C] p-4 selection:bg-[#46246C] selection:text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7864A3]/10 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl z-10 flex flex-col md:flex-row gap-6"
      >
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center text-white p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 flex items-center gap-4"
          >
            <Image 
              src="/LOGO_BISU.svg" 
              alt="BISU Logo" 
              width={90} 
              height={90}
              priority
              className="w-auto h-auto max-h-[90px]"
            />
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold">BOHOL ISLAND</h2>
              <h2 className="text-2xl font-bold">STATE UNIVERSITY</h2>
              <p className="text-xs text-white/80">Balilihan Campus</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">PAYROLL MANAGEMENT SYSTEM</h1>
            <p className="text-white/80">Balance • Integrity • Stewardship • Uprightness</p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center mt-4"
          >
            <Image 
              src="/bagong-pilipinas.png" 
              alt="Bagong Pilipinas Logo" 
              width={120} 
              height={60} 
              className="mr-4"
            />
            <Image 
              src="/tuvlogo.png" 
              alt="TUV Rheinland Logo" 
              width={120} 
              height={60}
            />
          </motion.div>
        </div>
        
        <Card className="shadow-2xl bg-white/10 backdrop-blur-md border-white/30 w-full md:w-1/2">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-white/80">Sign in to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@bisu.edu.ph"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/20 border-white/50 text-white placeholder:text-white/50 focus:border-white transition-all duration-200"
                  style={
                    {
                      "--tw-ring-color": "white",
                    } as React.CSSProperties
                  }
                />
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/20 border-white/50 text-white placeholder:text-white/50 focus:border-white pr-10 transition-all duration-200"
                    style={
                      {
                        "--tw-ring-color": "white",
                      } as React.CSSProperties
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-white hover:text-white hover:bg-white/20 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                <Button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full bg-[#F6CC1A] hover:bg-[#D4A106] text-[#46246C] font-semibold text-lg py-3 transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>
            </form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center text-sm"
            >
              <div className="bg-white/10 rounded-lg p-4 space-y-2">
                <p className="text-white font-medium">Demo Credentials:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Admin:</span>
                    <code className="bg-[#46246C]/70 px-2 py-1 rounded text-white">
                      admin@bisu.edu.ph / password123
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Employee:</span>
                    <code className="bg-[#46246C]/70 px-2 py-1 rounded text-white">
                      juan.delacruz@bisu.edu.ph / password123
                    </code>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 flex justify-center space-x-6 text-white"
            >
              <div className="flex items-center space-x-2">
                <Users size={16} />
                <span className="text-sm">Staff Portal</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} />
                <span className="text-sm">Admin Panel</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      
      <div className="absolute bottom-2 text-white/50 text-xs text-center w-full">
        © {new Date().getFullYear()} Bohol Island State University - Balilihan Campus. All rights reserved.
      </div>
    </div>
  )
}
