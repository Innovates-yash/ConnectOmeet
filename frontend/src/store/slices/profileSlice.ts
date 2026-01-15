import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { profileApi } from '../../services/api'

export interface Profile {
  id: string
  userId: string
  avatarId: string
  displayName: string
  bio: string
  interestTags: string[]
  gameExperience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  gamesPlayed: string[]
  totalGamesWon: number
  totalGamesPlayed: number
  createdAt: string
  updatedAt: string
}

export interface CreateProfileRequest {
  avatarId: string
  displayName: string
  bio: string
  interestTags: string[]
  gameExperience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
}

export interface ProfileState {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  searchResults: Profile[]
  searchLoading: boolean
  availableAvatars: string[]
  availableInterestTags: string[]
  avatarsLoading: boolean
  tagsLoading: boolean
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
  availableAvatars: [],
  availableInterestTags: [],
  avatarsLoading: false,
  tagsLoading: false,
}

// Async thunks
export const createProfile = createAsyncThunk(
  'profile/create',
  async (profileData: CreateProfileRequest, { rejectWithValue }) => {
    try {
      const response = await profileApi.createProfile(profileData)
      return response.data.data // Backend returns { success: true, message: string, data: Profile }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create profile')
    }
  }
)

export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileApi.getProfile()
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (profileData: Partial<CreateProfileRequest>, { rejectWithValue }) => {
    try {
      const response = await profileApi.updateProfile(profileData)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile')
    }
  }
)

export const searchProfiles = createAsyncThunk(
  'profile/search',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await profileApi.searchProfiles(query)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search profiles')
    }
  }
)

export const fetchAvailableAvatars = createAsyncThunk(
  'profile/fetchAvatars',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileApi.getAvailableAvatars()
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch avatars')
    }
  }
)

export const fetchAvailableInterestTags = createAsyncThunk(
  'profile/fetchInterestTags',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileApi.getAvailableInterestTags()
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch interest tags')
    }
  }
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Profile
      .addCase(createProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Search Profiles
      .addCase(searchProfiles.pending, (state) => {
        state.searchLoading = true
        state.error = null
      })
      .addCase(searchProfiles.fulfilled, (state, action) => {
        state.searchLoading = false
        state.searchResults = action.payload
      })
      .addCase(searchProfiles.rejected, (state, action) => {
        state.searchLoading = false
        state.error = action.payload as string
      })

      // Fetch Available Avatars
      .addCase(fetchAvailableAvatars.pending, (state) => {
        state.avatarsLoading = true
      })
      .addCase(fetchAvailableAvatars.fulfilled, (state, action) => {
        state.avatarsLoading = false
        state.availableAvatars = action.payload
      })
      .addCase(fetchAvailableAvatars.rejected, (state, action) => {
        state.avatarsLoading = false
        state.error = action.payload as string
      })

      // Fetch Available Interest Tags
      .addCase(fetchAvailableInterestTags.pending, (state) => {
        state.tagsLoading = true
      })
      .addCase(fetchAvailableInterestTags.fulfilled, (state, action) => {
        state.tagsLoading = false
        state.availableInterestTags = action.payload
      })
      .addCase(fetchAvailableInterestTags.rejected, (state, action) => {
        state.tagsLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearSearchResults } = profileSlice.actions
export default profileSlice.reducer