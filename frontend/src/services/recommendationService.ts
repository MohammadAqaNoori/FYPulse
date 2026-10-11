import { api } from './api'
import type { RecommendationsResponse, SimilarityResult } from '../types'

export const recommendationService = {
  async getRecommendations(top_k = 10): Promise<RecommendationsResponse> {
    const { data } = await api.get<RecommendationsResponse>('/recommendations/', {
      params: { top_k },
    })
    return data
  },

  async checkSimilarity(title: string, description?: string): Promise<SimilarityResult> {
    const { data } = await api.post<SimilarityResult>('/recommendations/similarity-check', {
      title,
      description: description ?? '',
    })
    return data
  },
}
