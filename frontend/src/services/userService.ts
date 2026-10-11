import { api } from './api'
import type { UserResponse, ProfileResponse, ProfileCreate } from '../types'

export const userService = {
  async getMe(): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>('/users/me')
    return data
  },

  async getProfile(): Promise<ProfileResponse> {
    const { data } = await api.get<ProfileResponse>('/users/me/profile')
    return data
  },

  async createProfile(payload: ProfileCreate): Promise<ProfileResponse> {
    const { data } = await api.post<ProfileResponse>('/users/me/profile', payload)
    return data
  },

  async updateProfile(payload: ProfileCreate): Promise<ProfileResponse> {
    const { data } = await api.put<ProfileResponse>('/users/me/profile', payload)
    return data
  },
}
