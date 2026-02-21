import apiClient from './apiClient'
import type { FuelLog, FuelStats } from '@/types'

export interface FuelFilters {
  vehicleId?: string
  driverId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface FuelListResponse {
  fuelLogs: FuelLog[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const fuelService = {
  getAll: async (filters: FuelFilters = {}) => {
    const { data } = await apiClient.get<{ status: string; data: FuelListResponse }>(
      '/fuel',
      { params: filters },
    )
    return data.data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: { fuelLog: FuelLog }
    }>(`/fuel/${id}`)
    return data.data.fuelLog
  },

  create: async (payload: Partial<FuelLog>) => {
    const { data } = await apiClient.post<{
      status: string
      data: { fuelLog: FuelLog }
    }>('/fuel', payload)
    return data.data.fuelLog
  },

  update: async (id: string, payload: Partial<FuelLog>) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { fuelLog: FuelLog }
    }>(`/fuel/${id}`, payload)
    return data.data.fuelLog
  },

  delete: async (id: string) => {
    await apiClient.delete(`/fuel/${id}`)
  },

  getVehicleStats: async (vehicleId: string): Promise<FuelStats> => {
    const { data } = await apiClient.get<{
      status: string
      data: FuelStats
    }>(`/fuel/vehicle/${vehicleId}/stats`)
    return data.data
  },

  getEfficiencyReport: async (startDate?: string, endDate?: string) => {
    const { data } = await apiClient.get('/fuel/reports/efficiency', {
      params: { startDate, endDate },
    })
    return data.data
  },
}
