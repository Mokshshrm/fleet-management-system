import apiClient from './apiClient'
import type { MaintenanceLog, MaintenanceStatus, MaintenanceStats, MaintenanceType } from '@/types'

export interface MaintenanceFilters {
  status?: MaintenanceStatus
  vehicleId?: string
  type?: MaintenanceType
  page?: number
  limit?: number
}

export interface MaintenanceListResponse {
  maintenanceLogs: MaintenanceLog[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const maintenanceService = {
  getAll: async (filters: MaintenanceFilters = {}) => {
    const { data } = await apiClient.get<{
      status: string
      data: MaintenanceListResponse
    }>('/maintenance', { params: filters })
    return data.data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: { maintenanceLog: MaintenanceLog }
    }>(`/maintenance/${id}`)
    return data.data.maintenanceLog
  },

  getStats: async (vehicleId?: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: MaintenanceStats
    }>('/maintenance/stats', { params: { vehicleId } })
    return data.data
  },

  create: async (payload: Partial<MaintenanceLog>) => {
    const { data } = await apiClient.post<{
      status: string
      data: { maintenanceLog: MaintenanceLog }
    }>('/maintenance', payload)
    return data.data.maintenanceLog
  },

  update: async (id: string, payload: Partial<MaintenanceLog>) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { maintenanceLog: MaintenanceLog }
    }>(`/maintenance/${id}`, payload)
    return data.data.maintenanceLog
  },

  start: async (id: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { maintenanceLog: MaintenanceLog }
    }>(`/maintenance/${id}/start`)
    return data.data.maintenanceLog
  },

  complete: async (id: string, completedAt: string, notes?: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { maintenanceLog: MaintenanceLog }
    }>(`/maintenance/${id}/complete`, { completedAt, notes })
    return data.data.maintenanceLog
  },

  cancel: async (id: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { maintenanceLog: MaintenanceLog }
    }>(`/maintenance/${id}/cancel`)
    return data.data.maintenanceLog
  },
}
