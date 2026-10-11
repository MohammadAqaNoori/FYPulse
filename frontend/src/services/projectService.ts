import { api } from './api'
import type { ProjectResponse, ProjectListResponse } from '../types'

export interface SearchParams {
  query?: string
  technologies?: string[]
  domains?: string[]
  difficulty_level?: string
  page?: number
  page_size?: number
}

export const projectService = {
  async listProjects(page = 1, page_size = 20): Promise<ProjectListResponse> {
    const { data } = await api.get<ProjectListResponse>('/projects/', {
      params: { page, page_size },
    })
    return data
  },

  async searchProjects(params: SearchParams): Promise<ProjectListResponse> {
    const { data } = await api.get<ProjectListResponse>('/projects/search', {
      params: {
        ...params,
        technologies: params.technologies?.join(','),
        domains: params.domains?.join(','),
      },
    })
    return data
  },

  async getProject(id: number): Promise<ProjectResponse> {
    const { data } = await api.get<ProjectResponse>(`/projects/${id}`)
    return data
  },
}
