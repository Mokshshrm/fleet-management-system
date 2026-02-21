import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store'
import { tokenStorage, authService } from '@/services'

interface Props {
  children: ReactNode
}

/**
 * Runs once on app mount and ensures the auth state is valid before rendering
 * any routes. Handles the page-refresh case where sessionStorage (access token)
 * is wiped but localStorage still has the refresh token + persisted user.
 */
export function AuthInitializer({ children }: Props) {
  const { isAuthenticated, setInitialized, clearAuth, loadPermissions } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        const refreshToken = tokenStorage.getRefresh()
        const hasAccessToken = !!tokenStorage.getAccess()

        if (isAuthenticated && refreshToken && !hasAccessToken) {
          // Page was refreshed — sessionStorage is cleared so access token is gone
          // but the refresh token in localStorage is still valid. Re-issue tokens.
          try {
            const { accessToken } = await authService.refreshToken(refreshToken)
            tokenStorage.setAccess(accessToken)
            // Load permissions after token refresh
            await loadPermissions()
          } catch {
            // Refresh token expired or rejected — clear everything
            clearAuth()
          }
        } else if (isAuthenticated && !refreshToken) {
          // Persisted as authenticated but tokens are missing — clear stale state
          clearAuth()
        } else if (isAuthenticated && hasAccessToken) {
          // User is authenticated and has valid tokens — load permissions
          await loadPermissions()
        }
      } finally {
        // Always mark as initialized so the app unblocks
        setInitialized()
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
