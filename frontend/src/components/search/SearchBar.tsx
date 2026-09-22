import { useState, type FormEvent } from 'react'
import Button from '@/components/common/Button'
import type { ProjectSearchParams, DifficultyLevel } from '@/types'

interface SearchBarProps {
  onSearch: (params: ProjectSearchParams) => void
  isLoading?: boolean
}

const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard']

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query,      setQuery]      = useState('')
  const [tech,       setTech]       = useState('')
  const [domain,     setDomain]     = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const params: ProjectSearchParams = { page: 1, page_size: 20 }
    if (query.trim()) params.query = query.trim()
    if (tech.trim()) params.technologies = tech.split(',').map((t) => t.trim()).filter(Boolean)
    if (domain.trim()) params.domains = domain.split(',').map((d) => d.trim()).filter(Boolean)
    if (difficulty) params.difficulty_level = difficulty
    onSearch(params)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {/* Main query */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Search projects, topics, keywords…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-base flex-1"
          aria-label="Search query"
        />
        <Button type="submit" isLoading={isLoading} className="shrink-0">
          Search
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="tech-filter">Technologies</label>
          <input
            id="tech-filter"
            type="text"
            placeholder="React, Python, IoT…"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className="input-base"
          />
        </div>
        <div>
          <label className="label" htmlFor="domain-filter">Domains</label>
          <input
            id="domain-filter"
            type="text"
            placeholder="AI, Web, Mobile…"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="input-base"
          />
        </div>
        <div>
          <label className="label" htmlFor="diff-filter">Difficulty</label>
          <select
            id="diff-filter"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | '')}
            className="input-base"
          >
            <option value="">Any difficulty</option>
            {difficulties.map((d) => (
              <option key={d} value={d} className="capitalize">{d}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  )
}
