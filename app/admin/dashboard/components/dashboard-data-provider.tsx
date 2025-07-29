import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DashboardData } from "./types"
import EmptyState from "./EmptyState"
import { Database, RefreshCw, AlertTriangle } from "lucide-react"

interface DashboardDataProviderProps {
  children: (props: {
    dashboardData: DashboardData | null
    isLoading: boolean
    error: string | null
    refreshData: () => void
  }) => React.ReactNode
}

export default function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/admin/dashboard')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon={AlertTriangle}
            title="Unable to Load Dashboard Data"
            description="We're having trouble connecting to the BISU Payroll system. Please check your connection and try again."
            variant="large"
          />
          <div className="text-center mt-6">
            <Button 
              onClick={fetchDashboardData}
              className="bg-bisu-purple-deep hover:bg-bisu-purple-medium text-white flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {children({
        dashboardData,
        isLoading,
        error,
        refreshData: fetchDashboardData
      })}
    </>
  )
}
