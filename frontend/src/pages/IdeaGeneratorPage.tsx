import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import recommendationService from '@/services/recommendationService'
import IdeaCard from '@/components/idea-generator/IdeaCard'
import TagInput from '@/components/profile/TagInput'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import Loader from '@/components/common/Loader'
import type { GeneratedIdea } from '@/types'

export default function IdeaGeneratorPage() {
  const profile = useAppSelector((s) => s.profile.profile)

  const [count,        setCount]        = useState(5)
  const [extraSkills,  setExtraSkills]  = useState<string[]>([])
  const [extraInterests, setExtraInterests] = useState<string[]>([])
  const [ideas,        setIdeas]        = useState<GeneratedIdea[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [generated,    setGenerated]    = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await recommendationService.generateIdeas({
        count,
        extra_skills:    extraSkills.length > 0 ? extraSkills : undefined,
        extra_interests: extraInterests.length > 0 ? extraInterests : undefined,
      })
      setIdeas(result.ideas)
      setGenerated(true)
    } catch {
      setError('Failed to generate ideas. Make sure your profile is complete and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Idea Generator</h1>
        <p className="text-slate-400 text-sm mt-1">
          Let the ML engine propose novel FYP ideas tailored to your profile.
        </p>
      </div>

      {/* No profile warning */}
      {!profile && (
        <div className="rounded-2xl border border-amber-700/50 bg-amber-900/20 px-5 py-4">
          <p className="text-amber-300 font-medium text-sm">Profile required</p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            <Link to="/profile" className="underline">Complete your profile</Link> first for the best results.
          </p>
        </div>
      )}

      {/* Controls */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Generation Settings</h2>

        <div className="space-y-5">
          {/* Count */}
          <div>
            <p className="label">Number of ideas: {count}</p>
            <input
              type="range"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-primary-500 cursor-pointer"
              aria-label="Number of ideas to generate"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1</span><span>10</span>
            </div>
          </div>

          {/* Extra skills */}
          <TagInput
            label="Extra skills (optional)"
            id="extra-skills"
            tags={extraSkills}
            onChange={setExtraSkills}
            placeholder="Add skills beyond your profile…"
          />

          {/* Extra interests */}
          <TagInput
            label="Extra interests (optional)"
            id="extra-interests"
            tags={extraInterests}
            onChange={setExtraInterests}
            placeholder="Add interests beyond your profile…"
          />

          <Button
            className="w-full"
            onClick={handleGenerate}
            isLoading={isLoading}
          >
            ⚡ Generate ideas
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <Loader center label="Generating ideas with ML…" />
      ) : generated && ideas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🤔</p>
          <p className="font-medium">No ideas generated.</p>
          <p className="text-sm mt-1">Try adding more skills or interests above.</p>
        </div>
      ) : ideas.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Generated Ideas</h2>
            <span className="text-xs text-slate-500">{ideas.length} idea{ideas.length !== 1 ? 's' : ''}</span>
          </div>
          {ideas.map((idea, i) => (
            <IdeaCard key={i} idea={idea} index={i} />
          ))}
          <Button variant="secondary" className="w-full" onClick={handleGenerate} isLoading={isLoading}>
            Regenerate
          </Button>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <p className="text-5xl mb-4">⚡</p>
          <p className="font-medium text-slate-400">Click &quot;Generate ideas&quot; to get started</p>
        </div>
      )}
    </div>
  )
}
