import { useNavigate } from 'react-router-dom'
import { LogOut, User, Bell } from 'lucide-react'
import { useAuthStore } from '@/store'
import { authService } from '@/services'
import { getInitials, humanize } from '@/utils'
import toast from 'react-hot-toast'

export function TopBar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
      toast.success('Logged out successfully')
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-5 bg-white border-b border-slate-200 flex-shrink-0">
      {/* Left – breadcrumb can go here */}
      <div />

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Notification bell placeholder */}
        <button className="relative p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={18} />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user ? getInitials(user.firstName, user.lastName) : '?'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight capitalize">
              {user ? humanize(user.role) : ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
