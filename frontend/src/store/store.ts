import { configureStore } from '@reduxjs/toolkit'
import { setStoreInstance } from '../services/api'

import authReducer from './slices/authSlice'
import profileReducer from './slices/profileSlice'
import roomReducer from './slices/roomSlice'
import gameCoinReducer from './slices/gameCoinSlice'
import compatibilityReducer from './slices/compatibilitySlice'
import lobbyReducer from './slices/lobbySlice'
import matchmakingReducer from './slices/matchmakingSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    room: roomReducer,
    gameCoin: gameCoinReducer,
    compatibility: compatibilityReducer,
    lobby: lobbyReducer,
    matchmaking: matchmakingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

// Set store instance for API interceptors
setStoreInstance(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch