import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Globe, BarChart2, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { projectService } from '../services/projectService'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-navy-600 bg-navy-700 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-white">{value}</p>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(Number(id)),
    enabled: !!id,
  })

  function copyUrl() {
    if (project?.source_url) {
      navigator.clipboard.writeText(project.source_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (isError || !project) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400">Project not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate('/search')}>Back to Search</Button>
      </div>
    )
  }

  const difficultyVariant = project.difficulty_level === 'hard' ? 'red' : project.difficulty_level === 'medium' ? 'yellow' : 'green'

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent-400 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {project.difficulty_level && <Badge variant={difficultyVariant}>{project.difficulty_level}</Badge>}
          {project.source_type && <Badge variant="gray">{project.source_type}</Badge>}
        </div>
        <h1 className="text-3xl font-bold leading-snug text-white">{project.title}</h1>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Popularity Score" value={project.popularity_score.toFixed(1)} />
        <StatCard label="Similar Projects" value={project.similarity_count} />
        <StatCard label="Added" value={new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
      </div>

      {/* Description */}
      {project.description && (
        <Card className="mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{project.description}</p>
        </Card>
      )}

      {/* Tech & Domains */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        {project.technologies.length > 0 && (
          <Card>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((t) => <Badge key={t} variant="default">{t}</Badge>)}
            </div>
          </Card>
        )}
        {project.domains.length > 0 && (
          <Card>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Domains</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.domains.map((d) => <Badge key={d} variant="blue">{d}</Badge>)}
            </div>
          </Card>
        )}
      </div>

      {/* Source */}
      {project.source_url && (
        <Card className="mb-6">
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">
            <Globe size={13} /> Source
          </h2>
          <div className="flex items-center gap-2">
            <a
              href={project.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm text-accent-400 hover:text-accent-300 hover:underline"
            >
              <ExternalLink size={14} className="flex-shrink-0" />
              <span className="truncate">{project.source_url}</span>
            </a>
            <button
              onClick={copyUrl}
              title="Copy URL"
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-navy-700 hover:text-accent-400"
              aria-label="Copy source URL"
            >
              {copied ? <CheckCircle2 size={16} className="text-accent-400" /> : <Copy size={16} />}
            </button>
          </div>
        </Card>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <Link to="/recommendations">
          <Button icon={<BarChart2 size={16} />}>See more like this</Button>
        </Link>
        <Link to="/generator">
          <Button variant="outline">Generate similar ideas</Button>
        </Link>
        <Link to="/similarity">
          <Button variant="secondary">Check my idea's similarity</Button>
        </Link>
      </div>
    </div>
  )
}
