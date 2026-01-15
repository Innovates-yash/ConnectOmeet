import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface MatchmakingState {
  isInQueue: boolean
  queueStartTime: number | null
  estimatedWaitTime: number
  gameType: string | null
  skillLevel: string | null
  status: 'idle' | 'searching' | 'found' | 'cancelled' | 'error'
  matchFound: boolean
  matchDetails: {
    sessionId: string | null
    opponents: Array<{
      id: string
      displayName: string
      skillLevel: string
    }>
    gameType: string | null
  } | null
  error: string | null
  queuePosition: number | null
  alternativeGames: string[]
}

const initialState: MatchmakingState = {
  isInQueue: false,
  queueStartTime: null,
  estimatedWaitTime: 30,
  gameType: null,
  skillLevel: null,
  status: 'idle',
  matchFound: false,
  matchDetails: null,
  error: null,
  queuePosition: null,
  alternativeGames: []
}

// Async thunks for matchmaking operations
export const joinQueue = createAsyncThunk(
  'matchmaking/joinQueue',
  async (params: { gameType: string; skillLevel?: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to join queue')
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error occurred')
    }
  }
)

export const leaveQueue = createAsyncThunk(
  'matchmaking/leaveQueue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/matchmaking/leave', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to leave queue')
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error occurred')
    }
  }
)

export const getQueueStatus = createAsyncThunk(
  'matchmaking/getQueueStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/matchmaking/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to get queue status')
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error occurred')
    }
  }
)

const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState,
  reducers: {
    resetMatchmaking: () => {
      return { ...initialState }
    },
    updateQueuePosition: (state, action: PayloadAction<number>) => {
      state.queuePosition = action.payload
    },
    updateEstimatedWaitTime: (state, action: PayloadAction<number>) => {
      state.estimatedWaitTime = action.payload
    },
    setMatchFound: (state, action: PayloadAction<{
      sessionId: string
      opponents: Array<{
        id: string
        displayName: string
        skillLevel: string
      }>
      gameType: string
    }>) => {
      state.matchFound = true
      state.status = 'found'
      state.isInQueue = false
      state.matchDetails = action.payload
    },
    setAlternativeGames: (state, action: PayloadAction<string[]>) => {
      state.alternativeGames = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    updateQueueTime: (state) => {
      if (state.queueStartTime) {
        // This will be called by a timer to update elapsed time
        const elapsed = Date.now() - state.queueStartTime
        if (elapsed > 60000) { // After 60 seconds, suggest alternatives
          state.status = 'error'
          state.error = 'Queue timeout - try alternative games'
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Join queue
      .addCase(joinQueue.pending, (state) => {
        state.status = 'searching'
        state.error = null
        state.queueStartTime = Date.now()
        state.isInQueue = true
      })
      .addCase(joinQueue.fulfilled, (state, action) => {
        state.gameType = action.payload.gameType
        state.skillLevel = action.payload.skillLevel
        state.queuePosition = action.payload.queuePosition
        state.estimatedWaitTime = action.payload.estimatedWaitTime
      })
      .addCase(joinQueue.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload as string
        state.isInQueue = false
        state.queueStartTime = null
      })
      
      // Leave queue
      .addCase(leaveQueue.pending, (state) => {
        state.status = 'idle'
      })
      .addCase(leaveQueue.fulfilled, (state) => {
        state.isInQueue = false
        state.queueStartTime = null
        state.status = 'cancelled'
        state.gameType = null
        state.skillLevel = null
        state.queuePosition = null
      })
      .addCase(leaveQueue.rejected, (state, action) => {
        state.error = action.payload as string
      })
      
      // Get queue status
      .addCase(getQueueStatus.fulfilled, (state, action) => {
        if (action.payload.isInQueue) {
          state.isInQueue = true
          state.queuePosition = action.payload.queuePosition
          state.estimatedWaitTime = action.payload.estimatedWaitTime
          state.gameType = action.payload.gameType
          state.status = 'searching'
        }
      })
  }
})

export const {
  resetMatchmaking,
  updateQueuePosition,
  updateEstimatedWaitTime,
  setMatchFound,
  setAlternativeGames,
  clearError,
  updateQueueTime
} = matchmakingSlice.actions

export default matchmakingSlice.reducer