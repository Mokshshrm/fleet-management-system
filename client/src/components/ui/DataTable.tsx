import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/utils'
import { SkeletonTable } from './Skeleton'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  headerClassName?: string
  render?: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  onRowClick?: (row: T) => void
  pagination?: {
    page: number
    pages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
  }
  stickyHeader?: boolean
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display.',
  emptyAction,
  onRowClick,
  pagination,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = (a as Record<string, unknown>)[sortKey]
    const bVal = (b as Record<string, unknown>)[sortKey]
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1
    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
    return sortDir === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return <SkeletonTable rows={6} cols={columns.length} />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-red-600">Failed to load data</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <ChevronsUpDown className="text-slate-400" size={20} />
        </div>
        <p className="text-sm font-medium text-slate-700">{emptyTitle}</p>
        <p className="text-xs text-slate-500 mt-1">{emptyDescription}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto -mx-px">
        <table className="w-full text-sm">
          <thead
            className={cn(
              'bg-slate-50',
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 text-left text-xs font-semibold text-slate-600 border-b border-slate-200',
                    'first:pl-4 last:pr-4',
                    col.sortable && 'cursor-pointer select-none hover:bg-slate-100',
                    col.headerClassName,
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )
                        ) : (
                          <ChevronsUpDown size={12} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIdx) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'border-b border-slate-100 last:border-0',
                  'hover:bg-slate-50 transition-colors',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2.5 text-slate-700 first:pl-4 last:pr-4',
                      col.className,
                    )}
                  >
                    {col.render
                      ? col.render(row, rowIdx)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const pg = i + 1
              return (
                <button
                  key={pg}
                  onClick={() => pagination.onPageChange(pg)}
                  className={cn(
                    'px-2.5 py-1.5 text-xs border rounded-lg transition-colors',
                    pg === pagination.page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  {pg}
                </button>
              )
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
