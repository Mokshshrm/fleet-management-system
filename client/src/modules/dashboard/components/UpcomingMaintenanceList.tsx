import type { MaintenanceLog } from '@/types'
import { StatusBadge, PriorityBadge } from '@/components/ui'
import { formatDate } from '@/utils'
import { Skeleton } from '@/components/ui'
import { Wrench } from 'lucide-react'

interface Props {
  items: MaintenanceLog[]
  loading?: boolean
}

export function UpcomingMaintenanceList({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">
        No upcoming maintenance
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {items.slice(0, 6).map((item) => (
        <li key={item._id} className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Wrench size={14} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{item.maintenanceNumber ?? item.description?.substring(0, 40)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-500">
                {formatDate(item.schedule?.scheduledDate)}
              </span>
              <PriorityBadge priority={item.priority} />
            </div>
          </div>
          <StatusBadge status={item.status} dot={false} className="text-[10px]" />
        </li>
      ))}
    </ul>
  )
}
