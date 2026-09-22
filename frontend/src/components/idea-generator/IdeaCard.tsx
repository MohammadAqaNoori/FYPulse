import { useState } from 'react'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import type { GeneratedIdea } from '@/types'

interface IdeaCardProps {
  idea: GeneratedIdea
  index: number
}

export default function IdeaCard({ idea, index }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const noveltyPct = Math.round(idea.novelty_score * 100)

  const noveltyVariant =
    noveltyPct >= 70 ? 'success' : noveltyPct >= 40 ? 'warning' : 'danger'

  return (
    <Card className="space-y-3 animate-slide-up" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-900/60 text-primary-400 text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <h3 className="font-semibold text-slate-100 text-sm leading-snug">
              {idea.title}
            </h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {idea.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <Badge variant={noveltyVariant} size="sm">
            {noveltyPct}% novel
          </Badge>
        </div>
      </div>

      {/* Tech stack */}
      {idea.suggested_tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {idea.suggested_tech_stack.map((t) => (
            <Badge key={t} variant="primary" size="sm">{t}</Badge>
          ))}
        </div>
      )}

      {/* Domains */}
      {idea.domains.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {idea.domains.map((d) => (
            <Badge key={d} variant="info" size="sm">{d}</Badge>
          ))}
        </div>
      )}

      {/* Rationale toggle */}
      {idea.rationale && (
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
            {expanded ? 'Hide' : 'Show'} why this idea was suggested
          </button>
          {expanded && (
            <p className="text-xs text-slate-300 bg-surface rounded-xl px-3 py-2 leading-relaxed animate-fade-in">
              {idea.rationale}
            </p>
          )}
        </>
      )}
    </Card>
  )
}
