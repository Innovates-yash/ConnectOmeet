import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '../../services/api'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  refreshToken: string | null
  phoneNumber: string | null
  otpSent: boolean
  otpLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  phoneNumber: null,
  otpSent: false,
  otpLoading: false,
  error: null,
}

// Async thunks
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phoneNumber: string, { rejectWithValue }) => {
    try {
      console.log('Sending OTP to:', phoneNumber)
      const response = await authApi.sendOtp(phoneNumber)
      console.log('OTP Response:', response.data)
      return phoneNumber
    } catch (error: any) {
      console.error('OTP Error:', error)
      console.error('Error response:', error.response)
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send OTP')
    }
  }
)

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phoneNumber, otp }: { phoneNumber: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyOtp(phoneNumber, otp)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid OTP')
    }
  }
)

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState }
      if (!auth.refreshToken) {
        throw new Error('No refresh token available')
      }
      const response = await authApi.refreshToken(auth.refreshToken)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh token')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false
      state.token = null
      state.refreshToken = null
      state.phoneNumber = null
      state.otpSent = false
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    clearError: (state) => {
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.otpLoading = true
        state.error = null
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.otpLoading = false
        state.phoneNumber = action.payload
        state.otpSent = true
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.otpLoading = false
        state.error = action.payload as string
      })
      
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Refresh Token
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.isAuthenticated = false
        state.token = null
        state.refreshToken = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      })
  },
})

export const { logout, clearError, setLoading } = authSlice.actions
export default authSlice.reducer