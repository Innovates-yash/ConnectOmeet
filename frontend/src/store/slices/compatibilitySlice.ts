import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { compatibilityApi } from '../../services/api'
import { Profile } from './profileSlice'

export interface CompatibilityMatch {
  profile: Profile
  score: number
  sharedInterests: string[]
  gameExperienceMatch: boolean
}

export interface ProfileRecommendation {
  id: number
  displayName: string
  avatarId: string
  interestTags: string[]
  gameExperience: string
  bio?: string
  compatibilityScore: number
  totalGamesPlayed: number
  totalGamesWon: number
}

export interface CompatibilityState {
  matches: CompatibilityMatch[]
  currentMatch: CompatibilityMatch | null
  recommendations: ProfileRecommendation[]
  scores: Record<number, number>
  isLoading: boolean
  error: string | null
  leaderboard: CompatibilityMatch[]
  leaderboardLoading: boolean
}

const initialState: CompatibilityState = {
  matches: [],
  currentMatch: null,
  recommendations: [],
  scores: {},
  isLoading: false,
  error: null,
  leaderboard: [],
  leaderboardLoading: false,
}

// Async thunks
export const fetchMatches = createAsyncThunk(
  'compatibility/fetchMatches',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await compatibilityApi.getMatches(limit)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch matches')
    }
  }
)

export const fetchRecommendations = createAsyncThunk(
  'compatibility/fetchRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data for now - replace with actual API call
      const mockRecommendations: ProfileRecommendation[] = [
        {
          id: 1,
          displayName: 'CyberNinja',
          avatarId: 'cyber-warrior-01',
          interestTags: ['FPS', 'Strategy', 'RPG'],
          gameExperience: 'Advanced',
          bio: 'Competitive gamer who loves tactical shooters and strategy games. Always looking for new challenges!',
          compatibilityScore: 87,
          totalGamesPlayed: 150,
          totalGamesWon: 120
        },
        {
          id: 2,
          displayName: 'PixelMaster',
          avatarId: 'cyber-warrior-02',
          interestTags: ['Puzzle', 'Arcade', 'Indie'],
          gameExperience: 'Intermediate',
          bio: 'Indie game enthusiast with a passion for creative gameplay mechanics.',
          compatibilityScore: 72,
          totalGamesPlayed: 89,
          totalGamesWon: 45
        },
        {
          id: 3,
          displayName: 'StealthGamer',
          avatarId: 'cyber-warrior-03',
          interestTags: ['Stealth', 'Action', 'Adventure'],
          gameExperience: 'Advanced',
          bio: 'Love games that require patience and strategy. Stealth is my specialty!',
          compatibilityScore: 65,
          totalGamesPlayed: 200,
          totalGamesWon: 140
        },
        {
          id: 4,
          displayName: 'RacingPro',
          avatarId: 'cyber-warrior-04',
          interestTags: ['Racing', 'Sports', 'Simulation'],
          gameExperience: 'Expert',
          bio: 'Speed is life! Racing games are my passion, always pushing for the fastest lap times.',
          compatibilityScore: 58,
          totalGamesPlayed: 300,
          totalGamesWon: 180
        },
        {
          id: 5,
          displayName: 'RPGLegend',
          avatarId: 'cyber-warrior-05',
          interestTags: ['RPG', 'Fantasy', 'Story'],
          gameExperience: 'Expert',
          bio: 'Immersive storytelling and character development are what I live for in gaming.',
          compatibilityScore: 91,
          totalGamesPlayed: 120,
          totalGamesWon: 95
        }
      ]
      
      return mockRecommendations
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recommendations')
    }
  }
)

export const likeProfile = createAsyncThunk(
  'compatibility/likeProfile',
  async (profileId: number, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      return { profileId, action: 'like' }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like profile')
    }
  }
)

export const passProfile = createAsyncThunk(
  'compatibility/passProfile',
  async (profileId: number, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      return { profileId, action: 'pass' }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pass profile')
    }
  }
)

export const getCompatibilityScore = createAsyncThunk(
  'compatibility/getScore',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await compatibilityApi.getScore(userId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get compatibility score')
    }
  }
)

export const fetchLeaderboard = createAsyncThunk(
  'compatibility/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await compatibilityApi.getLeaderboard()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard')
    }
  }
)

const compatibilitySlice = createSlice({
  name: 'compatibility',
  initialState,
  reducers: {
    setCurrentMatch: (state, action: PayloadAction<CompatibilityMatch | null>) => {
      state.currentMatch = action.payload
    },
    removeMatch: (state, action: PayloadAction<string>) => {
      state.matches = state.matches.filter(match => match.profile.id !== action.payload)
      if (state.currentMatch?.profile.id === action.payload) {
        state.currentMatch = null
      }
    },
    clearError: (state) => {
      state.error = null
    },
    clearMatches: (state) => {
      state.matches = []
      state.currentMatch = null
    },
    clearRecommendations: (state) => {
      state.recommendations = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Matches
      .addCase(fetchMatches.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.isLoading = false
        state.matches = action.payload
        if (action.payload.length > 0 && !state.currentMatch) {
          state.currentMatch = action.payload[0]
        }
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Fetch Recommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.isLoading = false
        state.recommendations = action.payload
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Like Profile
      .addCase(likeProfile.fulfilled, (state, action) => {
        // Remove the liked profile from recommendations
        state.recommendations = state.recommendations.filter(
          profile => profile.id !== action.payload.profileId
        )
      })
      
      // Pass Profile
      .addCase(passProfile.fulfilled, (state, action) => {
        // Remove the passed profile from recommendations
        state.recommendations = state.recommendations.filter(
          profile => profile.id !== action.payload.profileId
        )
      })
      
      // Get Compatibility Score
      .addCase(getCompatibilityScore.fulfilled, (state, action) => {
        // Update the score for the specific match if it exists
        const matchIndex = state.matches.findIndex(
          match => match.profile.id === action.payload.userId
        )
        if (matchIndex !== -1) {
          state.matches[matchIndex].score = action.payload.score
        }
        // Also store in scores object
        state.scores[action.payload.userId] = action.payload.score
      })
      
      // Fetch Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboardLoading = true
        state.error = null
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboardLoading = false
        state.leaderboard = action.payload
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.leaderboardLoading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentMatch,
  removeMatch,
  clearError,
  clearMatches,
  clearRecommendations,
} = compatibilitySlice.actions

export default compatibilitySlice.reducer