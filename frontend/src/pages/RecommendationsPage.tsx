import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { recommendationService } from '../services/recommendationService'
import type { RecommendationItem } from '../types'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { Spinner } from '../components/common/Spinner'

function MatchBar({ value }: { value: number }) {
  const pct = Math.round(value)
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-gray-700">{pct}%</span>
    </div>
  )
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  const pct = Math.round(item.match_percentage ?? item.match_score * 100)
  return (
    <Link to={`/projects/${item.project.id}`}>
      <Card hover className="cursor-pointer">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold text-gray-900">{item.project.title}</h3>
            {item.project.difficulty_level && (
              <Badge
                className="mt-1"
                variant={
                  item.project.difficulty_level === 'hard'
                    ? 'red'
                    : item.project.difficulty_level === 'medium'
                    ? 'yellow'
                    : 'green'
                }
              >
                {item.project.difficulty_level}
              </Badge>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div
              className={`text-2xl font-bold ${
                pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              {pct}%
            </div>
            <div className="text-xs text-gray-400">match</div>
          </div>
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-gray-500">{item.project.description}</p>

        <MatchBar value={pct} />

        {item.match_reasons && item.match_reasons.length > 0 && (
          <div className="mt-3 space-y-1">
            {item.match_reasons.slice(0, 2).map((reason, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                {reason}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1">
          {item.project.technologies.slice(0, 4).map((tech) => (
            <Badge key={tech} variant="gray">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600">
          View project <ArrowRight size={12} />
        </div>
      </Card>
    </Link>
  )
}

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const [topK, setTopK] = useState(10)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['recommendations', topK],
    queryFn: () => recommendationService.getRecommendations(topK),
    retry: false,
  })

  const isProfileError =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 400

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Star size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
            <p className="text-sm text-gray-500">Projects matched to your profile</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input w-auto py-1.5 text-sm"
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            loading={isFetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Scoring projects against your profile…</p>
          </div>
        </div>
      ) : isProfileError ? (
        <EmptyState
          icon={<AlertCircle size={48} />}
          title="Profile required"
          description="You need to complete your profile before we can generate recommendations."
          action={
            <Button onClick={() => navigate('/profile?onboarding=true')} icon={<ArrowRight size={16} />}>
              Complete Profile
            </Button>
          }
        />
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle size={48} />}
          title="Something went wrong"
          description="Failed to load recommendations. Make sure the backend is running."
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : !data?.recommendations?.length ? (
        <EmptyState
          icon={<Sparkles size={48} />}
          title="No recommendations yet"
          description="We couldn't find matching projects. Try updating your profile with more skills."
          action={
            <Button onClick={() => navigate('/profile')} variant="secondary">
              Update Profile
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-5 text-sm text-gray-500">
            Found <span className="font-semibold text-gray-700">{data.total}</span> recommendations
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommendations.map((item, i) => (
              <RecommendationCard key={item.project.id ?? i} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
