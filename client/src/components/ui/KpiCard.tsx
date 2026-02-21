import { type ReactNode } from 'react'
import { cn } from '@/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label?: string }
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  loading?: boolean
  className?: string
}

const colorMap = {
  default: 'bg-white border-slate-200',
  primary: 'bg-primary-50 border-primary-200',
  secondary: 'bg-secondary-50 border-secondary-200',
  success: 'bg-emerald-50 border-emerald-200',
  warning: 'bg-amber-50 border-amber-200',
  danger: 'bg-red-50 border-red-200',
}

const iconColorMap = {
  default: 'bg-slate-100 text-slate-600',
  primary: 'bg-primary-100 text-primary-600',
  secondary: 'bg-secondary-100 text-secondary-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'default',
  loading = false,
  className,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-skeleton">
        <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
        <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
        <div className="h-2 bg-slate-200 rounded w-32" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow',
        colorMap[color],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium mt-1.5',
                trend.value >= 0 ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {trend.value >= 0 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {Math.abs(trend.value)}% {trend.label ?? 'vs last period'}
            </span>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              iconColorMap[color],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
