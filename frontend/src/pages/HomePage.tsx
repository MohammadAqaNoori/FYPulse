import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, Search, Lightbulb, ArrowRight, TrendingUp, BookOpen, Zap, ShieldCheck } from 'lucide-react'
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
    <div className="-mx-6 -mt-8">

      {/* ── Hero section: dark navy 3D gradient ──────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 pb-20 pt-16"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2a4a 40%, #0f3d2e 100%)',
        }}
      >
        {/* 3D depth: layered radial glows */}
        <div className="pointer-events-none absolute inset-0">
          <div style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,208,132,0.18) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '10%',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,208,132,0.10) 0%, transparent 65%)',
          }} />
          {/* Subtle grid lines for depth */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,208,132,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,208,132,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* Badge pill */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-400/10 px-4 py-1.5">
            <Zap size={13} className="text-accent-400" />
            <span className="text-xs font-semibold tracking-wide text-accent-300">AI-Powered FYP Discovery</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Find Your Perfect{' '}
                <span style={{ color: '#00d084' }}>Final Year Project</span>
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-gray-300">
                FYPulse matches you with the best FYP ideas based on your skills, interests, and goals.
                Stop guessing — start building what matters.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/recommendations">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{ background: '#00d084', color: '#0a1628' }}
                  >
                    Get Recommendations <ArrowRight size={17} />
                  </button>
                </Link>
                <Link to="/search">
                  <button className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                    Browse Projects
                  </button>
                </Link>
              </div>
            </div>

            {/* Right: stats card (3D elevated look) */}
            <div className="hidden lg:block">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset',
                }}
              >
                <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  Welcome back
                </p>
                <p className="text-2xl font-bold text-white">{user?.full_name}</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Skills',        value: profile?.skills?.length ?? 0        },
                    { label: 'Interests',     value: profile?.interests?.length ?? 0     },
                    { label: 'Technologies',  value: profile?.technologies?.length ?? 0  },
                    { label: 'Level',         value: profile?.knowledge_level ?? '—'     },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-xl font-bold" style={{ color: '#00d084' }}>{value}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {!profileComplete && (
                  <Link to="/profile?onboarding=true" className="mt-4 block">
                    <button
                      className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: '#00d084', color: '#0a1628' }}
                    >
                      Complete your profile →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-4">
            {[
              { value: '500+', label: 'Projects Indexed'   },
              { value: 'AI',   label: 'Powered Matching'   },
              { value: '3',    label: 'Sources Scraped'    },
              { value: '24/7', label: 'Available'          },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold" style={{ color: '#00d084' }}>{value}</p>
                <p className="mt-1 text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── White content below ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-12">

        {/* Quick actions */}
        <section>
          <div className="mb-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent-500">Quick Access</p>
            <h2 className="text-2xl font-bold text-gray-900">What would you like to do?</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/recommendations', icon: Star,         label: 'Recommendations',  desc: 'AI-matched to your skills',      iconBg: 'bg-accent-50',  iconColor: 'text-accent-600'  },
              { to: '/search',          icon: Search,       label: 'Browse Projects',  desc: 'Search & filter all FYPs',       iconBg: 'bg-blue-50',    iconColor: 'text-blue-600'    },
              { to: '/generator',       icon: Lightbulb,    label: 'Idea Generator',   desc: 'AI-generated novel concepts',    iconBg: 'bg-amber-50',   iconColor: 'text-amber-600'   },
              { to: '/similarity',      icon: ShieldCheck,  label: 'Check Similarity', desc: 'Is your idea too common?',       iconBg: 'bg-purple-50',  iconColor: 'text-purple-600'  },
            ].map(({ to, icon: Icon, label, desc, iconBg, iconColor }) => (
              <Link key={to} to={to}>
                <Card hover className="h-full">
                  <div className={`mb-3 inline-flex rounded-xl p-3 ${iconBg}`}>
                    <Icon size={22} className={iconColor} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <p className="mt-1 text-sm text-gray-500">{desc}</p>
                  <span className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${iconColor}`}>
                    Open <ArrowRight size={13} />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending projects */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-accent-500">Trending</p>
              <h2 className="text-2xl font-bold text-gray-900">Popular Projects</h2>
            </div>
            <Link to="/search" className="text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors">
              View all →
            </Link>
          </div>

          {loadingProjects ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects?.projects?.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <Card hover className="h-full">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{project.title}</h3>
                      {project.difficulty_level && (
                        <Badge variant={project.difficulty_level === 'hard' ? 'red' : project.difficulty_level === 'medium' ? 'yellow' : 'green'}>
                          {project.difficulty_level}
                        </Badge>
                      )}
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-gray-500">{project.description}</p>
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
        </section>

        {/* Profile CTA if incomplete */}
        {!profileComplete && (
          <div className="flex items-center gap-5 rounded-2xl border border-accent-100 bg-accent-50 px-6 py-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <BookOpen size={22} className="text-accent-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">Your profile is incomplete</h3>
              <p className="mt-0.5 text-sm text-gray-600">
                Add skills, interests, and technologies to unlock personalised recommendations.
              </p>
            </div>
            <Link to="/profile?onboarding=true" className="flex-shrink-0">
              <Button>Complete Profile</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
