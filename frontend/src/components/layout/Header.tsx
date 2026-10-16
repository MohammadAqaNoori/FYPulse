import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { useState } from 'react'
import {
  LayoutDashboard, Search, Star, Lightbulb,
  User, LogOut, ShieldCheck, Menu, X, ChevronDown,
} from 'lucide-react'
import logo from '../../assets/FYPulseLogo.png'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard',       label: 'Dashboard'        },
  { to: '/search',          label: 'Browse'           },
  { to: '/recommendations', label: 'Recommendations'  },
  { to: '/generator',       label: 'Idea Generator'   },
  { to: '/similarity',      label: 'Similarity Check' },
]

const mobileNavItems = [
  { to: '/dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/search',          label: 'Browse Projects',  icon: Search          },
  { to: '/recommendations', label: 'Recommendations',  icon: Star            },
  { to: '/generator',       label: 'Idea Generator',   icon: Lightbulb       },
  { to: '/similarity',      label: 'Similarity Check', icon: ShieldCheck     },
  { to: '/profile',         label: 'My Profile',       icon: User            },
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
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="FYPulse" className="h-9 w-auto" />
          <span className="text-lg font-bold text-navy-900 tracking-tight">FYPulse</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'text-accent-500'
                    : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-accent-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              clsx(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive ? 'text-accent-500' : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
              )
            }
          >
            Profile
          </NavLink>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-accent-400 hover:text-navy-900 transition-colors shadow-sm"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-accent-400">
                {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="max-w-[96px] truncate font-medium">{user?.full_name?.split(' ')[0]}</span>
              <ChevronDown size={13} className={clsx('text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 shadow-lg">
          <nav className="flex flex-col gap-0.5">
            {mobileNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-50 text-accent-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
