import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import Loader from '@/components/common/Loader'

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const HomePage            = lazy(() => import('@/pages/HomePage'))
const LoginPage           = lazy(() => import('@/pages/LoginPage'))
const RegisterPage        = lazy(() => import('@/pages/RegisterPage'))
const ProfilePage         = lazy(() => import('@/pages/ProfilePage'))
const SearchPage          = lazy(() => import('@/pages/SearchPage'))
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage'))
const ProjectDetailPage   = lazy(() => import('@/pages/ProjectDetailPage'))
const IdeaGeneratorPage   = lazy(() => import('@/pages/IdeaGeneratorPage'))

// ─── Guards ───────────────────────────────────────────────────────────────────

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader fullPage />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireGuest() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// ─── Layouts ─────────────────────────────────────────────────────────────────

function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<Loader center />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  )
}

function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<Loader center />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

// ─── Route tree ──────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<RequireGuest />}>
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Protected app routes */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"       element={<HomePage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/search"          element={<SearchPage />} />
          <Route path="/projects/:id"    element={<ProjectDetailPage />} />
          <Route path="/generate"        element={<IdeaGeneratorPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
