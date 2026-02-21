import { create } from 'zustand'
import type { VehicleType, VehicleStatus } from '@/types'

interface GlobalFilters {
  vehicleType?: VehicleType
  vehicleStatus?: VehicleStatus
  dateRange?: { start: string; end: string }
  region?: string
}

interface UiState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (val: boolean) => void

  // Modal
  activeModal: string | null
  modalData: unknown
  openModal: (id: string, data?: unknown) => void
  closeModal: () => void

  // Global filters
  globalFilters: GlobalFilters
  setGlobalFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void
  resetGlobalFilters: () => void

  // Page loading
  pageLoading: boolean
  setPageLoading: (val: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

  // Modal
  activeModal: null,
  modalData: null,
  openModal: (id, data = null) => set({ activeModal: id, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Global filters
  globalFilters: {},
  setGlobalFilter: (key, value) =>
    set((s) => ({ globalFilters: { ...s.globalFilters, [key]: value } })),
  resetGlobalFilters: () => set({ globalFilters: {} }),

  // Page loading
  pageLoading: false,
  setPageLoading: (val) => set({ pageLoading: val }),
}))
