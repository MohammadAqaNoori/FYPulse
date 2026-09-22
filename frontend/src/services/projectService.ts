import api from './api'
import type { Project, ProjectSearchParams, PaginatedProjects } from '@/types'

const projectService = {
  getAll: async (page = 1, pageSize = 20): Promise<PaginatedProjects> => {
    const { data } = await api.get<PaginatedProjects>(
      `/projects/?page=${page}&page_size=${pageSize}`,
    )
    return data
  },

  search: async (params: ProjectSearchParams): Promise<PaginatedProjects> => {
    const query = new URLSearchParams()
    if (params.query) query.append('query', params.query)
    if (params.difficulty_level)
      query.append('difficulty_level', params.difficulty_level)
    if (params.page) query.append('page', String(params.page))
    if (params.page_size) query.append('page_size', String(params.page_size))
    params.technologies?.forEach((t) => query.append('technologies', t))
    params.domains?.forEach((d) => query.append('domains', d))

    const { data } = await api.get<PaginatedProjects>(
      `/projects/search?${query.toString()}`,
    )
    return data
  },

  getById: async (id: number): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`)
    return data
  },
}

export default projectService
