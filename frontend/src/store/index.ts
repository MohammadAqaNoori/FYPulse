import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import profileReducer from './slices/profileSlice'
import recommendationReducer from './slices/recommendationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    recommendations: recommendationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for Date objects in API responses
        ignoredActionPaths: ['payload.created_at', 'payload.updated_at'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
