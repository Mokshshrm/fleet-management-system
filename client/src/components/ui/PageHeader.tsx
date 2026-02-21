import { type ReactNode } from 'react'
import { cn } from '@/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200',
        className,
      )}
    >
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1 mb-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-400">/</span>}
                <span
                  className={cn(
                    'text-xs',
                    i < breadcrumbs.length - 1
                      ? 'text-slate-500 hover:text-slate-700 cursor-pointer'
                      : 'text-slate-700 font-medium',
                  )}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  )
}
