import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { tripService } from './tripService'
import type { Trip, TripStatus } from '@/types'
import {
  PageHeader,
  Button,
  Select,
  DataTable,
  StatusBadge,
  type Column,
} from '@/components/ui'
import { useAuthStore } from '@/store'
import { formatDate, getErrorMessage, truncate } from '@/utils'
import { TripFormModal } from './components/TripFormModal'
import { TripActionsModal } from './components/TripActionsModal'
import { PermissionGate } from '@/components'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function TripsPage() {
  const { hasRole, hasPermission } = useAuthStore()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<TripStatus | ''>('')
  const [formModal, setFormModal] = useState<{ open: boolean; trip?: Trip }>({ open: false })
  const [actionsModal, setActionsModal] = useState<{ open: boolean; trip?: Trip }>({
    open: false,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['trips', page, statusFilter],
    queryFn: () =>
      tripService.getAll({
        page,
        limit: 15,
        status: statusFilter || undefined,
      }),
  })

  const columns: Column<Trip>[] = [
    {
      key: 'tripNumber',
      header: 'Trip #',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600">
          {row.tripNumber || '—'}
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => {
        const vehicle = typeof row.vehicleId === 'object' ? row.vehicleId : null
        return vehicle ? (
          <div>
            <p className="text-sm font-medium text-slate-900">{vehicle.name}</p>
            <p className="text-xs text-slate-500">{vehicle.licensePlate}</p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      },
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (row) => {
        const driver = typeof row.driverId === 'object' ? row.driverId : null
        return driver ? (
          <div>
            <p className="text-sm font-medium text-slate-900">
              {driver.firstName} {driver.lastName}
            </p>
            <StatusBadge status={driver.status} className="text-[10px] px-1.5 py-0" dot={false} />
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      },
    },
    {
      key: 'origin',
      header: 'Origin',
      render: (row) => (
        <span className="truncate max-w-[120px] block text-sm">{truncate(row.origin.address, 25)}</span>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (row) => (
        <span className="truncate max-w-[120px] block text-sm">
          {truncate(row.destination.address, 25)}
        </span>
      ),
    },
    {
      key: 'schedule',
      header: 'Departure',
      sortable: true,
      render: (row) => (
        <span className="text-sm">{formatDate(row.schedule?.plannedDepartureTime, 'MMM d, HH:mm')}</span>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo',
      render: (row) => (
        <div>
          {row.cargo?.description && (
            <p className="text-sm font-medium text-slate-900 truncate max-w-[100px]">
              {row.cargo.description}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {row.cargo?.weight
              ? `${row.cargo.weight.value} ${row.cargo.weight.unit}`
              : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (row) => (
        <span className="text-sm">
          {row.distance?.planned
            ? `${row.distance.planned} ${row.distance.unit}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (row) => (
        <div className="flex items-center gap-1">
          <PermissionGate permission="UPDATE_TRIP">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setFormModal({ open: true, trip: row })
              }}
            >
              Edit
            </Button>
          </PermissionGate>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation()
              setActionsModal({ open: true, trip: row })
            }}
          >
            Actions
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trip Dispatcher"
        description="Plan, dispatch, and track logistics trips"
        actions={
          <PermissionGate permission="CREATE_TRIP">
            <Button leftIcon={<Plus size={14} />} onClick={() => setFormModal({ open: true })}>
              New Trip
            </Button>
          </PermissionGate>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 items-end flex-wrap">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TripStatus | '')
            setPage(1)
          }}
          wrapperClassName="min-w-[160px]"
        />
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw size={13} />}
          onClick={() => qc.invalidateQueries({ queryKey: ['trips'] })}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
        <DataTable
          columns={columns}
          data={data?.trips ?? []}
          keyExtractor={(t) => t._id}
          loading={isLoading}
          error={error ? getErrorMessage(error) : null}
          emptyTitle="No trips found"
          emptyDescription="Create a new trip to get started."
          emptyAction={
            hasPermission('CREATE_TRIP') ? (
              <Button size="sm" onClick={() => setFormModal({ open: true })}>
                New Trip
              </Button>
            ) : undefined
          }
          pagination={
            data?.pagination
              ? {
                  page: data.pagination.page,
                  pages: data.pagination.pages,
                  total: data.pagination.total,
                  limit: data.pagination.limit,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      </div>

      {/* Modals */}
      <TripFormModal
        isOpen={formModal.open}
        trip={formModal.trip}
        onClose={() => setFormModal({ open: false })}
      />
      <TripActionsModal
        isOpen={actionsModal.open}
        trip={actionsModal.trip}
        onClose={() => setActionsModal({ open: false })}
      />
    </div>
  )
}
