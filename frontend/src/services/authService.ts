import api, { tokenStorage } from './api'
import type {
  TokenResponse,
  UserRegisterPayload,
  UserLoginPayload,
  User,
} from '@/types'

// Backend expects OAuth2PasswordRequestForm for login (form-encoded)
const authService = {
  register: async (payload: UserRegisterPayload): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>('/auth/register', payload)
    tokenStorage.setTokens(data.access_token, data.refresh_token)
    return data
  },

  /**
   * Backend login route uses OAuth2PasswordRequestForm,
   * so we must send application/x-www-form-urlencoded with
   * `username` (= email) and `password` fields.
   */
  login: async (payload: UserLoginPayload): Promise<TokenResponse> => {
    const formData = new URLSearchParams()
    formData.append('username', payload.email)
    formData.append('password', payload.password)

    const { data } = await api.post<TokenResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    tokenStorage.setTokens(data.access_token, data.refresh_token)
    return data
  },

  logout: (): void => {
    tokenStorage.clear()
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/users/me')
    return data
  },
}

export default authService
