import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lightbulb, Sparkles, ChevronDown, ChevronUp, AlertCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { generatorService } from '../services/generatorService'
import type { GeneratedIdea } from '../types'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { TagInput } from '../components/common/TagInput'
import { EmptyState } from '../components/common/EmptyState'

function NoveltyBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-500">{pct}% novel</span>
    </div>
  )
}

function IdeaCard({ idea, index }: { idea: GeneratedIdea; index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Card hover>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-50 border border-accent-100 text-xs font-bold text-accent-600">{index + 1}</span>
          <h3 className="font-semibold text-gray-900">{idea.title}</h3>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <NoveltyBar value={idea.novelty_score} />
      <p className={`mt-3 text-sm text-gray-600 ${expanded ? '' : 'line-clamp-2'}`}>{idea.description}</p>
      {expanded && idea.rationale && (
        <div className="mt-3 rounded-lg border border-accent-100 bg-accent-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-accent-700">Why this idea for you</p>
          <p className="mt-1 text-xs text-gray-600">{idea.rationale}</p>
        </div>
      )}
      {idea.tech_stack && idea.tech_stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">{idea.tech_stack.map((t) => <Badge key={t} variant="default">{t}</Badge>)}</div>
      )}
      {!expanded && <button onClick={() => setExpanded(true)} className="mt-2 text-xs text-accent-500 hover:text-accent-700">Show rationale ↓</button>}
    </Card>
  )
}

export default function IdeaGeneratorPage() {
  const navigate = useNavigate()
  const [count, setCount] = useState(5)
  const [extraSkills, setExtraSkills] = useState<string[]>([])
  const [extraInterests, setExtraInterests] = useState<string[]>([])

  const mutation = useMutation({ mutationFn: () => generatorService.generateIdeas(count, extraSkills, extraInterests) })
  const noProfile = mutation.isError && (mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message?.includes('profile')

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Lightbulb size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Idea Generator</h1>
          <p className="text-sm text-gray-500">AI-generated novel FYP concepts tailored to your profile</p>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Generator Settings</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Number of ideas</label>
            <select className="input" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n} ideas</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><TagInput label="Extra skills (optional)" tags={extraSkills} onChange={setExtraSkills} placeholder="e.g. rust, flutter" /></div>
          <div className="sm:col-span-2"><TagInput label="Extra interests (optional)" tags={extraInterests} onChange={setExtraInterests} placeholder="e.g. agriculture, smart-cities" /></div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-400">Base data comes from your saved profile. Extra fields augment it.</p>
          <Button loading={mutation.isPending} icon={<Sparkles size={16} />} onClick={() => mutation.mutate()}>Generate Ideas</Button>
        </div>
      </Card>

      {mutation.isPending && (
        <div className="flex flex-col items-center py-16 text-center">
          <Sparkles size={40} className="mb-4 animate-pulse text-accent-500" />
          <p className="font-medium text-gray-700">Generating ideas…</p>
          <p className="mt-1 text-sm text-gray-400">Analysing project patterns and your profile</p>
        </div>
      )}

      {noProfile && <EmptyState icon={<AlertCircle size={48} />} title="Profile required" description="Complete your profile so the generator can tailor ideas."
        action={<Button onClick={() => navigate('/profile?onboarding=true')} icon={<ArrowRight size={16} />}>Complete Profile</Button>} />}

      {mutation.isError && !noProfile && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">Something went wrong. Make sure the ML service is running.</div>
      )}

      {mutation.isSuccess && (
        mutation.data.ideas.length === 0
          ? <EmptyState icon={<Lightbulb size={48} />} title="No ideas returned" description="Try updating your profile or adding extra skills." />
          : <>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-accent-500" />
                <p className="text-sm text-gray-500">Generated <span className="font-semibold text-gray-800">{mutation.data.ideas.length}</span> ideas</p>
              </div>
              <div className="space-y-4">{mutation.data.ideas.map((idea, i) => <IdeaCard key={i} idea={idea} index={i} />)}</div>
            </>
      )}

      {!mutation.isPending && !mutation.isSuccess && !mutation.isError && (
        <EmptyState icon={<Lightbulb size={48} />} title="Ready to generate" description="Hit 'Generate Ideas' to get AI-powered project concepts." />
      )}
    </div>
  )
}
