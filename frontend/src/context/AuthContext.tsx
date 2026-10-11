import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { UserResponse, TokenResponse } from '../types'
import { authService } from '../services/authService'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (full_name: string, email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: UserResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadInitialState(): AuthState {
  const token = localStorage.getItem('access_token')
  const raw = localStorage.getItem('user')
  if (token && raw) {
    try {
      return { user: JSON.parse(raw) as UserResponse, isAuthenticated: true }
    } catch {
      /* ignore */
    }
  }
  return { user: null, isAuthenticated: false }
}

function persistSession(data: TokenResponse) {
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  localStorage.setItem('user', JSON.stringify(data.user))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitialState)

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password)
    persistSession(data)
    setState({ user: data.user, isAuthenticated: true })
  }, [])

  const register = useCallback(
    async (full_name: string, email: string, password: string) => {
      const data = await authService.register(full_name, email, password)
      persistSession(data)
      setState({ user: data.user, isAuthenticated: true })
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.clear()
    setState({ user: null, isAuthenticated: false })
  }, [])

  const setUser = useCallback((user: UserResponse) => {
    localStorage.setItem('user', JSON.stringify(user))
    setState((prev) => ({ ...prev, user }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
