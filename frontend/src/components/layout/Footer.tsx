import { Link } from 'react-router-dom'
import { Github, Mail, Zap } from 'lucide-react'
import logo from '../../assets/FYPulseLogo.png'

const navLinks = [
  { label: 'Dashboard',        to: '/dashboard'       },
  { label: 'Browse Projects',  to: '/search'          },
  { label: 'Recommendations',  to: '/recommendations' },
  { label: 'Idea Generator',   to: '/generator'       },
  { label: 'Similarity Check', to: '/similarity'      },
  { label: 'My Profile',       to: '/profile'         },
]

const infoLinks = [
  { label: 'API Docs',   href: 'http://localhost:8000/docs',   external: true  },
  { label: 'ReDoc',      href: 'http://localhost:8000/redoc',  external: true  },
  { label: 'GitHub',     href: 'https://github.com/MohammadAqaNoori/FYPulse', external: true },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/dashboard" className="mb-4 flex items-center gap-2.5">
              <img src={logo} alt="FYPulse" className="h-10 w-auto" />
              <span className="text-xl font-bold text-gray-900">FYPulse</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500">
              AI-powered Final Year Project discovery platform. Find, explore, and generate
              the perfect FYP matched to your skills, interests, and goals.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com/MohammadAqaNoori/FYPulse"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-accent-400 hover:text-accent-600"
                aria-label="GitHub"
              >
                <Github size={17} />
              </a>
              <a
                href="mailto:contact@fypulse.dev"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-accent-400 hover:text-accent-600"
                aria-label="Email"
              >
                <Mail size={17} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {navLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-gray-500 transition-colors hover:text-accent-600"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {infoLinks.map(({ label, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-gray-500 transition-colors hover:text-accent-600"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Status indicator */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
              </span>
              <span className="text-xs font-medium text-accent-700">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {year} FYPulse. Built for students, by students.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Zap size={12} className="text-accent-500" />
            Powered by AI &amp; FastAPI
          </div>
        </div>
      </div>
    </footer>
  )
}
