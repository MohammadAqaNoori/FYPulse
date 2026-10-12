import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
}

export function Card({ children, className, hover = false, glow = false }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-navy-600 bg-navy-800 p-6',
        hover && 'transition-all hover:border-accent-500/50 hover:shadow-glow cursor-pointer',
        glow && 'border-accent-500/30 shadow-glow',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 border-b border-navy-600 pb-4', className)}>{children}</div>
  )
}
