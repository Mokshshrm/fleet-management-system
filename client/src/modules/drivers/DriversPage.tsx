import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { driverService } from '@/services'
import type { Driver, DriverStatus } from '@/types'
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
import { formatDate, getErrorMessage, isLicenseExpired, isLicenseExpiringSoon } from '@/utils'
import { DriverFormModal } from './components/DriverFormModal'
import { cn } from '@/utils'
import { PermissionGate } from '@/components'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'on_duty', label: 'On Duty' },
  { value: 'on_trip', label: 'On Trip' },
  { value: 'off_duty', label: 'Off Duty' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
]

export default function DriversPage() {
  const { hasRole, hasPermission } = useAuthStore()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DriverStatus | ''>('')
  const [licenseExpiring, setLicenseExpiring] = useState(false)
  const [formModal, setFormModal] = useState<{ open: boolean; driver?: Driver }>({
    open: false,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['drivers', page, statusFilter, licenseExpiring],
    queryFn: () =>
      driverService.getAll({
        page,
        limit: 15,
        status: (statusFilter as DriverStatus) || undefined,
        licenseExpiring: licenseExpiring || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driverService.delete(id),
    onSuccess: () => {
      toast.success('Driver removed')
      qc.invalidateQueries({ queryKey: ['drivers'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      sortable: true,
      render: (row) => (
        <Link
          to={`/drivers/${row._id}`}
          className="flex flex-col hover:text-secondary-600"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-medium text-slate-900">
            {row.firstName} {row.lastName}
          </span>
          <span className="text-[11px] text-slate-500">{row.phone}</span>
        </Link>
      ),
    },
    {
      key: 'license',
      header: 'License No.',
      render: (row) => (
        <span className="font-mono text-xs">{row.license?.number}</span>
      ),
    },
    {
      key: 'licenseExpiry',
      header: 'License Expiry',
      render: (row) => {
        const expired = isLicenseExpired(row.license?.expiryDate)
        const expiring = isLicenseExpiringSoon(row.license?.expiryDate)
        return (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              expired ? 'text-red-600 font-medium' : expiring ? 'text-amber-600' : '',
            )}
          >
            {(expired || expiring) && <AlertTriangle size={11} />}
            {formatDate(row.license?.expiryDate)}
          </span>
        )
      },
    },
    {
      key: 'safetyScore',
      header: 'Safety Score',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'font-semibold text-sm',
            row.safetyScore.current >= 80
              ? 'text-emerald-600'
              : row.safetyScore.current >= 60
                ? 'text-amber-600'
                : 'text-red-600',
          )}
        >
          {row.safetyScore.current}/100
        </span>
      ),
    },
    {
      key: 'trips',
      header: 'Trips',
      render: (row) => row.performance?.totalTrips ?? 0,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <PermissionGate permission="UPDATE_DRIVER">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setFormModal({ open: true, driver: row })
              }}
            >
              Edit
            </Button>
          </PermissionGate>
          <PermissionGate permission="DELETE_DRIVER">
            <Button
              variant="ghost"
              size="xs"
              className="text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Remove this driver?')) deleteMutation.mutate(row._id)
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
        title="Driver Roster"
        description="Manage drivers, safety scores and compliance"
        actions={
          <PermissionGate permission="CREATE_DRIVER">
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() => setFormModal({ open: true })}
            >
              Add Driver
            </Button>
          </PermissionGate>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as DriverStatus | '')
            setPage(1)
          }}
          wrapperClassName="min-w-[160px]"
        />
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={licenseExpiring}
            onChange={(e) => setLicenseExpiring(e.target.checked)}
            className="rounded border-slate-300"
          />
          License expiring soon
        </label>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw size={13} />}
          onClick={() => qc.invalidateQueries({ queryKey: ['drivers'] })}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
        <DataTable
          columns={columns}
          data={data?.drivers ?? []}
          keyExtractor={(d) => d._id}
          loading={isLoading}
          error={error ? getErrorMessage(error) : null}
          emptyTitle="No drivers found"
          emptyDescription="Add your first driver to get started."
          emptyAction={
            hasRole('fleet_manager') ? (
              <Button size="sm" onClick={() => setFormModal({ open: true })}>
                Add Driver
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

      <DriverFormModal
        isOpen={formModal.open}
        driver={formModal.driver}
        onClose={() => setFormModal({ open: false })}
      />
    </div>
  )
}
