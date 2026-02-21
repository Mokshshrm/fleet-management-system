import { useQuery } from '@tanstack/react-query'
import {
  Truck,
  Users,
  MapPin,
  Wrench,
  DollarSign,
  AlertTriangle,
  Activity,
  Clock,
} from 'lucide-react'
import { analyticsService } from '@/services'
import { KpiCard, Card, CardHeader, PageHeader } from '@/components/ui'
import { FleetOverviewChart } from './components/FleetOverviewChart'
import { RecentTripsTable } from './components/RecentTripsTable'
import { UpcomingMaintenanceList } from './components/UpcomingMaintenanceList'
import { formatNumber } from '@/utils'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsService.getDashboard,
  })

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'fleet-overview'],
    queryFn: analyticsService.getFleetOverview,
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Command Center"
        description="Real-time fleet operations overview"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Vehicles"
          value={statsLoading ? '—' : formatNumber(stats?.activeVehicles ?? 0)}
          subtitle={`of ${formatNumber(stats?.totalVehicles ?? 0)} total`}
          icon={<Truck size={18} />}
          color="secondary"
          loading={statsLoading}
        />
        <KpiCard
          title="Active Drivers"
          value={statsLoading ? '—' : formatNumber(stats?.activeDrivers ?? 0)}
          subtitle={`of ${formatNumber(stats?.totalDrivers ?? 0)} enrolled`}
          icon={<Users size={18} />}
          color="default"
          loading={statsLoading}
        />
        <KpiCard
          title="Trips In Progress"
          value={statsLoading ? '—' : formatNumber(stats?.tripsInProgress ?? 0)}
          subtitle={`${formatNumber(stats?.tripsToday ?? 0)} dispatched today`}
          icon={<MapPin size={18} />}
          color="success"
          loading={statsLoading}
        />
        <KpiCard
          title="Maintenance Alerts"
          value={statsLoading ? '—' : formatNumber(stats?.maintenanceAlerts ?? 0)}
          subtitle={`${formatNumber(stats?.pendingMaintenance ?? 0)} scheduled`}
          icon={<Wrench size={18} />}
          color={stats?.maintenanceAlerts ? 'warning' : 'default'}
          loading={statsLoading}
        />
        <KpiCard
          title="Utilization Rate"
          value={statsLoading ? '—' : `${formatNumber(stats?.utilizationRate ?? 0, 1)}%`}
          subtitle="Active vs total fleet"
          icon={<Activity size={18} />}
          color="secondary"
          loading={statsLoading}
        />
        <KpiCard
          title="Pending Expenses"
          value={statsLoading ? '—' : formatNumber(stats?.pendingExpenses ?? 0)}
          subtitle="Awaiting approval"
          icon={<DollarSign size={18} />}
          color={stats?.pendingExpenses ? 'warning' : 'default'}
          loading={statsLoading}
        />
        {stats?.monthlyRevenue && (
          <KpiCard
            title="Monthly Revenue"
            value={`$${formatNumber(stats.monthlyRevenue.value / 1000, 1)}K`}
            subtitle={stats.monthlyRevenue.currency}
            icon={<DollarSign size={18} />}
            color="success"
          />
        )}
        {stats?.monthlyExpenses && (
          <KpiCard
            title="Monthly Expenses"
            value={`$${formatNumber(stats.monthlyExpenses.value / 1000, 1)}K`}
            subtitle={stats.monthlyExpenses.currency}
            icon={<AlertTriangle size={18} />}
            color="primary"
          />
        )}
      </div>

      {/* Charts & Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fleet overview chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Fleet Status Overview" description="Vehicle distribution by status" />
            <FleetOverviewChart data={overview} loading={overviewLoading} />
          </Card>
        </div>

        {/* Upcoming maintenance */}
        <div>
          <Card>
            <CardHeader
              title="Upcoming Maintenance"
              description="Next scheduled services"
              action={
                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                  <Clock size={12} />
                  Scheduled
                </span>
              }
            />
            <UpcomingMaintenanceList
              items={overview?.upcomingMaintenance ?? []}
              loading={overviewLoading}
            />
          </Card>
        </div>
      </div>

      {/* Recent trips */}
      <Card>
        <CardHeader title="Recent Trips" description="Latest dispatched & completed trips" />
        <RecentTripsTable trips={overview?.recentTrips ?? []} loading={overviewLoading} />
      </Card>
    </div>
  )
}
