import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-100 bg-white p-6 shadow-card',
        hover && 'transition-all duration-200 hover:shadow-card-hover hover:border-gray-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('mb-4 border-b border-gray-100 pb-4', className)}>{children}</div>
}
