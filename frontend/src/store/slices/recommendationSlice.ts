import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'
import type {
  Recommendation,
  RecommendationListResponse,
  SimilarityCheckPayload,
  SimilarityResult,
} from '@/types'

// ─── State ────────────────────────────────────────────────────────────────────

interface RecommendationState {
  recommendations: Recommendation[]
  total: number
  isLoading: boolean
  error: string | null
  similarityResult: SimilarityResult | null
  similarityLoading: boolean
}

const initialState: RecommendationState = {
  recommendations: [],
  total: 0,
  isLoading: false,
  error: null,
  similarityResult: null,
  similarityLoading: false,
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetch',
  async (topK: number = 10, { rejectWithValue }) => {
    try {
      const { data } = await api.get<RecommendationListResponse>(
        `/recommendations/?top_k=${topK}`,
      )
      return data
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err))
    }
  },
)

export const checkSimilarity = createAsyncThunk(
  'recommendations/similarity',
  async (payload: SimilarityCheckPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<SimilarityResult>(
        '/recommendations/similarity-check',
        payload,
      )
      return data
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err))
    }
  },
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response
  ) {
    const detail = (err.response as { data: { detail?: unknown } }).data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ')
  }
  return 'Something went wrong. Please try again.'
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const recommendationSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    clearRecommendationError(state) {
      state.error = null
    },
    clearSimilarityResult(state) {
      state.similarityResult = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.isLoading = false
        state.recommendations = action.payload.recommendations
        state.total = action.payload.total
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      .addCase(checkSimilarity.pending, (state) => {
        state.similarityLoading = true
      })
      .addCase(checkSimilarity.fulfilled, (state, action) => {
        state.similarityLoading = false
        state.similarityResult = action.payload
      })
      .addCase(checkSimilarity.rejected, (state) => {
        state.similarityLoading = false
      })
  },
})

export const { clearRecommendationError, clearSimilarityResult } =
  recommendationSlice.actions
export default recommendationSlice.reducer
