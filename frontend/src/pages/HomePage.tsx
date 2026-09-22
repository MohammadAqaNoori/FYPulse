import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchProfile } from '@/store/slices/profileSlice'
import { fetchRecommendations } from '@/store/slices/recommendationSlice'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Loader from '@/components/common/Loader'

const statCards = [
  {
    label: 'Recommendations',
    icon: '💡',
    to: '/recommendations',
    color: 'text-primary-400',
    bg: 'bg-primary-900/30',
  },
  {
    label: 'Search Projects',
    icon: '🔍',
    to: '/search',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30',
  },
  {
    label: 'Idea Generator',
    icon: '⚡',
    to: '/generate',
    color: 'text-amber-400',
    bg: 'bg-amber-900/30',
  },
  {
    label: 'My Profile',
    icon: '👤',
    to: '/profile',
    color: 'text-sky-400',
    bg: 'bg-sky-900/30',
  },
]

export default function HomePage() {
  const dispatch   = useAppDispatch()
  const { user }   = useAuth()
  const { profile, isLoading: profileLoading } = useAppSelector((s) => s.profile)
  const { recommendations, isLoading: recLoading } = useAppSelector((s) => s.recommendations)

  useEffect(() => {
    dispatch(fetchProfile())
    dispatch(fetchRecommendations(5))
  }, [dispatch])

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hey, {firstName} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Here&apos;s what&apos;s waiting for you today.
        </p>
      </div>

      {/* Profile incomplete banner */}
      {!profileLoading && !profile && (
        <div className="rounded-2xl border border-amber-700/50 bg-amber-900/20 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-amber-300 font-medium text-sm">Complete your profile</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Add your skills and interests to unlock personalised recommendations.
            </p>
          </div>
          <Link to="/profile" className="btn-primary shrink-0 text-sm px-4 py-2">
            Set up profile
          </Link>
        </div>
      )}

      {/* Quick-access grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, icon, to, color, bg }) => (
          <Link key={to} to={to}>
            <Card hoverable className="flex flex-col items-center text-center gap-3 py-6">
              <span className={`text-2xl flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                {icon}
              </span>
              <span className={`text-sm font-medium ${color}`}>{label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Top recommendations preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Top Recommendations</h2>
          <Link to="/recommendations" className="text-sm text-primary-400 hover:text-primary-300">
            View all →
          </Link>
        </div>

        {recLoading ? (
          <Loader center />
        ) : recommendations.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-slate-400 text-sm">
              {profile
                ? 'No recommendations yet. Check back soon.'
                : 'Complete your profile to get personalised recommendations.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec) => (
              <Link key={rec.id} to={`/projects/${rec.project.id}`}>
                <Card hoverable className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-100 text-sm truncate">
                      {rec.project.title}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                      {rec.project.description ?? 'No description available.'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rec.project.technologies.slice(0, 3).map((t) => (
                        <Badge key={t} variant="primary" size="sm">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-primary-400">
                      {Math.round(rec.match_score * 100)}%
                    </span>
                    <p className="text-xs text-slate-500">match</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Profile summary */}
      {profile && (
        <div>
          <h2 className="section-title mb-4">Your Profile</h2>
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="label">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.length > 0
                    ? profile.skills.map((s) => <Badge key={s}>{s}</Badge>)
                    : <span className="text-slate-500 text-xs">Not set</span>}
                </div>
              </div>
              <div>
                <p className="label">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.length > 0
                    ? profile.interests.map((i) => <Badge key={i} variant="info">{i}</Badge>)
                    : <span className="text-slate-500 text-xs">Not set</span>}
                </div>
              </div>
              <div>
                <p className="label">Level</p>
                <Badge variant={
                  profile.knowledge_level === 'advanced' ? 'success'
                  : profile.knowledge_level === 'intermediate' ? 'warning'
                  : 'default'
                }>
                  {profile.knowledge_level ?? 'Not set'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
