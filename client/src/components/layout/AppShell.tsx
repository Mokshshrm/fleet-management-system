import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUiStore } from '@/store'
import { cn } from '@/utils'

export default function AppShell() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-200',
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-screen-2xl mx-auto px-5 py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
