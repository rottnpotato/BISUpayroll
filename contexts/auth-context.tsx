"use client"
import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AuthUser, LoginCredentials } from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  userRole: "admin" | "employee" | "ADMIN" | "EMPLOYEE" | null 
  userName: string | null
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshUser = async () => {
    try {
      // Get token from cookie (handled by the server)
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log("Auth context - user verified:", data.user)
          setUser(data.user)
        } else {
          console.log("Auth context - user verification failed:", data.message)
          setUser(null)
        }
      } else {
        console.log("Auth context - verification response not ok:", response.status)
        setUser(null)
      }
    } catch (error) {
      console.error('Error verifying token:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include credentials to store cookies
        body: JSON.stringify(credentials),
      })

      const data = await response.json()
      console.log("Auth context - login response:", data)

      if (data.success) {
        console.log("Auth context - setting user after login:", data.user)
        
        // Automatically refresh user data after successful login
        await refreshUser()
        
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'An error occurred during login' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  // Only handle navigation for unauthenticated users and role mismatches
  useEffect(() => {
    console.log("Auth context navigation check:", { isLoading, pathname, user: user?.role })
    
    if (!isLoading && !pathname!.startsWith("/login")) {
      if (!user) {
        console.log("Auth context - redirecting to login (no user)")
        router.push("/login")
      } else if (user?.role === "ADMIN" && pathname!.startsWith("/employee")) {
        console.log("Auth context - redirecting admin from employee area")
        router.replace("/admin/dashboard")
      } else if (user?.role === "EMPLOYEE" && pathname!.startsWith("/admin")) {
        console.log("Auth context - redirecting employee from admin area")
        router.replace("/employee/dashboard")
      } else if (pathname === "/") {
        // Handle root path redirects
        if (user?.role === "ADMIN") {
          router.replace("/admin/dashboard")
        } else if (user?.role === "EMPLOYEE") {
          router.replace("/employee/dashboard")
        }
      }
    }
  }, [user, pathname, router, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#46246C] via-[#623B93] to-[#46246C] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading application...</p>
        </div>
      </div>
    )
  }

  const userRole = user?.role === "ADMIN" ? "admin" : user?.role === "EMPLOYEE" ? "employee" : null
  const userName = user ? `${user.firstName} ${user.lastName}` : null

  console.log("Auth context - current state:", { user: user?.role, userRole, isAuthenticated: !!user })

  return (
    <AuthContext.Provider value={{ 
      user,
      userRole, 
      userName, 
      login, 
      logout, 
      isLoading, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
