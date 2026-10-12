import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight } from 'lucide-react'
import { recommendationService } from '../services/recommendationService'
import type { SimilarityResult } from '../types'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'

function ResultPanel({ result }: { result: SimilarityResult }) {
  const overused = result.is_overused
  return (
    <div className="space-y-5">
      <div className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${
        overused
          ? 'border-amber-500/20 bg-amber-500/10'
          : 'border-accent-500/20 bg-accent-400/10'
      }`}>
        {overused
          ? <AlertTriangle size={22} className="mt-0.5 flex-shrink-0 text-amber-400" />
          : <CheckCircle2 size={22} className="mt-0.5 flex-shrink-0 text-accent-400" />
        }
        <div>
          <p className={`font-semibold ${overused ? 'text-amber-300' : 'text-accent-300'}`}>
            {overused
              ? `Overused — ${result.similar_count} similar projects found`
              : `Looks fresh — only ${result.similar_count} similar project${result.similar_count === 1 ? '' : 's'} found`}
          </p>
          {result.suggestion && (
            <p className={`mt-1 text-sm ${overused ? 'text-amber-400/80' : 'text-gray-400'}`}>
              {result.suggestion}
            </p>
          )}
        </div>
      </div>

      {result.similar_projects && result.similar_projects.length > 0 && (
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Most Similar Existing Projects</h3>
          <ul className="divide-y divide-navy-600">
            {result.similar_projects.map((p) => (
              <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link to={`/projects/${p.id}`} className="text-sm font-medium text-white hover:text-accent-400 transition-colors">
                      {p.title}
                    </Link>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{p.description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.technologies.slice(0, 3).map((t) => <Badge key={t} variant="gray">{t}</Badge>)}
                    </div>
                  </div>
                  <Link to={`/projects/${p.id}`} className="flex-shrink-0 text-gray-500 hover:text-accent-400">
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

export default function SimilarityPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () => recommendationService.checkSimilarity(title.trim(), description.trim()),
  })

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20">
          <ShieldCheck size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Similarity Checker</h1>
          <p className="text-sm text-gray-400">Check if your FYP idea is overused before committing</p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="space-y-4">
          <div>
            <label className="label">Project title *</label>
            <input
              className="input"
              placeholder="e.g. AI-powered crop disease detection system"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              Brief description <span className="font-normal text-gray-500">(optional but improves accuracy)</span>
            </label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Describe your idea in a few sentences…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              loading={mutation.isPending}
              disabled={!title.trim()}
              icon={<ShieldCheck size={16} />}
              onClick={() => mutation.mutate()}
            >
              Check Similarity
            </Button>
          </div>
        </div>
      </Card>

      {mutation.isPending && (
        <div className="py-10 text-center text-sm text-gray-500">Scanning project database…</div>
      )}

      {mutation.isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          Something went wrong. Make sure the ML service is running.
        </div>
      )}

      {mutation.isSuccess && <ResultPanel result={mutation.data} />}

      {!mutation.isPending && !mutation.isSuccess && !mutation.isError && (
        <div className="flex flex-col items-center py-12 text-center text-gray-600">
          <Lightbulb size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Enter your idea above and hit Check Similarity</p>
        </div>
      )}
    </div>
  )
}
