import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { projectService } from '../services/projectService'
import type { SearchParams } from '../services/projectService'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { EmptyState } from '../components/common/EmptyState'

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard']

function ProjectCard({ project }: { project: { id: number; title: string; description: string | null; technologies: string[]; domains: string[]; difficulty_level: string | null; popularity_score: number } }) {
  return (
    <Link to={`/projects/${project.id}`}>
      <Card hover className="h-full">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">{project.title}</h3>
          {project.difficulty_level && (
            <Badge variant={project.difficulty_level === 'hard' ? 'red' : project.difficulty_level === 'medium' ? 'yellow' : 'green'}>
              {project.difficulty_level}
            </Badge>
          )}
        </div>
        <p className="mb-3 line-clamp-2 text-xs text-gray-400">{project.description}</p>
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="gray">{tech}</Badge>
          ))}
          {project.technologies.length > 3 && (
            <Badge variant="gray">+{project.technologies.length - 3}</Badge>
          )}
        </div>
        {project.domains.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.domains.slice(0, 2).map((d) => (
              <Badge key={d} variant="blue">{d}</Badge>
            ))}
          </div>
        )}
      </Card>
    </Link>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [techInput, setTechInput] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const searchParams: SearchParams = {
    query: query || undefined,
    technologies: technologies.length ? technologies : undefined,
    difficulty_level: difficulty || undefined,
    page,
    page_size: 18,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['projects-search', searchParams],
    queryFn: () =>
      query || technologies.length || difficulty
        ? projectService.searchProjects(searchParams)
        : projectService.listProjects(page, 18),
  })

  function addTech() {
    const t = techInput.trim().toLowerCase()
    if (t && !technologies.includes(t)) setTechnologies([...technologies, t])
    setTechInput('')
  }

  function clearAll() {
    setQuery(''); setDifficulty(''); setTechnologies([]); setPage(1)
  }

  const hasFilters = !!query || !!difficulty || technologies.length > 0
  const totalPages = data ? Math.ceil(data.total / 18) : 0

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
          <Search size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Browse Projects</h1>
          <p className="text-sm text-gray-400">Search through all indexed FYP projects</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search projects by title or description…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          />
        </div>
        <Button
          variant="secondary"
          icon={<SlidersHorizontal size={16} />}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters {hasFilters && `(${[query, difficulty, ...technologies].filter(Boolean).length})`}
        </Button>
        {hasFilters && (
          <Button variant="ghost" icon={<X size={16} />} onClick={clearAll}>Clear</Button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1) }}>
                <option value="">Any difficulty</option>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Technologies</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="e.g. react"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech() } }}
                />
                <Button variant="secondary" size="sm" onClick={addTech}>Add</Button>
              </div>
              {technologies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {technologies.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-400/15 border border-accent-400/20 px-2.5 py-0.5 text-xs font-medium text-accent-300">
                      {t}
                      <button type="button" onClick={() => setTechnologies(technologies.filter((x) => x !== t))} className="text-accent-400/60 hover:text-accent-300">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {isLoading || isFetching ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data?.projects?.length ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No projects found"
          description="Try adjusting your search or filters."
          action={hasFilters ? <Button variant="secondary" onClick={clearAll}>Clear filters</Button> : undefined}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-400">
            <span className="font-semibold text-white">{data.total}</span> projects found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
