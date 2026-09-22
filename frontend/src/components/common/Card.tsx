import { type ReactNode, type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Extra padding variant */
  padding?: 'sm' | 'md' | 'lg'
  /** Hover lift effect */
  hoverable?: boolean
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        'bg-surface-card border border-surface-border rounded-2xl',
        paddingClasses[padding],
        hoverable
          ? 'transition-all duration-200 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-900/20 cursor-pointer'
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
