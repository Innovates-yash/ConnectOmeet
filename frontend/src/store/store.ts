import { configureStore } from '@reduxjs/toolkit'

import authSlice from './slices/authSlice'
import profileSlice from './slices/profileSlice'
import roomSlice from './slices/roomSlice'
import gameCoinSlice from './slices/gameCoinSlice'
import compatibilitySlice from './slices/compatibilitySlice'
import lobbySlice from './slices/lobbySlice'
import matchmakingSlice from './slices/matchmakingSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    room: roomSlice,
    gameCoin: gameCoinSlice,
    compatibility: compatibilitySlice,
    lobby: lobbySlice,
    matchmaking: matchmakingSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch