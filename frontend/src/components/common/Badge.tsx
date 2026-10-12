import { clsx } from 'clsx'
import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-accent-400/15 text-accent-300 border border-accent-400/20',
  blue:    'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  green:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  yellow:  'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  red:     'bg-red-500/15 text-red-300 border border-red-500/20',
  purple:  'bg-purple-500/15 text-purple-300 border border-purple-500/20',
  gray:    'bg-navy-600/80 text-gray-400 border border-navy-500',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
