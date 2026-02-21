import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      wrapperClassName,
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
            {label}
            {rest.required && <span className="text-primary-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex">
          {leftAddon && (
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full px-3 py-2 text-sm text-slate-900',
              'border border-slate-300 bg-white placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:border-secondary-400',
              'transition-colors duration-150',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              leftAddon ? 'rounded-r-lg' : rightAddon ? 'rounded-l-lg' : 'rounded-lg',
              error && 'border-red-400 focus:ring-red-400 focus:border-red-400',
              className,
            )}
            {...rest}
          />
          {rightAddon && (
            <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-xs">
              {rightAddon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
