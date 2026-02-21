import { ReactNode } from 'react'
import { useAuthStore } from '@/store'

interface PermissionGateProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission)

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface AnyPermissionGateProps {
  permissions: string[]
  children: ReactNode
  fallback?: ReactNode
}

export function AnyPermissionGate({ permissions, children, fallback = null }: AnyPermissionGateProps) {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface AllPermissionsGateProps {
  permissions: string[]
  children: ReactNode
  fallback?: ReactNode
}

export function AllPermissionsGate({ permissions, children, fallback = null }: AllPermissionsGateProps) {
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions)

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
