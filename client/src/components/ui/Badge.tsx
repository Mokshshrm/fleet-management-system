import type { ReactNode } from 'react'
import { cn, humanize } from '@/utils'
import type { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, ExpenseStatus } from '@/types'

// ─── Generic Badge ────────────────────────────────────────────────────────

const BADGE_VARIANT_STYLES: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  secondary: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
}

const BADGE_SIZE_STYLES: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
}

interface GenericBadgeProps {
  variant?: keyof typeof BADGE_VARIANT_STYLES
  size?: keyof typeof BADGE_SIZE_STYLES
  className?: string
  children?: ReactNode
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
}: GenericBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium ring-1 ring-inset rounded-full',
        BADGE_VARIANT_STYLES[variant],
        BADGE_SIZE_STYLES[size],
        className,
      )}
    >
      {children}
    </span>
  )
}

type StatusType = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus | ExpenseStatus | string

const STATUS_COLORS: Record<string, string> = {
  // Vehicle
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  on_trip: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
  in_shop: 'bg-amber-50 text-amber-700 ring-amber-200',
  out_of_service: 'bg-slate-100 text-slate-600 ring-slate-200',
  retired: 'bg-slate-100 text-slate-500 ring-slate-200',

  // Driver
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  on_duty: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  off_duty: 'bg-slate-100 text-slate-600 ring-slate-200',
  on_leave: 'bg-amber-50 text-amber-700 ring-amber-200',
  suspended: 'bg-primary-50 text-primary-700 ring-primary-200',
  terminated: 'bg-red-100 text-red-700 ring-red-200',

  // Trip
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  scheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  dispatched: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',

  // Expense / generic
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',

  // Priority
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  critical: 'bg-red-100 text-red-700 ring-red-200',
}

interface BadgeProps {
  status: StatusType
  label?: string
  className?: string
  dot?: boolean
}

export function StatusBadge({ status, label, className, dot = true }: BadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
  const displayLabel = label ?? humanize(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        colorClass,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            colorClass.split(' ')[1].replace('text-', 'bg-'),
          )}
        />
      )}
      {displayLabel}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical'
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return <StatusBadge status={priority} className={className} />
}
