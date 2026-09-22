import { Link } from 'react-router-dom'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
}

const difficultyVariant = {
  easy:   'success',
  medium: 'warning',
  hard:   'danger',
} as const

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.id}`}>
      <Card hoverable className="flex flex-col gap-3 h-full">
        {/* Title */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 flex-1">
            {project.title}
          </h3>
          {project.difficulty_level && (
            <Badge
              variant={difficultyVariant[project.difficulty_level] ?? 'default'}
              size="sm"
              className="shrink-0 capitalize"
            >
              {project.difficulty_level}
            </Badge>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Technologies */}
        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((t) => (
              <Badge key={t} variant="primary" size="sm">{t}</Badge>
            ))}
            {project.technologies.length > 4 && (
              <Badge size="sm">+{project.technologies.length - 4}</Badge>
            )}
          </div>
        )}

        {/* Domains */}
        {project.domains.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.domains.slice(0, 3).map((d) => (
              <Badge key={d} variant="info" size="sm">{d}</Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-surface-border">
          <span className="text-xs text-slate-500">
            {project.source_type ?? 'Unknown source'}
          </span>
          <span className="text-xs text-slate-500">
            ⭐ {project.popularity_score.toFixed(1)}
          </span>
        </div>
      </Card>
    </Link>
  )
}
