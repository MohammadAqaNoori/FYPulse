import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchRecommendations,
  checkSimilarity,
  clearSimilarityResult,
  clearRecommendationError,
} from '@/store/slices/recommendationSlice'
import type { SimilarityCheckPayload } from '@/types'

export function useRecommendations() {
  const dispatch = useAppDispatch()
  const { recommendations, total, isLoading, error, similarityResult, similarityLoading } =
    useAppSelector((s) => s.recommendations)

  const loadRecommendations = useCallback(
    (topK: number = 10) => dispatch(fetchRecommendations(topK)),
    [dispatch],
  )

  const runSimilarityCheck = useCallback(
    (payload: SimilarityCheckPayload) => dispatch(checkSimilarity(payload)),
    [dispatch],
  )

  const resetSimilarity = useCallback(
    () => dispatch(clearSimilarityResult()),
    [dispatch],
  )

  const dismissError = useCallback(
    () => dispatch(clearRecommendationError()),
    [dispatch],
  )

  return {
    recommendations,
    total,
    isLoading,
    error,
    similarityResult,
    similarityLoading,
    loadRecommendations,
    runSimilarityCheck,
    resetSimilarity,
    dismissError,
  }
}
