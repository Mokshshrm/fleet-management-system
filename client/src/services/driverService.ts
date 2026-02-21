import apiClient from './apiClient'
import type { Driver, DriverPerformance, DriverStatus } from '@/types'

export interface DriverFilters {
  status?: DriverStatus
  licenseExpiring?: boolean
  page?: number
  limit?: number
}

export interface DriverListResponse {
  drivers: Driver[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const driverService = {
  getAll: async (filters: DriverFilters = {}) => {
    const { data } = await apiClient.get<{ status: string; data: DriverListResponse }>(
      '/drivers',
      { params: filters },
    )
    return data.data
  },

  getAvailable: async () => {
    const { data } = await apiClient.get<{
      status: string
      data: { drivers: Driver[] }
    }>('/drivers/available')
    return data.data.drivers
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: { driver: Driver }
    }>(`/drivers/${id}`)
    return data.data.driver
  },

  create: async (payload: Partial<Driver>) => {
    const { data } = await apiClient.post<{
      status: string
      data: { driver: Driver }
    }>('/drivers', payload)
    return data.data.driver
  },

  update: async (id: string, payload: Partial<Driver>) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { driver: Driver }
    }>(`/drivers/${id}`, payload)
    return data.data.driver
  },

  updateStatus: async (id: string, status: DriverStatus) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { driver: Driver }
    }>(`/drivers/${id}/status`, { status })
    return data.data.driver
  },

  delete: async (id: string) => {
    await apiClient.delete(`/drivers/${id}`)
  },

  getTrips: async (driverId: string, params: { status?: string; page?: number; limit?: number } = {}) => {
    const { data } = await apiClient.get(`/drivers/${driverId}/trips`, { params })
    return data.data
  },

  getPerformance: async (driverId: string): Promise<DriverPerformance> => {
    const { data } = await apiClient.get<{
      status: string
      data: DriverPerformance
    }>(`/drivers/${driverId}/performance`)
    return data.data
  },

  updateSafetyScore: async (driverId: string, score: number, reason: string) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { driver: Driver }
    }>(`/drivers/${driverId}/safety-score`, { score, reason })
    return data.data.driver
  },

  addIncident: async (
    driverId: string,
    incident: {
      date: string
      type: 'accident' | 'violation' | 'complaint' | 'other'
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      location?: string
      resolved?: boolean
    },
  ) => {
    const { data } = await apiClient.post<{
      status: string
      data: { driver: Driver }
    }>(`/drivers/${driverId}/incidents`, incident)
    return data.data.driver
  },
}
