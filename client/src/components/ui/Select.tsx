import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  wrapperClassName?: string
  options: { value: string; label: string; disabled?: boolean }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      placeholder,
      wrapperClassName,
      className,
      options,
      id,
      ...rest
    },
    ref,
  ) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-slate-700">
            {label}
            {rest.required && <span className="text-primary-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full px-3 py-2 pr-8 text-sm text-slate-900 appearance-none',
              'border border-slate-300 bg-white rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:border-secondary-400',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              'transition-colors duration-150',
              error && 'border-red-400 focus:ring-red-400',
              className,
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={14}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
