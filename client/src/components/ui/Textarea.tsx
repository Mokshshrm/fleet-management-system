import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, wrapperClassName, className, id, ...rest }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
            {label}
            {rest.required && <span className="text-primary-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'block w-full px-3 py-2 text-sm text-slate-900',
            'border border-slate-300 bg-white placeholder:text-slate-400 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:border-secondary-400',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            'resize-y transition-colors duration-150',
            error && 'border-red-400 focus:ring-red-400',
            className,
          )}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
