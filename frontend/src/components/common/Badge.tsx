import { clsx } from 'clsx'
import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-accent-50 text-accent-700 border border-accent-200',
  blue:    'bg-blue-50 text-blue-700 border border-blue-100',
  green:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  yellow:  'bg-amber-50 text-amber-700 border border-amber-100',
  red:     'bg-red-50 text-red-600 border border-red-100',
  purple:  'bg-purple-50 text-purple-700 border border-purple-100',
  gray:    'bg-gray-50 text-gray-600 border border-gray-100',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
