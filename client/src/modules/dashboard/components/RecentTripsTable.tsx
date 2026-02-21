import type { Trip } from '@/types'
import { StatusBadge } from '@/components/ui'
import { formatDate } from '@/utils'
import { SkeletonTable } from '@/components/ui'

interface Props {
  trips: Trip[]
  loading?: boolean
}

export function RecentTripsTable({ trips, loading }: Props) {
  if (loading) return <SkeletonTable rows={5} cols={5} />

  if (!trips.length) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">No recent trips</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {['Origin', 'Destination', 'Scheduled', 'Status'].map((h) => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 px-2 py-2 first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trips.slice(0, 8).map((trip) => (
            <tr key={trip._id} className="border-b border-slate-100 last:border-0">
              <td className="px-2 py-2 first:pl-0 text-slate-700 font-medium truncate max-w-[120px]">
                {trip.origin.address}
              </td>
              <td className="px-2 py-2 text-slate-600 truncate max-w-[120px]">
                {trip.destination.address}
              </td>
              <td className="px-2 py-2 text-slate-500 text-xs">
                {formatDate(trip.schedule?.plannedDepartureTime)}
              </td>
              <td className="px-2 py-2">
                <StatusBadge status={trip.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
