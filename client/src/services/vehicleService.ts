import apiClient from './apiClient'
import type { Vehicle, VehicleStats, VehicleStatus, VehicleType } from '@/types'

export interface VehicleFilters {
  vehicleType?: VehicleType
  status?: VehicleStatus
  search?: string
  page?: number
  limit?: number
}

export interface VehicleListResponse {
  vehicles: Vehicle[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const vehicleService = {
  getAll: async (filters: VehicleFilters = {}) => {
    const { data } = await apiClient.get<{ status: string; data: VehicleListResponse }>(
      '/vehicles',
      { params: filters },
    )
    return data.data
  },

  getAvailable: async (vehicleType?: VehicleType) => {
    const { data } = await apiClient.get<{
      status: string
      data: { vehicles: Vehicle[] }
    }>('/vehicles/available', { params: { vehicleType } })
    return data.data.vehicles
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: { vehicle: Vehicle }
    }>(`/vehicles/${id}`)
    return data.data.vehicle
  },

  getStats: async () => {
    const { data } = await apiClient.get<{
      status: string
      data: VehicleStats
    }>('/vehicles/stats')
    return data.data
  },

  create: async (payload: Partial<Vehicle>) => {
    const { data } = await apiClient.post<{
      status: string
      data: { vehicle: Vehicle }
    }>('/vehicles', payload)
    return data.data.vehicle
  },

  update: async (id: string, payload: Partial<Vehicle>) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { vehicle: Vehicle }
    }>(`/vehicles/${id}`, payload)
    return data.data.vehicle
  },

  updateStatus: async (id: string, status: VehicleStatus) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { vehicle: Vehicle }
    }>(`/vehicles/${id}`, { status })
    return data.data.vehicle
  },

  delete: async (id: string) => {
    await apiClient.delete(`/vehicles/${id}`)
  },
}
