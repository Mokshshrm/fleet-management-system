import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { FleetOverview } from '@/types'
import { humanize } from '@/utils'
import { Skeleton } from '@/components/ui'

const STATUS_COLORS: Record<string, string> = {
  available: '#10b981',
  on_trip: '#0ea5e9',
  in_shop: '#f59e0b',
  out_of_service: '#94a3b8',
  retired: '#64748b',
}

interface Props {
  data?: FleetOverview
  loading?: boolean
}

export function FleetOverviewChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!data) return null

  const chartData = Object.entries(data.vehiclesByStatus ?? {}).map(([key, value]) => ({
    name: humanize(key),
    value,
    color: STATUS_COLORS[key] ?? '#94a3b8',
  }))

  if (!chartData.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        No vehicle data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 11, color: '#475569' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
