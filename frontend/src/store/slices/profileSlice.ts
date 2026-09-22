import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'
import type { Profile, ProfilePayload } from '@/types'

// ─── State ────────────────────────────────────────────────────────────────────

interface ProfileState {
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<Profile>('/users/me/profile')
      return data
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err))
    }
  },
)

export const createProfile = createAsyncThunk(
  'profile/create',
  async (payload: ProfilePayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<Profile>('/users/me/profile', payload)
      return data
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err))
    }
  },
)

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (payload: ProfilePayload, { rejectWithValue }) => {
    try {
      const { data } = await api.put<Profile>('/users/me/profile', payload)
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

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError(state) {
      state.error = null
    },
    resetProfile(state) {
      state.profile = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const pending = (state: ProfileState) => {
      state.isLoading = true
      state.error = null
    }
    const fulfilled = (state: ProfileState, action: { payload: Profile }) => {
      state.isLoading = false
      state.profile = action.payload
    }
    const rejected = (state: ProfileState, action: { payload: unknown }) => {
      state.isLoading = false
      state.error = action.payload as string
    }

    builder
      .addCase(fetchProfile.pending, pending)
      .addCase(fetchProfile.fulfilled, fulfilled)
      .addCase(fetchProfile.rejected, rejected)

      .addCase(createProfile.pending, pending)
      .addCase(createProfile.fulfilled, fulfilled)
      .addCase(createProfile.rejected, rejected)

      .addCase(updateProfile.pending, pending)
      .addCase(updateProfile.fulfilled, fulfilled)
      .addCase(updateProfile.rejected, rejected)
  },
})

export const { clearProfileError, resetProfile } = profileSlice.actions
export default profileSlice.reducer
