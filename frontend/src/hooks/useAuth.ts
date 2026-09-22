import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  loginUser,
  registerUser,
  logout,
  clearError,
} from '@/store/slices/authSlice'
import type { UserLoginPayload, UserRegisterPayload } from '@/types'

/**
 * Primary auth hook.
 * Wraps the auth slice so components never import from the store directly.
 */
export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (s) => s.auth,
  )

  const login = (payload: UserLoginPayload) => dispatch(loginUser(payload))
  const register = (payload: UserRegisterPayload) =>
    dispatch(registerUser(payload))
  const signOut = () => dispatch(logout())
  const dismissError = () => dispatch(clearError())

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    signOut,
    dismissError,
  }
}
