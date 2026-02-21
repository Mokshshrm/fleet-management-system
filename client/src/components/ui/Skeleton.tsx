import { cn } from '@/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-slate-200 rounded animate-skeleton',
        className,
      )}
    />
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-slate-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={cn('h-4 flex-1', colIdx === 0 && 'w-1/3 flex-none')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-2 w-4/5" />
    </div>
  )
}

export function SkeletonKPI() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-2 w-32" />
    </div>
  )
}
