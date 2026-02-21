import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Wrench,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useAuthStore, useUiStore } from '@/store'
import { cn } from '@/utils'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  minRole?: UserRole
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Vehicles',
    href: '/vehicles',
    icon: <Truck size={18} />,
  },
  {
    label: 'Trips',
    href: '/trips',
    icon: <MapPin size={18} />,
  },
  {
    label: 'Drivers',
    href: '/drivers',
    icon: <Users size={18} />,
  },
  {
    label: 'Maintenance',
    href: '/maintenance',
    icon: <Wrench size={18} />,
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: <DollarSign size={18} />,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 size={18} />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={18} />,
    minRole: 'admin',
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { hasRole } = useAuthStore()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.minRole) return hasRole(item.minRole)
    if (item.roles) return item.roles.some((r) => hasRole(r))
    return true
  })

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-slate-900 text-slate-100 transition-all duration-200 flex-shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-4 border-b border-slate-700 h-14',
          sidebarCollapsed && 'justify-center px-2',
        )}
      >
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-bold tracking-wide text-white">FleetFlow</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium',
                    'transition-colors duration-100',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                    sidebarCollapsed && 'justify-center',
                  )
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 z-10"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
