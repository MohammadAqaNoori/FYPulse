import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { useState } from 'react'
import {
  LayoutDashboard,
  Search,
  Star,
  Lightbulb,
  User,
  LogOut,
  Zap,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/search',          label: 'Browse',           icon: Search },
  { to: '/recommendations', label: 'Recommendations',  icon: Star },
  { to: '/generator',       label: 'Idea Generator',   icon: Lightbulb },
  { to: '/similarity',      label: 'Similarity Check', icon: ShieldCheck },
]

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-navy-700 bg-navy-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-400 shadow-glow">
            <Zap size={16} className="text-navy-900" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">FYPulse</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'text-accent-400 bg-accent-400/10'
                    : 'text-gray-400 hover:text-white hover:bg-navy-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side: profile + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Profile nav */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              clsx(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'text-accent-400 bg-accent-400/10'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700'
              )
            }
          >
            Profile
          </NavLink>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-gray-300 hover:border-accent-500 hover:text-white transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-400 text-xs font-bold text-navy-900">
                {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="max-w-[100px] truncate">{user?.full_name?.split(' ')[0]}</span>
              <ChevronDown size={14} className={clsx('transition-transform', userMenuOpen && 'rotate-180')} />
            </button>

            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-navy-600 bg-navy-800 py-1 shadow-xl">
                  <div className="border-b border-navy-600 px-4 py-2.5">
                    <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-navy-700 hover:text-red-400 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-lg p-2 text-gray-400 hover:bg-navy-700 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-navy-700 bg-navy-900 px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {[...navItems, { to: '/profile', label: 'Profile', icon: User }].map(
              ({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent-400/10 text-accent-400'
                        : 'text-gray-400 hover:bg-navy-700 hover:text-white'
                    )
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              )
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-navy-700 hover:text-red-400 transition-colors"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
