import { useState, useEffect } from "react"
import { User, ApiResponse } from "../types"

interface UseUsersProps {
  currentPage: number
  itemsPerPage: number
  searchTerm: string
  selectedDepartment: string
  selectedStatus: string
}

export const useUsers = ({
  currentPage,
  itemsPerPage,
  searchTerm,
  selectedDepartment,
  selectedStatus
}: UseUsersProps) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedDepartment !== "All Departments" && { department: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: ApiResponse = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.pages)
      setTotalUsers(data.pagination.total)
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, selectedDepartment, selectedStatus])

  return {
    users,
    loading,
    totalPages,
    totalUsers,
    fetchUsers
  }
}
