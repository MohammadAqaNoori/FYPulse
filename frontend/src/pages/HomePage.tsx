import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, Search, Lightbulb, ArrowRight, TrendingUp, BookOpen, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/userService'
import { projectService } from '../services/projectService'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'

export default function HomePage() {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    retry: false,
  })

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', 1, 6],
    queryFn: () => projectService.listProjects(1, 6),
  })

  const profileComplete = !!profile?.skills?.length

  return (
    <div className="space-y-8">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-accent-500/20 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-800 px-8 py-10">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-accent-400/5 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-accent-400">Welcome back,</p>
            <h1 className="mt-1 text-4xl font-bold text-white">{user?.full_name}</h1>
            {profileComplete ? (
              <p className="mt-2 text-gray-400">
                Your profile is ready — check your personalised recommendations below.
              </p>
            ) : (
              <p className="mt-2 text-gray-400">
                Complete your profile to unlock AI-powered FYP recommendations.
              </p>
            )}
            {!profileComplete && (
              <Link to="/profile?onboarding=true" className="mt-4 inline-flex">
                <Button size="lg" icon={<ArrowRight size={16} />}>
                  Set up Profile
                </Button>
              </Link>
            )}
          </div>
          <Zap size={64} className="hidden opacity-10 lg:block text-accent-400" />
        </div>

        {/* Stats row */}
        {profileComplete && (
          <div className="relative mt-6 flex flex-wrap gap-6 border-t border-navy-600 pt-6">
            {[
              { label: 'Skills added', value: profile.skills.length },
              { label: 'Interests', value: profile.interests.length },
              { label: 'Technologies', value: profile.technologies.length },
              { label: 'Level', value: profile.knowledge_level ?? 'Not set' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-accent-400">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            to: '/recommendations',
            icon: Star,
            label: 'Recommendations',
            desc: 'AI-matched projects for your skills',
            accent: 'text-accent-400',
            bg: 'bg-accent-400/10 border-accent-400/20',
          },
          {
            to: '/search',
            icon: Search,
            label: 'Browse Projects',
            desc: 'Search & filter all FYPs',
            accent: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            to: '/generator',
            icon: Lightbulb,
            label: 'Generate Ideas',
            desc: 'Novel AI-powered project concepts',
            accent: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
        ].map(({ to, icon: Icon, label, desc, accent, bg }) => (
          <Link key={to} to={to}>
            <Card hover className="h-full">
              <div className={`mb-3 inline-flex rounded-xl border p-3 ${bg}`}>
                <Icon size={22} className={accent} />
              </div>
              <h3 className="font-semibold text-white">{label}</h3>
              <p className="mt-1 text-sm text-gray-400">{desc}</p>
              <span className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${accent}`}>
                Open <ArrowRight size={13} />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Trending projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-accent-400" />
            <h2 className="text-lg font-semibold text-white">Trending Projects</h2>
          </div>
          <Link to="/search" className="text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors">
            View all →
          </Link>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.projects?.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
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
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Profile CTA if incomplete */}
      {!profileComplete && (
        <div className="flex items-center gap-4 rounded-xl border border-accent-500/20 bg-accent-400/5 px-6 py-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent-400/15 border border-accent-400/20">
            <BookOpen size={22} className="text-accent-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Your profile is incomplete</h3>
            <p className="mt-0.5 text-sm text-gray-400">
              Add skills, interests, and technologies to get personalised recommendations.
            </p>
          </div>
          <Link to="/profile?onboarding=true">
            <Button variant="outline">Complete Profile</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
