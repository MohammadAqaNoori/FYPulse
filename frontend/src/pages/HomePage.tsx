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
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-200">Welcome back,</p>
            <h1 className="mt-0.5 text-3xl font-bold">{user?.full_name}</h1>
            {profileComplete ? (
              <p className="mt-2 text-brand-100">
                Your profile is set up — check your personalised recommendations.
              </p>
            ) : (
              <p className="mt-2 text-brand-100">
                Complete your profile to unlock personalised FYP recommendations.
              </p>
            )}
          </div>
          <Zap size={48} className="hidden opacity-20 sm:block" />
        </div>
        {!profileComplete && (
          <Link
            to="/profile?onboarding=true"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Set up profile <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            to: '/recommendations',
            icon: Star,
            label: 'Recommendations',
            desc: 'Projects matched to your skills',
            color: 'text-brand-600',
            bg: 'bg-brand-50',
          },
          {
            to: '/search',
            icon: Search,
            label: 'Browse Projects',
            desc: 'Search and filter all FYPs',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            to: '/generator',
            icon: Lightbulb,
            label: 'Generate Ideas',
            desc: 'AI-powered novel project ideas',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map(({ to, icon: Icon, label, desc, color, bg }) => (
          <Link key={to} to={to}>
            <Card hover className="h-full cursor-pointer">
              <div className={`mb-3 inline-flex rounded-xl p-3 ${bg}`}>
                <Icon size={22} className={color} />
              </div>
              <h3 className="font-semibold text-gray-900">{label}</h3>
              <p className="mt-1 text-sm text-gray-500">{desc}</p>
              <span className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${color}`}>
                Go <ArrowRight size={13} />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Trending projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Trending Projects</h2>
          </div>
          <Link to="/search" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.projects?.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card hover className="h-full cursor-pointer">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                      {project.title}
                    </h3>
                    {project.difficulty_level && (
                      <Badge
                        variant={
                          project.difficulty_level === 'hard'
                            ? 'red'
                            : project.difficulty_level === 'medium'
                            ? 'yellow'
                            : 'green'
                        }
                      >
                        {project.difficulty_level}
                      </Badge>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-gray-500">{project.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <Badge key={tech} variant="gray">
                        {tech}
                      </Badge>
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
        <Card className="border-brand-200 bg-brand-50">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <BookOpen size={22} className="text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Your profile is incomplete</h3>
              <p className="mt-0.5 text-sm text-gray-600">
                Add your skills, interests, and technologies to get personalised recommendations.
              </p>
            </div>
            <Link to="/profile?onboarding=true">
              <Button variant="primary">Complete Profile</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
