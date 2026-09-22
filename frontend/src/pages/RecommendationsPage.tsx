import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useAppSelector } from '@/store/hooks'
import RecommendationCard from '@/components/recommendations/RecommendationCard'
import Loader from '@/components/common/Loader'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Card from '@/components/common/Card'
import type { SimilarityResult } from '@/types'

export default function RecommendationsPage() {
  const {
    recommendations,
    total,
    isLoading,
    error,
    similarityResult,
    similarityLoading,
    loadRecommendations,
    runSimilarityCheck,
    resetSimilarity,
  } = useRecommendations()

  const profile = useAppSelector((s) => s.profile.profile)

  const [topK, setTopK] = useState(10)
  const [simTitle, setSimTitle]     = useState('')
  const [simDesc,  setSimDesc]      = useState('')
  const [simOpen,  setSimOpen]      = useState(false)
  const [resultOpen, setResultOpen] = useState(false)

  useEffect(() => {
    loadRecommendations(topK)
  }, [topK]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSimilarityCheck = async () => {
    if (!simTitle.trim()) return
    await runSimilarityCheck({ title: simTitle.trim(), description: simDesc.trim() })
    setSimOpen(false)
    setResultOpen(true)
  }

  const result = similarityResult as SimilarityResult | null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recommendations</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total > 0 ? `${total} projects matched your profile` : 'Personalised FYP ideas for you'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSimOpen(true)}
        >
          Check idea similarity
        </Button>
      </div>

      {/* No profile warning */}
      {!profile && !isLoading && (
        <div className="rounded-2xl border border-amber-700/50 bg-amber-900/20 px-5 py-4">
          <p className="text-amber-300 font-medium text-sm">Profile incomplete</p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            <Link to="/profile" className="underline">Set up your profile</Link> to get personalised recommendations.
          </p>
        </div>
      )}

      {/* Results count selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Show</span>
        {[10, 20, 50].map((n) => (
          <button
            key={n}
            onClick={() => setTopK(n)}
            className={[
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              topK === n
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-slate-100 bg-surface-card border border-surface-border',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <Loader center label="Loading recommendations…" />
      ) : recommendations.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">💡</p>
          <p className="font-medium">No recommendations yet.</p>
          <p className="text-sm mt-1">
            {profile
              ? 'The ML pipeline may still be indexing projects. Try again shortly.'
              : 'Complete your profile to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={rec.id} recommendation={rec} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Similarity check modal */}
      <Modal
        isOpen={simOpen}
        onClose={() => setSimOpen(false)}
        title="Check Idea Similarity"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Enter your project idea to see how unique it is compared to existing projects.
          </p>
          <div>
            <label className="label" htmlFor="sim-title">Idea title *</label>
            <input
              id="sim-title"
              type="text"
              value={simTitle}
              onChange={(e) => setSimTitle(e.target.value)}
              placeholder="e.g. Smart Campus Attendance System"
              className="input-base"
            />
          </div>
          <div>
            <label className="label" htmlFor="sim-desc">Description (optional)</label>
            <textarea
              id="sim-desc"
              rows={3}
              value={simDesc}
              onChange={(e) => setSimDesc(e.target.value)}
              placeholder="Brief description of your idea…"
              className="input-base resize-none"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSimilarityCheck}
            isLoading={similarityLoading}
            disabled={!simTitle.trim()}
          >
            Check similarity
          </Button>
        </div>
      </Modal>

      {/* Similarity result modal */}
      <Modal
        isOpen={resultOpen}
        onClose={() => { setResultOpen(false); resetSimilarity() }}
        title="Similarity Check Result"
      >
        {result && (
          <div className="space-y-4">
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
              result.is_overused
                ? 'bg-red-900/30 border border-red-700/50 text-red-300'
                : 'bg-emerald-900/30 border border-emerald-700/50 text-emerald-300'
            }`}>
              {result.is_overused
                ? `⚠️ This idea is overused — ${result.similarity_count} similar projects found.`
                : `✅ Your idea looks unique! Only ${result.similarity_count} similar projects.`}
            </div>

            {result.suggestion && (
              <Card padding="sm">
                <p className="text-xs text-slate-400 font-medium mb-1">Suggestion</p>
                <p className="text-sm text-slate-300">{result.suggestion}</p>
              </Card>
            )}

            {result.similar_projects.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">Similar projects</p>
                <div className="space-y-2">
                  {result.similar_projects.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      onClick={() => setResultOpen(false)}
                      className="block text-sm text-primary-400 hover:underline truncate"
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
