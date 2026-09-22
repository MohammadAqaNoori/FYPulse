import type { MatchBreakdown as MatchBreakdownType } from '@/types'

interface MatchBreakdownProps {
  breakdown: MatchBreakdownType
}

const labels: Record<string, string> = {
  skills_match:     'Skills',
  interest_match:   'Interests',
  technology_match: 'Technologies',
  difficulty_match: 'Difficulty',
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value * 100, 0), 100)
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-border overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

export default function MatchBreakdown({ breakdown }: MatchBreakdownProps) {
  const entries = Object.entries(breakdown).filter(([k]) => k in labels)

  return (
    <div className="space-y-2.5">
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">{labels[key] ?? key}</span>
            <span className="text-slate-300 font-medium">
              {Math.round(value * 100)}%
            </span>
          </div>
          <ProgressBar value={value} />
        </div>
      ))}
    </div>
  )
}
