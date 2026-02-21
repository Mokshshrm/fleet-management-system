import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui'
import { ProtectedRoute, PublicRoute, RoleGuard } from './guards'

// ─── Lazy page imports ────────────────────────────────────────────────────────

const LoginPage = lazy(() => import('@/modules/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/modules/auth/RegisterPage'))
const AcceptInvitePage = lazy(() => import('@/modules/auth/AcceptInvitePage'))

const AppShell = lazy(() => import('@/components/layout/AppShell'))
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'))
const VehiclesPage = lazy(() => import('@/modules/vehicles/VehiclesPage'))
const DriversPage = lazy(() => import('@/modules/drivers/DriversPage'))
const DriverDetailPage = lazy(() => import('@/modules/drivers/DriverDetailPage'))
const TripsPage = lazy(() => import('@/modules/trips/TripsPage'))
const MaintenancePage = lazy(() => import('@/modules/maintenance/MaintenancePage'))
const FinancePage = lazy(() => import('@/modules/finance/FinancePage'))
const AnalyticsPage = lazy(() => import('@/modules/analytics/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'))

// ─── Routes ───────────────────────────────────────────────────────────────────

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitePage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Vehicles — fleet_manager+ */}
            <Route path="/vehicles" element={<VehiclesPage />} />

            {/* Trips — dispatcher+ */}
            <Route path="/trips" element={<TripsPage />} />

            {/* Drivers — fleet_manager+ */}
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/drivers/:id" element={<DriverDetailPage />} />

            {/* Maintenance — fleet_manager+ */}
            <Route path="/maintenance" element={<MaintenancePage />} />

            {/* Finance — financial_analyst+ */}
            <Route path="/finance" element={<FinancePage />} />

            {/* Analytics — all roles */}
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Settings — admin+ */}
            <Route element={<RoleGuard minRole="admin" />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
