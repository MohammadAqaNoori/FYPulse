import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { FullPageSpinner } from './components/common/Spinner'

// Lazy load all pages
const LoginPage         = lazy(() => import('./pages/LoginPage'))
const RegisterPage      = lazy(() => import('./pages/RegisterPage'))
const HomePage          = lazy(() => import('./pages/HomePage'))
const ProfilePage       = lazy(() => import('./pages/ProfilePage'))
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'))
const SearchPage        = lazy(() => import('./pages/SearchPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const IdeaGeneratorPage = lazy(() => import('./pages/IdeaGeneratorPage'))
const SimilarityPage    = lazy(() => import('./pages/SimilarityPage'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />

        {/* Protected routes inside the app shell */}
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/dashboard"        element={<HomePage />} />
          <Route path="/profile"          element={<ProfilePage />} />
          <Route path="/recommendations"  element={<RecommendationsPage />} />
          <Route path="/search"           element={<SearchPage />} />
          <Route path="/projects/:id"     element={<ProjectDetailPage />} />
          <Route path="/generator"        element={<IdeaGeneratorPage />} />
          <Route path="/similarity"       element={<SimilarityPage />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
