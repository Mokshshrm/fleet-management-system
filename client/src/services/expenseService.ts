import apiClient from './apiClient'
import type { Expense, ExpenseCategory, ExpenseStats, ExpenseStatus } from '@/types'

export interface ExpenseFilters {
  category?: ExpenseCategory
  status?: ExpenseStatus
  vehicleId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface ExpenseListResponse {
  expenses: Expense[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const expenseService = {
  getAll: async (filters: ExpenseFilters = {}) => {
    const { data } = await apiClient.get<{
      status: string
      data: ExpenseListResponse
    }>('/expenses', { params: filters })
    return data.data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{
      status: string
      data: { expense: Expense }
    }>(`/expenses/${id}`)
    return data.data.expense
  },

  getStats: async (params: { vehicleId?: string; startDate?: string; endDate?: string } = {}) => {
    const { data } = await apiClient.get<{
      status: string
      data: ExpenseStats
    }>('/expenses/stats', { params })
    return data.data
  },

  getByCategory: async (params: { startDate?: string; endDate?: string } = {}) => {
    const { data } = await apiClient.get('/expenses/by-category', { params })
    return data.data
  },

  create: async (payload: Partial<Expense>) => {
    const { data } = await apiClient.post<{
      status: string
      data: { expense: Expense }
    }>('/expenses', payload)
    return data.data.expense
  },

  update: async (id: string, payload: Partial<Expense>) => {
    const { data } = await apiClient.patch<{
      status: string
      data: { expense: Expense }
    }>(`/expenses/${id}`, payload)
    return data.data.expense
  },

  approve: async (id: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { expense: Expense }
    }>(`/expenses/${id}/approve`)
    return data.data.expense
  },

  reject: async (id: string, reason: string) => {
    const { data } = await apiClient.post<{
      status: string
      data: { expense: Expense }
    }>(`/expenses/${id}/reject`, { reason })
    return data.data.expense
  },

  delete: async (id: string) => {
    await apiClient.delete(`/expenses/${id}`)
  },
}
