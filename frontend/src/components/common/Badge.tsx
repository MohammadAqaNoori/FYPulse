import { clsx } from 'clsx'
import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-brand-100 text-brand-700',
  blue:    'bg-blue-100 text-blue-700',
  green:   'bg-emerald-100 text-emerald-700',
  yellow:  'bg-amber-100 text-amber-700',
  red:     'bg-red-100 text-red-700',
  purple:  'bg-purple-100 text-purple-700',
  gray:    'bg-gray-100 text-gray-600',
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
