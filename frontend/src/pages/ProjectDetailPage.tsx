import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import projectService from '@/services/projectService'
import Badge from '@/components/common/Badge'
import Card from '@/components/common/Card'
import Loader from '@/components/common/Loader'
import type { Project } from '@/types'

const difficultyVariant = {
  easy:   'success',
  medium: 'warning',
  hard:   'danger',
} as const

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project,   setProject]   = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    projectService
      .getById(Number(id))
      .then(setProject)
      .catch(() => setError('Project not found.'))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <Loader center label="Loading project…" />

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-slate-300 font-medium">{error ?? 'Project not found.'}</p>
        <Link to="/search" className="text-primary-400 text-sm mt-4 inline-block hover:underline">
          ← Back to search
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link to="/search" className="text-sm text-slate-400 hover:text-slate-100 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Search
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          {project.difficulty_level && (
            <Badge
              variant={difficultyVariant[project.difficulty_level] ?? 'default'}
              className="capitalize"
            >
              {project.difficulty_level}
            </Badge>
          )}
          {project.source_type && (
            <Badge variant="default">{project.source_type}</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white leading-snug">{project.title}</h1>
        {project.description && (
          <p className="text-slate-300 leading-relaxed">{project.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-primary-400">
            {project.popularity_score.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Popularity score</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-amber-400">{project.similarity_count}</p>
          <p className="text-xs text-slate-500 mt-1">Similar projects</p>
        </Card>
        <Card padding="sm" className="text-center col-span-2 sm:col-span-1">
          <p className="text-sm font-semibold text-slate-300 truncate">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Date indexed</p>
        </Card>
      </div>

      {/* Technologies */}
      {project.technologies.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <Badge key={t} variant="primary">{t}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Domains */}
      {project.domains.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Domains</h2>
          <div className="flex flex-wrap gap-2">
            {project.domains.map((d) => (
              <Badge key={d} variant="info">{d}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Source link */}
      {project.source_url && (
        <a
          href={project.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary inline-flex w-full justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View source
        </a>
      )}
    </div>
  )
}
