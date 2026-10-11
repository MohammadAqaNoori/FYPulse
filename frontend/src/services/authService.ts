import { api } from './api'
import type { TokenResponse } from '../types'

export const authService = {
  async register(full_name: string, email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/register', {
      full_name,
      email,
      password,
    })
    return data
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    // Backend uses OAuth2PasswordRequestForm (form-encoded)
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    const { data } = await api.post<TokenResponse>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },
}
