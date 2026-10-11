import { api } from './api'
import type { GenerateIdeasResponse } from '../types'

export const generatorService = {
  async generateIdeas(
    count = 5,
    extra_skills?: string[],
    extra_interests?: string[]
  ): Promise<GenerateIdeasResponse> {
    const { data } = await api.post<GenerateIdeasResponse>('/generator/', {
      count,
      extra_skills: extra_skills ?? [],
      extra_interests: extra_interests ?? [],
    })
    return data
  },
}
