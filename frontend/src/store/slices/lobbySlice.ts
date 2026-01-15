import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface LobbyParticipant {
  id: string
  displayName: string
  avatarId: string
  isCreator: boolean
}

export interface PrivateLobby {
  id: string
  inviteCode: string
  creatorId: string
  participants: LobbyParticipant[]
  maxCapacity: number
  gameType?: string
  createdAt: string
  expiresAt: string
  isActive: boolean
}

interface LobbyState {
  currentLobby: PrivateLobby | null
  isLoading: boolean
  error: string | null
  joinLoading: boolean
  createLoading: boolean
}

const initialState: LobbyState = {
  currentLobby: null,
  isLoading: false,
  error: null,
  joinLoading: false,
  createLoading: false,
}

// Generate a random 6-character invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Async thunks for API calls
export const createPrivateLobby = createAsyncThunk(
  'lobby/createPrivateLobby',
  async (gameType?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const inviteCode = generateInviteCode()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    
    const lobby: PrivateLobby = {
      id: `lobby_${Date.now()}`,
      inviteCode,
      creatorId: 'current-user-id', // This would come from auth state
      participants: [{
        id: 'current-user-id',
        displayName: 'TestUser', // This would come from profile state
        avatarId: 'cyber-warrior-01',
        isCreator: true
      }],
      maxCapacity: gameType ? getGameCapacity(gameType) : 8,
      gameType,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true
    }
    
    return lobby
  }
)

export const joinLobbyByCode = createAsyncThunk(
  'lobby/joinLobbyByCode',
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate different scenarios
      if (inviteCode === 'EXPIRE') {
        throw new Error('This invite code has expired')
      }
      if (inviteCode === 'FULL') {
        throw new Error('This lobby is full')
      }
      if (inviteCode === 'NOTFND') {
        throw new Error('Invalid invite code')
      }
      
      // Simulate successful join
      const lobby: PrivateLobby = {
        id: `lobby_${Date.now()}`,
        inviteCode,
        creatorId: 'other-user-id',
        participants: [
          {
            id: 'other-user-id',
            displayName: 'LobbyCreator',
            avatarId: 'cyber-warrior-02',
            isCreator: true
          },
          {
            id: 'current-user-id',
            displayName: 'TestUser',
            avatarId: 'cyber-warrior-01',
            isCreator: false
          }
        ],
        maxCapacity: 8,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(), // 23 hours from now
        isActive: true
      }
      
      return lobby
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  }
)

export const leaveLobby = createAsyncThunk(
  'lobby/leaveLobby',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    return null
  }
)

export const startGame = createAsyncThunk(
  'lobby/startGame',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { lobby: LobbyState }
      const lobby = state.lobby.currentLobby
      
      if (!lobby) {
        throw new Error('No active lobby')
      }
      
      if (lobby.participants.length < 2) {
        throw new Error('Need at least 2 players to start a game')
      }
      
      // Simulate API call to start game
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { gameSessionId: `game_${Date.now()}`, lobbyId: lobby.id }
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  }
)

// Helper function to get game-specific capacity
const getGameCapacity = (gameType: string): number => {
  const capacities: Record<string, number> = {
    'chess': 2,
    'racing': 4,
    'uno': 8,
    'rummy': 6,
    'ludo': 4,
    'truth-or-dare': 8,
    'fighting': 2,
    'bubble-blast': 8,
    'math-master': 8
  }
  return capacities[gameType] || 8
}

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearLobby: (state) => {
      state.currentLobby = null
      state.error = null
    },
    updateParticipants: (state, action: PayloadAction<LobbyParticipant[]>) => {
      if (state.currentLobby) {
        state.currentLobby.participants = action.payload
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create lobby
      .addCase(createPrivateLobby.pending, (state) => {
        state.createLoading = true
        state.error = null
      })
      .addCase(createPrivateLobby.fulfilled, (state, action) => {
        state.createLoading = false
        state.currentLobby = action.payload
      })
      .addCase(createPrivateLobby.rejected, (state, action) => {
        state.createLoading = false
        state.error = action.error.message || 'Failed to create lobby'
      })
      
      // Join lobby
      .addCase(joinLobbyByCode.pending, (state) => {
        state.joinLoading = true
        state.error = null
      })
      .addCase(joinLobbyByCode.fulfilled, (state, action) => {
        state.joinLoading = false
        state.currentLobby = action.payload
      })
      .addCase(joinLobbyByCode.rejected, (state, action) => {
        state.joinLoading = false
        state.error = action.payload as string
      })
      
      // Leave lobby
      .addCase(leaveLobby.fulfilled, (state) => {
        state.currentLobby = null
        state.error = null
      })
      
      // Start game
      .addCase(startGame.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(startGame.fulfilled, (state) => {
        state.isLoading = false
        // Game started successfully - lobby remains active until game ends
      })
      .addCase(startGame.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearLobby, updateParticipants } = lobbySlice.actions
export default lobbySlice.reducer