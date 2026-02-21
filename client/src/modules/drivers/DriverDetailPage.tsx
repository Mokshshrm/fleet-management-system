import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Star,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react'
import { driverService } from '@/services'
import {
  PageHeader,
  Button,
  StatusBadge,
  Badge,
  Card,
  KpiCard,
  Skeleton,
  DataTable,
  type Column,
} from '@/components/ui'
import { useAuthStore } from '@/store'
import {
  formatDate,
  formatNumber,
  getErrorMessage,
  isLicenseExpired,
  isLicenseExpiringSoon,
  cn,
  humanize,
} from '@/utils'
import type { Trip } from '@/types'
import { DriverFormModal } from './components/DriverFormModal'
import { IncidentModal } from './components/IncidentModal'
import { SafetyScoreModal } from './components/SafetyScoreModal'

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { hasRole } = useAuthStore()

  const [editOpen, setEditOpen] = useState(false)
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)

  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driverService.getById(id!),
    enabled: !!id,
  })

  const { data: performance } = useQuery({
    queryKey: ['driver-performance', id],
    queryFn: () => driverService.getPerformance(id!),
    enabled: !!id,
  })

  const { data: tripsData } = useQuery({
    queryKey: ['driver-trips', id],
    queryFn: () => driverService.getTrips(id!, { limit: 10 }),
    enabled: !!id,
  })

  const tripColumns: Column<Trip>[] = [
    {
      key: 'origin',
      header: 'Route',
      render: (row) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin size={11} className="text-slate-400 shrink-0" />
          <span className="truncate max-w-[120px]">
            {typeof row.origin === 'object' ? row.origin.address : row.origin}
          </span>
          <ChevronRight size={11} className="text-slate-400 shrink-0" />
          <span className="truncate max-w-[120px]">
            {typeof row.destination === 'object'
              ? row.destination.address
              : row.destination}
          </span>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Date',
      render: (row) => formatDate(row.schedule?.plannedDepartureTime),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) =>
        row.rating ? (
          <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
            <Star size={11} fill="currentColor" />
            {row.rating.score}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
  ]

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )

  if (error || !driver)
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error ? getErrorMessage(error) : 'Driver not found'}</p>
        <Link to="/drivers">
          <Button variant="secondary" leftIcon={<ArrowLeft size={14} />}>
            Back to Drivers
          </Button>
        </Link>
      </div>
    )

  const licExpired = isLicenseExpired(driver.license.expiryDate)
  const licExpiring = isLicenseExpiringSoon(driver.license.expiryDate)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to="/drivers">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />}>
              Drivers
            </Button>
          </Link>
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
            {driver.firstName[0]}
            {driver.lastName[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {driver.firstName} {driver.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={driver.status} />
              {licExpired && (
                <Badge variant="danger" size="sm">
                  <AlertTriangle size={10} className="mr-0.5" />
                  License Expired
                </Badge>
              )}
              {!licExpired && licExpiring && (
                <Badge variant="warning" size="sm">
                  <AlertTriangle size={10} className="mr-0.5" />
                  License Expiring
                </Badge>
              )}
            </div>
          </div>
        </div>
        {hasRole('fleet_manager') && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Shield size={13} />}
              onClick={() => setSafetyOpen(true)}
            >
              Safety Score
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<AlertTriangle size={13} />}
              onClick={() => setIncidentOpen(true)}
            >
              Add Incident
            </Button>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              Edit Driver
            </Button>
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Safety Score"
          value={`${driver.safetyScore.current}/100`}
          color={
            driver.safetyScore.current >= 80
              ? 'success'
              : driver.safetyScore.current >= 60
                ? 'warning'
                : 'danger'
          }
          icon={<Shield size={18} />}
        />
        <KpiCard
          title="Total Trips"
          value={driver.performance.totalTrips}
          color="primary"
          icon={<MapPin size={18} />}
        />
        <KpiCard
          title="Avg Rating"
          value={
            performance?.avgRating
              ? `${performance.avgRating.toFixed(1)} ★`
              : '—'
          }
          color="secondary"
          icon={<Star size={18} />}
        />
        <KpiCard
          title="On-Time Rate"
          value={
            performance?.onTimeDeliveryRate != null
              ? `${formatNumber(performance.onTimeDeliveryRate)}%`
              : '—'
          }
          color="success"
          icon={<Shield size={18} />}
        />
      </div>

      {/* Info + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Driver Info */}
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Personal Info</h2>
          <dl className="space-y-2 text-sm">
            {driver.phone && (
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400" />
                <span className="text-slate-600">{driver.phone}</span>
              </div>
            )}
            {driver.email && (
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-slate-400" />
                <span className="text-slate-600">{driver.email}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100">
              <dt className="text-xs text-slate-500">License No.</dt>
              <dd className="font-mono text-slate-900 text-xs mt-0.5">
                {driver.license.number}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">License Expiry</dt>
              <dd
                className={cn(
                  'text-xs mt-0.5 font-medium',
                  licExpired
                    ? 'text-red-600'
                    : licExpiring
                      ? 'text-amber-600'
                      : 'text-slate-900',
                )}
              >
                {formatDate(driver.license.expiryDate)}
              </dd>
            </div>
            {driver.license.category && driver.license.category.length > 0 && (
              <div>
                <dt className="text-xs text-slate-500">License Category</dt>
                <dd className="text-xs text-slate-900 mt-0.5">{driver.license.category.join(', ')}</dd>
              </div>
            )}
            {driver.dateOfBirth && (
              <div>
                <dt className="text-xs text-slate-500">Date of Birth</dt>
                <dd className="text-xs text-slate-900 mt-0.5">
                  {formatDate(driver.dateOfBirth)}
                </dd>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100">
              <dt className="text-xs text-slate-500">Total Distance</dt>
              <dd className="text-xs text-slate-900 mt-0.5">
                {formatNumber(driver.performance.totalDistance?.value ?? 0)}{' '}
                {driver.performance.totalDistance?.unit ?? 'km'}
              </dd>
            </div>
          </dl>
          {driver.notes && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-xs text-slate-600">{driver.notes}</p>
            </div>
          )}
        </Card>

        {/* Incidents */}
        <Card className="p-5 col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-800">
            Incident History
            {driver.incidents.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({driver.incidents.length} total)
              </span>
            )}
          </h2>
          {driver.incidents.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No incidents recorded.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {[...driver.incidents]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((inc, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full mt-1.5 shrink-0',
                        inc.severity === 'critical' || inc.severity === 'high'
                          ? 'bg-red-500'
                          : inc.severity === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-cyan-500',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-800">
                          {humanize(inc.type)}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(inc.date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{inc.description}</p>
                      {inc.location && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={9} />
                          {inc.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Trip History */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">Recent Trips</h2>
        <DataTable
          columns={tripColumns}
          data={tripsData?.trips ?? []}
          keyExtractor={(t) => t._id}
          emptyTitle="No trips found"
          emptyDescription="This driver hasn't been assigned any trips yet."
        />
      </Card>

      {/* Modals */}
      <DriverFormModal isOpen={editOpen} driver={driver} onClose={() => setEditOpen(false)} />
      <IncidentModal
        isOpen={incidentOpen}
        driverId={driver._id}
        onClose={() => setIncidentOpen(false)}
      />
      <SafetyScoreModal
        isOpen={safetyOpen}
        driverId={driver._id}
        currentScore={driver.safetyScore.current}
        onClose={() => setSafetyOpen(false)}
      />
    </div>
  )
}
