import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import authService from '@/services/authService'
import { tokenStorage } from '@/services/api'
import type { User, UserRegisterPayload, UserLoginPayload } from '@/types'

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!tokenStorage.getAccess(),
  isLoading: false,
  error: null,
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: UserRegisterPayload, { rejectWithValue }) => {
    try {
      const data = await authService.register(payload)
      return data.user
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      return rejectWithValue(msg)
    }
  },
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: UserLoginPayload, { rejectWithValue }) => {
    try {
      const data = await authService.login(payload)
      return data.user
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      return rejectWithValue(msg)
    }
  },
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe()
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      return rejectWithValue(msg)
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      authService.logout()
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
    clearError(state) {
      state.error = null
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isAuthenticated = true
    },
  },
  extraReducers: (builder) => {
    // ── Register ──
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // ── Login ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // ── Fetch Me ──
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        tokenStorage.clear()
      })
  },
})

export const { logout, clearError, setUser } = authSlice.actions
export default authSlice.reducer
