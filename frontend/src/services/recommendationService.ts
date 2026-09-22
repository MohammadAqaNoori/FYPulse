import api from './api'
import type {
  RecommendationListResponse,
  SimilarityCheckPayload,
  SimilarityResult,
  GenerateIdeasPayload,
  GenerateIdeasResponse,
} from '@/types'

const recommendationService = {
  getRecommendations: async (
    topK = 10,
  ): Promise<RecommendationListResponse> => {
    const { data } = await api.get<RecommendationListResponse>(
      `/recommendations/?top_k=${topK}`,
    )
    return data
  },

  checkSimilarity: async (
    payload: SimilarityCheckPayload,
  ): Promise<SimilarityResult> => {
    const { data } = await api.post<SimilarityResult>(
      '/recommendations/similarity-check',
      payload,
    )
    return data
  },

  generateIdeas: async (
    payload: GenerateIdeasPayload,
  ): Promise<GenerateIdeasResponse> => {
    const { data } = await api.post<GenerateIdeasResponse>(
      '/generator/',
      payload,
    )
    return data
  },
}

export default recommendationService
