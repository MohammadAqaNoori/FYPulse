import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import MatchBreakdown from './MatchBreakdown'
import type { Recommendation } from '@/types'

interface RecommendationCardProps {
  recommendation: Recommendation
  rank: number
}

export default function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { project, match_score, match_breakdown } = recommendation
  const pct = Math.round(match_score * 100)

  const scoreColor =
    pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'
  const ringColor =
    pct >= 70 ? 'ring-emerald-500/30' : pct >= 40 ? 'ring-amber-500/30' : 'ring-red-500/30'

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ${ringColor} bg-surface font-bold text-sm ${scoreColor}`}
        >
          #{rank}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Link
            to={`/projects/${project.id}`}
            className="font-semibold text-slate-100 text-sm hover:text-primary-300 transition-colors line-clamp-2"
          >
            {project.title}
          </Link>
          {project.description && (
            <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {project.technologies.slice(0, 3).map((t) => (
              <Badge key={t} variant="primary" size="sm">{t}</Badge>
            ))}
          </div>
        </div>

        {/* Match score */}
        <div className="shrink-0 text-right">
          <span className={`text-2xl font-bold ${scoreColor}`}>{pct}%</span>
          <p className="text-xs text-slate-500">match</p>
        </div>
      </div>

      {/* Breakdown toggle */}
      {match_breakdown && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            aria-expanded={expanded}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {expanded ? 'Hide' : 'Show'} match breakdown
          </button>

          {expanded && (
            <div className="pt-1 animate-fade-in">
              <MatchBreakdown breakdown={match_breakdown} />
            </div>
          )}
        </>
      )}
    </Card>
  )
}
