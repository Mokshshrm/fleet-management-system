import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { vehicleService } from '@/services'
import type { Vehicle, VehicleStatus, VehicleType } from '@/types'
import {
  PageHeader,
  Button,
  Input,
  Select,
  DataTable,
  StatusBadge,
  type Column,
} from '@/components/ui'
import { useAuthStore } from '@/store'
import { formatDate, getErrorMessage, humanize, truncate } from '@/utils'
import { VehicleFormModal } from './components/VehicleFormModal'
import { VehicleStatusModal } from './components/VehicleStatusModal'
import { PermissionGate } from '@/components'

const vehicleTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bus', label: 'Bus' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'pickup', label: 'Pickup' },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'on_trip', label: 'On Trip' },
  { value: 'in_shop', label: 'In Shop' },
  { value: 'out_of_service', label: 'Out of Service' },
  { value: 'retired', label: 'Retired' },
]

export default function VehiclesPage() {
  const { hasRole, hasPermission } = useAuthStore()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<VehicleType | ''>('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('')
  const [formModal, setFormModal] = useState<{ open: boolean; vehicle?: Vehicle }>({
    open: false,
  })
  const [statusModal, setStatusModal] = useState<{
    open: boolean
    vehicle?: Vehicle
  }>({ open: false })

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles', page, search, typeFilter, statusFilter],
    queryFn: () =>
      vehicleService.getAll({
        page,
        limit: 15,
        search: search || undefined,
        vehicleType: (typeFilter as VehicleType) || undefined,
        status: (statusFilter as VehicleStatus) || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: vehicleService.delete,
    onSuccess: () => {
      toast.success('Vehicle deleted')
      qc.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const columns: Column<Vehicle>[] = [
    {
      key: 'name',
      header: 'Vehicle',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-[11px] text-slate-500">
            {row.make} {row.model} · {row.year}
          </p>
        </div>
      ),
    },
    {
      key: 'licensePlate',
      header: 'License Plate',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
          {row.licensePlate}
        </span>
      ),
    },
    {
      key: 'vehicleType',
      header: 'Type',
      render: (row) => <span className="capitalize">{humanize(row.vehicleType)}</span>,
    },
    {
      key: 'maxLoadCapacity',
      header: 'Capacity',
      render: (row) => (
        <span>
          {row.maxLoadCapacity?.value} {row.maxLoadCapacity?.unit}
        </span>
      ),
    },
    {
      key: 'odometer',
      header: 'Odometer',
      render: (row) => (
        <span>
          {row.odometer?.current?.toLocaleString()} {row.odometer?.unit}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <PermissionGate permission="UPDATE_VEHICLE">
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setFormModal({ open: true, vehicle: row })
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setStatusModal({ open: true, vehicle: row })
                }}
              >
                Status
              </Button>
            </>
          </PermissionGate>
          <PermissionGate permission="DELETE_VEHICLE">
            <Button
              variant="ghost"
              size="xs"
              className="text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Delete this vehicle?')) deleteMutation.mutate(row._id)
              }}
            >
              Del
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle Registry"
        description="Manage and track your entire fleet"
        actions={
          <PermissionGate permission="CREATE_VEHICLE">
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() => setFormModal({ open: true })}
            >
              Add Vehicle
            </Button>
          </PermissionGate>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="Search by name or plate…"
          leftAddon={<Search size={12} />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          wrapperClassName="flex-1 min-w-[180px] max-w-xs"
        />
        <Select
          options={vehicleTypeOptions}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as VehicleType | '')
            setPage(1)
          }}
          wrapperClassName="min-w-[140px]"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as VehicleStatus | '')
            setPage(1)
          }}
          wrapperClassName="min-w-[140px]"
        />
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw size={13} />}
          onClick={() => qc.invalidateQueries({ queryKey: ['vehicles'] })}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
        <DataTable
          columns={columns}
          data={data?.vehicles ?? []}
          keyExtractor={(v) => v._id}
          loading={isLoading}
          error={error ? getErrorMessage(error) : null}
          emptyTitle="No vehicles found"
          emptyDescription="Add your first vehicle to get started."
          emptyAction={
            hasRole('fleet_manager') ? (
              <Button size="sm" onClick={() => setFormModal({ open: true })}>
                Add Vehicle
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
      <VehicleFormModal
        isOpen={formModal.open}
        vehicle={formModal.vehicle}
        onClose={() => setFormModal({ open: false })}
      />
      <VehicleStatusModal
        isOpen={statusModal.open}
        vehicle={statusModal.vehicle}
        onClose={() => setStatusModal({ open: false })}
      />
    </div>
  )
}
