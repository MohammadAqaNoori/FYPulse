import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-black">
              FP
            </span>
            FYPulse
          </Link>

          {/* Nav links — authenticated only */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/recommendations', label: 'Recommendations' },
                { to: '/search', label: 'Search' },
                { to: '/generate', label: 'Idea Generator' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-surface-card',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-card transition-colors"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-700 text-xs font-semibold text-white uppercase">
                    {user?.full_name?.charAt(0) ?? 'U'}
                  </span>
                  <span className="hidden sm:block">{user?.full_name}</span>
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm px-4 py-1.5"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
