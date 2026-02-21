import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 40,
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className="animate-spin text-primary-600" size={sizeMap[size]} />
      {label && <span className="text-sm text-slate-500">{label}</span>}
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <p className="text-sm text-slate-500 font-medium">Loading FleetFlow…</p>
      </div>
    </div>
  )
}
