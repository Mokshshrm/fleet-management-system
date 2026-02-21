import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { analyticsService } from '@/services'
import { PageHeader, Button, KpiCard, Card } from '@/components/ui'
import { formatCurrency, formatNumber, downloadCSV } from '@/utils'
import { Download, TrendingUp, Truck, Users, Fuel } from 'lucide-react'

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

function DateRangePicker({
  start,
  end,
  onChange,
}: {
  start: string
  end: string
  onChange: (s: string, e: string) => void
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="date"
        value={start}
        onChange={(ev) => onChange(ev.target.value, end)}
        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      <span className="text-slate-400">to</span>
      <input
        type="date"
        value={end}
        onChange={(ev) => onChange(start, ev.target.value)}
        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
    </div>
  )
}

const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const defaultEnd = new Date().toISOString().split('T')[0]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd })

  const { data: dashboard } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: analyticsService.getDashboard,
  })

  const { data: fleetOverview } = useQuery({
    queryKey: ['analytics-fleet-overview'],
    queryFn: analyticsService.getFleetOverview,
  })

  const { data: fuelEfficiency, isLoading: fuelLoading } = useQuery({
    queryKey: ['analytics-fuel', dateRange.start, dateRange.end],
    queryFn: () => analyticsService.getFuelEfficiency(dateRange.start, dateRange.end),
  })

  const { data: tripReport, isLoading: tripsLoading } = useQuery({
    queryKey: ['analytics-trips', dateRange.start, dateRange.end],
    queryFn: () => analyticsService.getTripReport({ startDate: dateRange.start, endDate: dateRange.end }),
  })

  const { data: financialReport, isLoading: finLoading } = useQuery({
    queryKey: ['analytics-financial', dateRange.start, dateRange.end],
    queryFn: () => analyticsService.getFinancialReport(dateRange.start, dateRange.end),
  })

  const { data: driverPerformance } = useQuery({
    queryKey: ['analytics-driver-performance'],
    queryFn: analyticsService.getDriverPerformance,
  })

  const { data: maintenanceCosts } = useQuery({
    queryKey: ['analytics-maintenance-costs', dateRange.start, dateRange.end],
    queryFn: () => analyticsService.getMaintenanceCosts({ startDate: dateRange.start, endDate: dateRange.end }),
  })

  const fleetPieData = fleetOverview
    ? Object.entries(fleetOverview).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value: typeof value === 'number' ? value : 0,
      })).filter((d) => d.value > 0)
    : []

  const handleExportTrips = () => {
    if (!tripReport?.trips) return
    downloadCSV(tripReport.trips, 'trip-report')
  }

  const handleExportFinancial = () => {
    if (!financialReport) return
    downloadCSV(
      Array.isArray(financialReport) ? financialReport : [financialReport],
      'financial-report',
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Fleet performance, costs and operational insights"
      />

      {/* Date Range Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-600 font-medium">Date Range:</span>
        <DateRangePicker
          start={dateRange.start}
          end={dateRange.end}
          onChange={(s, e) => setDateRange({ start: s, end: e })}
        />
      </div>

      {/* KPI Row */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Vehicles"
            value={dashboard.totalVehicles ?? 0}
            color="primary"
            icon={<Truck size={18} />}
          />
          <KpiCard
            title="Active Trips"
            value={dashboard.tripsInProgress ?? 0}
            color="secondary"
            icon={<TrendingUp size={18} />}
          />
          <KpiCard
            title="Active Drivers"
            value={dashboard.activeDrivers ?? 0}
            color="success"
            icon={<Users size={18} />}
          />
          <KpiCard
            title="Monthly Expenses"
            value={formatCurrency(dashboard.monthlyExpenses?.value ?? 0, dashboard.monthlyExpenses?.currency)}
            color="warning"
            icon={<Fuel size={18} />}
          />
        </div>
      )}

      {/* Row 1: Fleet Status + Driver Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Fleet Status Pie */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Fleet Status Distribution</h3>
          {fleetPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={fleetPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {fleetPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              No fleet data available
            </div>
          )}
        </Card>

        {/* Driver Safety Scores */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Driver Safety Scores</h3>
          {driverPerformance?.drivers?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={driverPerformance.drivers.slice(0, 8)}
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v: string) => v.split(' ')[0]}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="safetyScore" fill="#0ea5e9" radius={[3, 3, 0, 0]} name="Safety Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              No performance data
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: Fuel Efficiency Trend */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Fuel Efficiency Trend (km/L)</h3>
          <Button variant="ghost" size="xs" leftIcon={<Download size={12} />}>
            Export
          </Button>
        </div>
        {fuelLoading ? (
          <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : fuelEfficiency?.trend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={fuelEfficiency.trend}>
              <defs>
                <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke="#0ea5e9"
                fill="url(#effGrad)"
                strokeWidth={2}
                name="km/L"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
            No fuel efficiency data for range
          </div>
        )}
      </Card>

      {/* Row 3: Trip Report + Maintenance Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trip Report */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Trips by Status</h3>
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<Download size={12} />}
              onClick={handleExportTrips}
              disabled={!tripReport}
            >
              Export CSV
            </Button>
          </div>
          {tripsLoading ? (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : tripReport?.byStatus ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(tripReport.byStatus).map(([name, count]) => ({ name, count }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f43f5e" radius={[3, 3, 0, 0]} name="Trips" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              No trip data for range
            </div>
          )}
        </Card>

        {/* Maintenance Costs */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Maintenance Costs</h3>
          {maintenanceCosts?.byType ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(maintenanceCosts.byType).map(([name, value]) => ({ name, value }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              No maintenance cost data
            </div>
          )}
        </Card>
      </div>

      {/* Row 4: Financial Report */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Financial Overview</h3>
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<Download size={12} />}
            onClick={handleExportFinancial}
            disabled={!financialReport}
          >
            Export CSV
          </Button>
        </div>
        {finLoading ? (
          <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : financialReport?.monthly?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={financialReport.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
            No financial data for selected range
          </div>
        )}
      </Card>
    </div>
  )
}
