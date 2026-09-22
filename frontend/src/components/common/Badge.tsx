import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-surface-border text-slate-300',
  primary:  'bg-primary-900/60 text-primary-300 border border-primary-700/50',
  success:  'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  warning:  'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  danger:   'bg-red-900/60 text-red-300 border border-red-700/50',
  info:     'bg-sky-900/60 text-sky-300 border border-sky-700/50',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
