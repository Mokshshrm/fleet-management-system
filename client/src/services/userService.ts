import apiClient from './apiClient'
import type { User, UserRole } from '@/types'

export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  page?: number
  limit?: number
}

export interface UserListResponse {
  users: User[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const userService = {
  getAll: async (filters: UserFilters = {}) => {
    const { data } = await apiClient.get<{ status: string; data: UserListResponse }>(
      '/users',
      { params: filters },
    )
    return data.data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: { user: User }
    }>(`/users/${id}`)
    return data.data.user
  },

  update: async (id: string, payload: Partial<User>) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { user: User }
    }>(`/users/${id}`, payload)
    return data.data.user
  },

  updateRole: async (id: string, role: UserRole) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { user: User }
    }>(`/users/${id}/role`, { role })
    return data.data.user
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { user: User }
    }>(`/users/${id}/status`, { isActive })
    return data.data.user
  },

  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`)
  },
}
