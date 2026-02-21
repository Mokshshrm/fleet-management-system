import apiClient from '@/services/apiClient'
import type { Trip } from '@/types'
import type { TripStatus } from '@/types'

export interface TripFilters {
  status?: TripStatus
  vehicleId?: string
  driverId?: string
  page?: number
  limit?: number
}

export interface TripListResponse {
  trips: Trip[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const tripService = {
  getAll: async (filters: TripFilters = {}) => {
    const { data } = await apiClient.get<{ status: string; data: TripListResponse }>(
      '/trips',
      { params: filters },
    )
    return data.data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}`)
    return data.data.trip
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<{
      status: string
      data: { trip: Trip }
    }>('/trips', payload)
    return data.data.trip
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}`, payload)
    return data.data.trip
  },

  dispatch: async (id: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}/dispatch`)
    return data.data.trip
  },

  start: async (id: string, odometerStart: number) => {
    const { data } = await apiClient.post<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}/start`, { odometer: { start: odometerStart } })
    return data.data.trip
  },

  complete: async (id: string, odometerEnd: number) => {
    const { data } = await apiClient.post<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}/complete`, { odometer: { end: odometerEnd } })
    return data.data.trip
  },

  cancel: async (id: string, cancelReason: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}/cancel`, { cancelReason })
    return data.data.trip
  },

  rate: async (id: string, score: number, feedback?: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}/rate`, { score, feedback })
    return data.data.trip
  },

  addProofOfDelivery: async (
    id: string,
    pod: { recipientName?: string; notes?: string },
  ) => {
    const { data } = await apiClient.post<{
      status: string
      data: { trip: Trip }
    }>(`/trips/${id}/proof-of-delivery`, pod)
    return data.data.trip
  },

  getExpenses: async (id: string) => {
    const { data } = await apiClient.get(`/trips/${id}/expenses`)
    return data.data
  },
}
