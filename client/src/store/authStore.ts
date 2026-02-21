import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser, UserRole } from '@/types'
import { tokenStorage, authService } from '@/services'

// ─── Role hierarchy ──────────────────────────────────────────────────────────

const ROLE_WEIGHTS: Record<UserRole, number> = {
  owner: 6,
  admin: 5,
  fleet_manager: 4,
  safety_officer: 3,
  dispatcher: 2,
  financial_analyst: 2,
  driver: 1,
}

// ─── Store type ───────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null
  permissions: string[]
  isAuthenticated: boolean
  isInitialized: boolean

  // Actions
  setUser: (user: AuthUser, accessToken: string, refreshToken: string, permissions?: string[]) => void
  clearAuth: () => void
  setInitialized: () => void
  setPermissions: (permissions: string[]) => void
  loadPermissions: () => Promise<void>

  // Role helpers
  hasRole: (minRole: UserRole) => boolean
  hasAnyRole: (...roles: UserRole[]) => boolean
  isOwnerOrAdmin: () => boolean

  // Permission helpers
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isInitialized: false,

      setUser: (user, accessToken, refreshToken, permissions = []) => {
        tokenStorage.setAccess(accessToken)
        tokenStorage.setRefresh(refreshToken)
        set({ user, isAuthenticated: true, permissions })
      },

      clearAuth: () => {
        tokenStorage.clear()
        set({ user: null, isAuthenticated: false, permissions: [] })
      },

      setInitialized: () => set({ isInitialized: true }),

      setPermissions: (permissions: string[]) => set({ permissions }),

      loadPermissions: async () => {
        try {
          const { permissions } = await authService.getMe()
          set({ permissions })
        } catch (error) {
          console.error('Failed to load permissions:', error)
        }
      },

      hasRole: (minRole: UserRole) => {
        const { user } = get()
        if (!user) return false
        return (ROLE_WEIGHTS[user.role] ?? 0) >= (ROLE_WEIGHTS[minRole] ?? 0)
      },

      hasAnyRole: (...roles: UserRole[]) => {
        const { user } = get()
        if (!user) return false
        return roles.includes(user.role)
      },

      isOwnerOrAdmin: () => {
        return get().hasRole('admin')
      },

      hasPermission: (permission: string) => {
        const { permissions } = get()
        return permissions.includes(permission)
      },

      hasAnyPermission: (permissionList: string[]) => {
        const { permissions } = get()
        return permissionList.some((perm) => permissions.includes(perm))
      },

      hasAllPermissions: (permissionList: string[]) => {
        const { permissions } = get()
        return permissionList.every((perm) => permissions.includes(perm))
      },
    }),
    {
      name: 'ff_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    },
  ),
)
