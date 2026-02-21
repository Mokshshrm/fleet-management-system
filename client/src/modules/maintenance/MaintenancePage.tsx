import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import { maintenanceService } from '@/services'
import type { MaintenanceLog, MaintenanceStatus, MaintenanceType } from '@/types'
import {
  PageHeader,
  Button,
  Select,
  DataTable,
  StatusBadge,
  PriorityBadge,
  KpiCard,
  type Column,
} from '@/components/ui'
import { useAuthStore } from '@/store'
import { formatDate, formatCurrency, getErrorMessage, humanize } from '@/utils'
import { MaintenanceFormModal } from './components/MaintenanceFormModal'
import { MaintenanceActionsModal } from './components/MaintenanceActionsModal'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'preventive', label: 'Preventive' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'recall', label: 'Recall' },
]

export default function MaintenancePage() {
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | ''>('')
  const [formModal, setFormModal] = useState<{ open: boolean; log?: MaintenanceLog }>({ open: false })
  const [actionsModal, setActionsModal] = useState<{ open: boolean; log?: MaintenanceLog }>({ open: false })

  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance', page, statusFilter, typeFilter],
    queryFn: () =>
      maintenanceService.getAll({
        page,
        limit: 15,
        status: statusFilter as MaintenanceStatus || undefined,
        type: typeFilter as MaintenanceType || undefined,
      }),
  })

  const { data: stats } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: () => maintenanceService.getStats(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      maintenanceService.update(id, { status: 'cancelled' as MaintenanceStatus }),
    onSuccess: () => {
      toast.success('Maintenance record cancelled')
      qc.invalidateQueries({ queryKey: ['maintenance'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const columns: Column<MaintenanceLog>[] = [
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 text-sm">{row.maintenanceNumber ?? row.description?.substring(0, 40)}</p>
          <p className="text-xs text-slate-500">{humanize(row.type)}</p>
        </div>
      ),
    },
    {
      key: 'vehicleId',
      header: 'Vehicle',
      render: (row) =>
        typeof row.vehicleId === 'object' ? (
          <span className="text-sm text-slate-700 font-mono">
            {(row.vehicleId as any).licensePlate ?? '—'}
          </span>
        ) : (
          <span className="text-xs text-slate-400">{row.vehicleId}</span>
        ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: 'schedule',
      header: 'Scheduled',
      sortable: true,
      render: (row) => formatDate(row.schedule?.scheduledDate),
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (row) =>
        row.cost?.total != null
          ? formatCurrency(row.cost.total, row.cost.currency ?? 'USD')
          : '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (row) => (
        <div className="flex items-center gap-1">
          {hasRole('fleet_manager') && row.status !== 'completed' && row.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setActionsModal({ open: true, log: row })
              }}
            >
              Actions
            </Button>
          )}
          {hasRole('fleet_manager') && (
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setFormModal({ open: true, log: row })
              }}
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance"
        description="Schedule and track vehicle maintenance"
        actions={
          hasRole('fleet_manager') ? (
            <Button leftIcon={<Plus size={14} />} onClick={() => setFormModal({ open: true })}>
              Schedule Maintenance
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Scheduled" value={stats.scheduled} color="primary" icon={<Wrench size={18} />} />
          <KpiCard title="In Progress" value={stats.in_progress} color="warning" icon={<Wrench size={18} />} />
          <KpiCard title="Completed" value={stats.completed} color="success" icon={<Wrench size={18} />} />
          <KpiCard
            title="Total Cost"
            value={formatCurrency(stats.totalCost ?? 0)}
            color="secondary"
            icon={<Wrench size={18} />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as MaintenanceStatus | ''); setPage(1) }}
          wrapperClassName="min-w-[150px]"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as MaintenanceType | ''); setPage(1) }}
          wrapperClassName="min-w-[150px]"
        />
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw size={13} />}
          onClick={() => qc.invalidateQueries({ queryKey: ['maintenance'] })}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
        <DataTable
          columns={columns}
          data={data?.maintenanceLogs ?? []}
          keyExtractor={(m) => m._id}
          loading={isLoading}
          error={error ? getErrorMessage(error) : null}
          emptyTitle="No maintenance records"
          emptyDescription="Schedule your first maintenance record."
          emptyAction={
            hasRole('fleet_manager') ? (
              <Button size="sm" onClick={() => setFormModal({ open: true })}>
                Schedule Maintenance
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

      <MaintenanceFormModal
        isOpen={formModal.open}
        log={formModal.log}
        onClose={() => setFormModal({ open: false })}
      />
      <MaintenanceActionsModal
        isOpen={actionsModal.open}
        log={actionsModal.log}
        onClose={() => setActionsModal({ open: false })}
      />
    </div>
  )
}
