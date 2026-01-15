import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the store
vi.mock('../../store/store', () => ({
  store: {
    getState: vi.fn(() => ({
      auth: { token: 'mock-token', refreshToken: 'mock-refresh-token' }
    })),
    dispatch: vi.fn()
  }
}))

// Create mock axios instance
const mockAxiosInstance = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('API Configuration', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockAxiosInstance.post.mockClear()
    mockAxiosInstance.get.mockClear()
    mockAxiosInstance.put.mockClear()
    mockAxiosInstance.delete.mockClear()
  })

  describe('Auth API', () => {
    it('should send OTP request', async () => {
      const { authApi } = await import('../api')
      const phoneNumber = '+1234567890'
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } })

      await authApi.sendOtp(phoneNumber)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/send-otp', { phoneNumber })
    })

    it('should verify OTP', async () => {
      const { authApi } = await import('../api')
      const phoneNumber = '+1234567890'
      const otp = '1234'
      mockAxiosInstance.post.mockResolvedValue({ data: { token: 'jwt-token' } })

      await authApi.verifyOtp(phoneNumber, otp)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/verify-otp', { phoneNumber, otp })
    })

    it('should refresh token', async () => {
      const { authApi } = await import('../api')
      const refreshToken = 'refresh-token'
      mockAxiosInstance.post.mockResolvedValue({ data: { token: 'new-jwt-token' } })

      await authApi.refreshToken(refreshToken)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken })
    })
  })

  describe('Profile API', () => {
    it('should create profile', async () => {
      const { profileApi } = await import('../api')
      const profileData = { displayName: 'Test User', avatar: 'avatar1' }
      mockAxiosInstance.post.mockResolvedValue({ data: { id: '1', ...profileData } })

      await profileApi.createProfile(profileData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/profile/create', profileData)
    })

    it('should get current user profile', async () => {
      const { profileApi } = await import('../api')
      mockAxiosInstance.get.mockResolvedValue({ data: { id: '1', displayName: 'Test User' } })

      await profileApi.getProfile()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/profile/me')
    })

    it('should update profile', async () => {
      const { profileApi } = await import('../api')
      const profileData = { displayName: 'Updated User' }
      mockAxiosInstance.put.mockResolvedValue({ data: { id: '1', ...profileData } })

      await profileApi.updateProfile(profileData)

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/profile/update', profileData)
    })

    it('should search profiles', async () => {
      const { profileApi } = await import('../api')
      const query = 'test user'
      mockAxiosInstance.get.mockResolvedValue({ data: [] })

      await profileApi.searchProfiles(query)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/profile/search?q=test%20user')
    })
  })

  describe('Room API', () => {
    it('should get rooms', async () => {
      const { roomApi } = await import('../api')
      mockAxiosInstance.get.mockResolvedValue({ data: [] })

      await roomApi.getRooms()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/rooms')
    })

    it('should create room', async () => {
      const { roomApi } = await import('../api')
      const roomData = { name: 'Test Room', description: 'A test room' }
      mockAxiosInstance.post.mockResolvedValue({ data: { id: '1', ...roomData } })

      await roomApi.createRoom(roomData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/rooms', roomData)
    })

    it('should join room', async () => {
      const { roomApi } = await import('../api')
      const roomId = 'room-123'
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } })

      await roomApi.joinRoom(roomId)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/rooms/room-123/join')
    })

    it('should leave room', async () => {
      const { roomApi } = await import('../api')
      const roomId = 'room-123'
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } })

      await roomApi.leaveRoom(roomId)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/rooms/room-123/leave')
    })

    it('should get messages', async () => {
      const { roomApi } = await import('../api')
      const roomId = 'room-123'
      mockAxiosInstance.get.mockResolvedValue({ data: [] })

      await roomApi.getMessages(roomId)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/rooms/room-123/messages')
    })

    it('should send message', async () => {
      const { roomApi } = await import('../api')
      const roomId = 'room-123'
      const content = 'Hello, world!'
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } })

      await roomApi.sendMessage(roomId, content)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/rooms/room-123/messages', { content })
    })
  })

  describe('GameCoin API', () => {
    it('should get balance', async () => {
      const { gameCoinApi } = await import('../api')
      mockAxiosInstance.get.mockResolvedValue({ data: { balance: 1000 } })

      await gameCoinApi.getBalance()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/gamecoins/balance')
    })

    it('should get transactions', async () => {
      const { gameCoinApi } = await import('../api')
      mockAxiosInstance.get.mockResolvedValue({ data: [] })

      await gameCoinApi.getTransactions()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/gamecoins/transactions')
    })

    it('should claim daily bonus', async () => {
      const { gameCoinApi } = await import('../api')
      mockAxiosInstance.post.mockResolvedValue({ data: { bonusAmount: 100 } })

      await gameCoinApi.claimDailyBonus()

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/gamecoins/daily-bonus')
    })

    it('should spend coins', async () => {
      const { gameCoinApi } = await import('../api')
      const amount = 50
      const description = 'Game entry fee'
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } })

      await gameCoinApi.spendCoins(amount, description)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/gamecoins/spend', { amount, description })
    })

    it('should get game pricing', async () => {
      const { gameCoinApi } = await import('../api')
      mockAxiosInstance.get.mockResolvedValue({ data: {} })

      await gameCoinApi.getGamePricing()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/gamecoins/game-pricing')
    })
  })

  describe('Compatibility API', () => {
    it('should get matches', async () => {
      const { compatibilityApi } = await import('../api')
      const limit = 10
      mockAxiosInstance.get.mockResolvedValue({ data: [] })

      await compatibilityApi.getMatches(limit)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/compatibility/matches?limit=10')
    })

    it('should get compatibility score', async () => {
      const { compatibilityApi } = await import('../api')
      const userId = 'user-123'
      mockAxiosInstance.get.mockResolvedValue({ data: { score: 85 } })

      await compatibilityApi.getScore(userId)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/compatibility/score/user-123')
    })

    it('should get leaderboard', async () => {
      const { compatibilityApi } = await import('../api')
      mockAxiosInstance.get.mockResolvedValue({ data: [] })

      await compatibilityApi.getLeaderboard()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/compatibility/leaderboard')
    })
  })
})