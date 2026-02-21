import apiClient from './apiClient'
import type { DashboardStats, FleetOverview } from '@/types'

export const analyticsService = {
  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<{
      status: string
      data: DashboardStats
    }>('/analytics/dashboard')
    return data.data
  },

  getFleetOverview: async (): Promise<FleetOverview> => {
    const { data } = await apiClient.get<{
      status: string
      data: FleetOverview
    }>('/analytics/fleet-overview')
    return data.data
  },

  getVehicleROI: async (vehicleId: string) => {
    const { data } = await apiClient.get(`/analytics/vehicle/${vehicleId}/roi`)
    return data.data
  },

  getFuelEfficiency: async (startDate?: string, endDate?: string) => {
    const { data } = await apiClient.get('/analytics/fuel-efficiency', {
      params: { startDate, endDate },
    })
    return data.data
  },

  getMaintenanceCosts: async (params: {
    startDate?: string
    endDate?: string
    vehicleId?: string
  } = {}) => {
    const { data } = await apiClient.get('/analytics/maintenance-costs', { params })
    return data.data
  },

  getDriverPerformance: async () => {
    const { data } = await apiClient.get('/analytics/driver-performance')
    return data.data
  },

  getTripReport: async (params: {
    startDate?: string
    endDate?: string
    status?: string
  } = {}) => {
    const { data } = await apiClient.get('/analytics/trips', { params })
    return data.data
  },

  getFinancialReport: async (startDate?: string, endDate?: string) => {
    const { data } = await apiClient.get('/analytics/financial', {
      params: { startDate, endDate },
    })
    return data.data
  },

  getOperationalCosts: async (vehicleId: string) => {
    const { data } = await apiClient.get(
      `/analytics/vehicle/${vehicleId}/operational-costs`,
    )
    return data.data
  },
}
