import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { logout, refreshAuthToken } from '../store/slices/authSlice'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
let storeInstance: any = null;

export const setStoreInstance = (store: any) => {
  storeInstance = store;
};

api.interceptors.request.use(
  (config) => {
    if (storeInstance) {
      const token = storeInstance.getState().auth.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (storeInstance) {
          await storeInstance.dispatch(refreshAuthToken())
          const newToken = storeInstance.getState().auth.token
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        if (storeInstance) {
          storeInstance.dispatch(logout())
          window.location.href = '/auth'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  sendOtp: (phoneNumber: string): Promise<AxiosResponse> =>
    api.post('/auth/send-otp', { phoneNumber }),
  
  verifyOtp: (phoneNumber: string, otp: string): Promise<AxiosResponse> =>
    api.post('/auth/verify-otp', { phoneNumber, otpCode: otp }),
  
  refreshToken: (refreshToken: string): Promise<AxiosResponse> =>
    api.post('/auth/refresh', { refreshToken }),
}

// Profile API
export const profileApi = {
  createProfile: (profileData: any): Promise<AxiosResponse> =>
    api.post('/profile/create', profileData),
  
  getProfile: (): Promise<AxiosResponse> =>
    api.get('/profile/me'),
  
  updateProfile: (profileData: any): Promise<AxiosResponse> =>
    api.put('/profile/update', profileData),
  
  searchProfiles: (query: string): Promise<AxiosResponse> =>
    api.get(`/profile/search?q=${encodeURIComponent(query)}`),

  getAvailableAvatars: (): Promise<AxiosResponse> =>
    api.get('/profile/avatars'),

  getAvailableInterestTags: (): Promise<AxiosResponse> =>
    api.get('/profile/interest-tags'),
}

// Room API
export const roomApi = {
  getRooms: (): Promise<AxiosResponse> =>
    api.get('/rooms'),
  
  createRoom: (roomData: { name: string; description?: string }): Promise<AxiosResponse> =>
    api.post('/rooms', roomData),
  
  joinRoom: (roomId: string): Promise<AxiosResponse> =>
    api.post(`/rooms/${roomId}/join`),
  
  leaveRoom: (roomId: string): Promise<AxiosResponse> =>
    api.post(`/rooms/${roomId}/leave`),
  
  getMessages: (roomId: string): Promise<AxiosResponse> =>
    api.get(`/rooms/${roomId}/messages`),
  
  sendMessage: (roomId: string, content: string): Promise<AxiosResponse> =>
    api.post(`/rooms/${roomId}/messages`, { content }),
}

// GameCoin API
export const gameCoinApi = {
  getBalance: (): Promise<AxiosResponse> =>
    api.get('/gamecoins/balance'),
  
  getTransactions: (): Promise<AxiosResponse> =>
    api.get('/gamecoins/transactions'),
  
  claimDailyBonus: (): Promise<AxiosResponse> =>
    api.post('/gamecoins/daily-bonus'),
  
  spendCoins: (amount: number, description: string): Promise<AxiosResponse> =>
    api.post('/gamecoins/spend', { amount, description }),
  
  getGamePricing: (): Promise<AxiosResponse> =>
    api.get('/gamecoins/game-pricing'),
}

// Compatibility API
export const compatibilityApi = {
  getMatches: (limit: number = 10): Promise<AxiosResponse> =>
    api.get(`/compatibility/matches?limit=${limit}`),
  
  getScore: (userId: string): Promise<AxiosResponse> =>
    api.get(`/compatibility/score/${userId}`),
  
  getLeaderboard: (): Promise<AxiosResponse> =>
    api.get('/compatibility/leaderboard'),
}

export default api