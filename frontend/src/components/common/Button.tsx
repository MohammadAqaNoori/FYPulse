import { clsx } from 'clsx'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-400 text-navy-900 font-semibold hover:bg-accent-300 focus-visible:ring-accent-400 disabled:bg-accent-700 disabled:text-navy-600 shadow-glow',
  secondary:
    'bg-navy-700 text-gray-200 border border-navy-500 hover:bg-navy-600 hover:text-white focus-visible:ring-navy-400',
  outline:
    'bg-transparent text-accent-400 border border-accent-400 hover:bg-accent-400/10 focus-visible:ring-accent-400',
  ghost:
    'bg-transparent text-gray-400 hover:bg-navy-700 hover:text-white focus-visible:ring-navy-400',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg',
        'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
}
