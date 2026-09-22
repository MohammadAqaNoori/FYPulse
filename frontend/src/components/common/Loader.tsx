interface LoaderProps {
  /** Center in its container */
  center?: boolean
  /** Full-page overlay */
  fullPage?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-9 w-9 border-[3px]',
  lg: 'h-14 w-14 border-4',
}

export default function Loader({
  center = false,
  fullPage = false,
  size = 'md',
  label,
}: LoaderProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={[
          'rounded-full border-primary-600 border-t-transparent animate-spin',
          sizeClasses[size],
        ].join(' ')}
        role="status"
        aria-label={label ?? 'Loading'}
      />
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  if (center) {
    return (
      <div className="flex items-center justify-center py-16">{spinner}</div>
    )
  }

  return spinner
}
