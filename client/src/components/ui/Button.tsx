import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border-transparent',
  secondary:
    'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-400 border-transparent',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300 border-transparent',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border-transparent',
  outline:
    'bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300 border-slate-300',
}

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1.5 text-xs gap-1',
  sm: 'px-3 py-2 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg border',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
