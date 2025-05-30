"use client"
import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

type UserRole = "admin" | "employee" | null
interface AuthContextType {
  userRole: UserRole
  userName: string | null
  login: (role: "admin" | "employee", name: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Mock loading persisted session
    const storedRole = localStorage.getItem("userRole") as UserRole
    const storedName = localStorage.getItem("userName")
    if (storedRole && storedName) {
      setUserRole(storedRole)
      setUserName(storedName)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (!userRole && !pathname.startsWith("/login")) {
        router.push("/login")
      } else if (userRole === "admin" && !pathname.startsWith("/admin") && pathname !== "/login") {
        router.push("/admin/dashboard")
      } else if (userRole === "employee" && !pathname.startsWith("/employee") && pathname !== "/login") {
        router.push("/employee/dashboard")
      }
    }
  }, [userRole, pathname, router, isLoading])

  const login = (role: "admin" | "employee", name: string) => {
    setUserRole(role)
    setUserName(name)
    localStorage.setItem("userRole", role)
    localStorage.setItem("userName", name)
    if (role === "admin") {
      router.push("/admin/dashboard")
    } else {
      router.push("/employee/dashboard")
    }
  }

  const logout = () => {
    setUserRole(null)
    setUserName(null)
    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#2A1F40] text-[#FFC107]">
        Loading application...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ userRole, userName, login, logout, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
