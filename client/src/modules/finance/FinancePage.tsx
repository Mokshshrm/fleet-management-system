import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Fuel, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { fuelService, expenseService } from '@/services'
import type { FuelLog, Expense, ExpenseCategory, ExpenseStatus } from '@/types'
import {
  PageHeader,
  Button,
  Select,
  DataTable,
  StatusBadge,
  KpiCard,
  type Column,
} from '@/components/ui'
import { useAuthStore } from '@/store'
import { formatDate, formatCurrency, getErrorMessage, humanize } from '@/utils'
import { FuelLogFormModal } from './components/FuelLogFormModal'
import { ExpenseFormModal } from './components/ExpenseFormModal'
import { ExpenseActionsModal } from './components/ExpenseActionsModal'

type ActiveTab = 'fuel' | 'expenses'

const expenseStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const expenseCategoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'toll', label: 'Toll' },
  { value: 'parking', label: 'Parking' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'registration', label: 'Registration' },
  { value: 'other', label: 'Other' },
]

export default function FinancePage() {
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()

  const [tab, setTab] = useState<ActiveTab>('fuel')
  const [fuelPage, setFuelPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatus | ''>('')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | ''>('')
  const [fuelModal, setFuelModal] = useState<{ open: boolean; log?: FuelLog }>({ open: false })
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense?: Expense }>({ open: false })
  const [expenseActionsModal, setExpenseActionsModal] = useState<{ open: boolean; expense?: Expense }>({ open: false })

  // Fuel
  const { data: fuelData, isLoading: fuelLoading, error: fuelError } = useQuery({
    queryKey: ['fuel', fuelPage],
    queryFn: () => fuelService.getAll({ page: fuelPage, limit: 15 }),
    enabled: tab === 'fuel',
  })

  // Expenses
  const { data: expenseData, isLoading: expenseLoading, error: expenseError } = useQuery({
    queryKey: ['expenses', expensePage, expenseStatus, expenseCategory],
    queryFn: () =>
      expenseService.getAll({
        page: expensePage,
        limit: 15,
        status: (expenseStatus as ExpenseStatus) || undefined,
        category: (expenseCategory as ExpenseCategory) || undefined,
      }),
    enabled: tab === 'expenses',
  })

  const { data: expenseStats } = useQuery({
    queryKey: ['expense-stats'],
    queryFn: () => expenseService.getStats(),
  })

  const deleteFuelMutation = useMutation({
    mutationFn: (id: string) => fuelService.delete(id),
    onSuccess: () => { toast.success('Fuel log deleted'); qc.invalidateQueries({ queryKey: ['fuel'] }) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const fuelColumns: Column<FuelLog>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    {
      key: 'vehicleId',
      header: 'Vehicle',
      render: (row) =>
        typeof row.vehicleId === 'object'
          ? (row.vehicleId as any).licensePlate
          : row.vehicleId,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => `${row.quantity?.value} ${row.quantity?.unit ?? 'L'}`,
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (row) => formatCurrency(row.cost?.total ?? 0, row.cost?.currency ?? 'USD'),
    },
    {
      key: 'fuelEfficiency',
      header: 'Efficiency',
      render: (row) =>
        row.fuelEfficiency?.value
          ? `${row.fuelEfficiency.value.toFixed(2)} km/L`
          : '—',
    },
    {
      key: 'stationName',
      header: 'Station',
      render: (row) => row.station?.name || '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (row) => (
        <div className="flex gap-1">
          {hasRole('fleet_manager') && (
            <Button
              variant="ghost" size="xs"
              onClick={(e) => { e.stopPropagation(); setFuelModal({ open: true, log: row }) }}
            >
              Edit
            </Button>
          )}
          {hasRole('admin') && (
            <Button
              variant="ghost" size="xs" className="text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Delete this fuel log?')) deleteFuelMutation.mutate(row._id)
              }}
            >
              Del
            </Button>
          )}
        </div>
      ),
    },
  ]

  const expenseColumns: Column<Expense>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => humanize(row.category),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className="truncate max-w-[180px] block text-sm">{row.description}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-medium">
          {formatCurrency(row.amount ?? 0, row.currency ?? 'USD')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.approvalStatus ?? 'pending'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (row) => (
        <div className="flex gap-1">
          {hasRole('financial_analyst') && row.approvalStatus === 'pending' && (
            <Button
              variant="ghost" size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setExpenseActionsModal({ open: true, expense: row })
              }}
            >
              Review
            </Button>
          )}
          {hasRole('fleet_manager') && row.approvalStatus === 'pending' && (
            <Button
              variant="ghost" size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setExpenseModal({ open: true, expense: row })
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
        title="Finance"
        description="Track fuel consumption and operational expenses"
        actions={
          <div className="flex gap-2">
            {tab === 'fuel' && hasRole('fleet_manager') && (
              <Button leftIcon={<Plus size={14} />} onClick={() => setFuelModal({ open: true })}>
                Log Fuel
              </Button>
            )}
            {tab === 'expenses' && hasRole('fleet_manager') && (
              <Button leftIcon={<Plus size={14} />} onClick={() => setExpenseModal({ open: true })}>
                Add Expense
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      {expenseStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Expenses" value={formatCurrency(expenseStats.totalAmount ?? 0)} color="primary" icon={<DollarSign size={18} />} />
          <KpiCard title="Pending Review" value={expenseStats.pending ?? 0} color="warning" icon={<DollarSign size={18} />} />
          <KpiCard title="Approved" value={expenseStats.approved ?? 0} color="success" icon={<DollarSign size={18} />} />
          <KpiCard title="Fuel Costs" value={formatCurrency(expenseStats.byCategory?.fuel ?? 0)} color="secondary" icon={<Fuel size={18} />} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden w-fit shadow-sm">
        {(['fuel', 'expenses'] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t === 'fuel' ? 'Fuel Logs' : 'Expenses'}
          </button>
        ))}
      </div>

      {/* Fuel Tab */}
      {tab === 'fuel' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="ghost" size="sm"
              leftIcon={<RefreshCw size={13} />}
              onClick={() => qc.invalidateQueries({ queryKey: ['fuel'] })}
            >
              Refresh
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
            <DataTable
              columns={fuelColumns}
              data={fuelData?.fuelLogs ?? []}
              keyExtractor={(f) => f._id}
              loading={fuelLoading}
              error={fuelError ? getErrorMessage(fuelError) : null}
              emptyTitle="No fuel logs"
              emptyDescription="Log your first fuel fill-up."
              emptyAction={
                hasRole('fleet_manager') ? (
                  <Button size="sm" onClick={() => setFuelModal({ open: true })}>Log Fuel</Button>
                ) : undefined
              }
              pagination={
                fuelData?.pagination
                  ? { page: fuelData.pagination.page, pages: fuelData.pagination.pages, total: fuelData.pagination.total, limit: fuelData.pagination.limit, onPageChange: setFuelPage }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              options={expenseStatusOptions}
              value={expenseStatus}
              onChange={(e) => { setExpenseStatus(e.target.value as ExpenseStatus | ''); setExpensePage(1) }}
              wrapperClassName="min-w-[150px]"
            />
            <Select
              options={expenseCategoryOptions}
              value={expenseCategory}
              onChange={(e) => { setExpenseCategory(e.target.value as ExpenseCategory | ''); setExpensePage(1) }}
              wrapperClassName="min-w-[160px]"
            />
            <Button
              variant="ghost" size="sm"
              leftIcon={<RefreshCw size={13} />}
              onClick={() => qc.invalidateQueries({ queryKey: ['expenses'] })}
            >
              Refresh
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
            <DataTable
              columns={expenseColumns}
              data={expenseData?.expenses ?? []}
              keyExtractor={(e) => e._id}
              loading={expenseLoading}
              error={expenseError ? getErrorMessage(expenseError) : null}
              emptyTitle="No expenses"
              emptyDescription="No expense records found."
              emptyAction={
                hasRole('fleet_manager') ? (
                  <Button size="sm" onClick={() => setExpenseModal({ open: true })}>Add Expense</Button>
                ) : undefined
              }
              pagination={
                expenseData?.pagination
                  ? { page: expenseData.pagination.page, pages: expenseData.pagination.pages, total: expenseData.pagination.total, limit: expenseData.pagination.limit, onPageChange: setExpensePage }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      <FuelLogFormModal
        isOpen={fuelModal.open}
        log={fuelModal.log}
        onClose={() => setFuelModal({ open: false })}
      />
      <ExpenseFormModal
        isOpen={expenseModal.open}
        expense={expenseModal.expense}
        onClose={() => setExpenseModal({ open: false })}
      />
      <ExpenseActionsModal
        isOpen={expenseActionsModal.open}
        expense={expenseActionsModal.expense}
        onClose={() => setExpenseActionsModal({ open: false })}
      />
    </div>
  )
}
