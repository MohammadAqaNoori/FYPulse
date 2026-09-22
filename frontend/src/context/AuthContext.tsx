import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCurrentUser, logout } from '@/store/slices/authSlice'
import { tokenStorage } from '@/services/api'
import type { User } from '@/types'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (s) => s.auth,
  )

  // On mount, if a token exists re-hydrate the user object
  useEffect(() => {
    if (tokenStorage.getAccess() && !user) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, user])

  const signOut = () => {
    dispatch(logout())
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within <AuthProvider>')
  }
  return ctx
}
