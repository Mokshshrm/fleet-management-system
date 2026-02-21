import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { FullPageSpinner } from '@/components/ui'
import type { UserRole } from '@/types'

// ─── Protected Route ──────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  redirectTo?: string
}

export function ProtectedRoute({ redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) {
    return <FullPageSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <Outlet />
}

// ─── Role Guard ───────────────────────────────────────────────────────────────

interface RoleGuardProps {
  minRole?: UserRole
  roles?: UserRole[]
  fallback?: JSX.Element
}

export function RoleGuard({ minRole, roles, fallback }: RoleGuardProps) {
  const { hasRole, hasAnyRole } = useAuthStore()

  let allowed = true

  if (minRole) {
    allowed = hasRole(minRole)
  } else if (roles?.length) {
    allowed = hasAnyRole(...roles)
  }

  if (!allowed) {
    return fallback ?? (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mb-3">
          <span className="text-primary-600 text-2xl">🔒</span>
        </div>
        <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
        <p className="text-xs text-slate-500 mt-1">
          You don't have permission to view this section.
        </p>
      </div>
    )
  }

  return <Outlet />
}

// ─── Public Route (redirect if authenticated) ────────────────────────────────

export function PublicRoute({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const { isAuthenticated, isInitialized } = useAuthStore()

  // Wait for auth to be resolved before deciding whether to redirect
  if (!isInitialized) {
    return <FullPageSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
