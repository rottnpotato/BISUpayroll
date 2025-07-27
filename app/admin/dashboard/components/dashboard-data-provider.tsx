import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DashboardData } from "./types"

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
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
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
