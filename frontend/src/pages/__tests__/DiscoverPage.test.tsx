import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import DiscoverPage from '../DiscoverPage'
import authSlice from '../../store/slices/authSlice'
import profileSlice from '../../store/slices/profileSlice'
import gameCoinSlice from '../../store/slices/gameCoinSlice'
import roomSlice from '../../store/slices/roomSlice'
import compatibilitySlice from '../../store/slices/compatibilitySlice'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the async thunks
vi.mock('../../store/slices/compatibilitySlice', async () => {
  const actual = await vi.importActual('../../store/slices/compatibilitySlice')
  return {
    ...actual,
    fetchRecommendations: vi.fn(() => ({ type: 'compatibility/fetchRecommendations/fulfilled', payload: [] })),
    likeProfile: vi.fn(() => ({ type: 'compatibility/likeProfile/fulfilled', payload: { profileId: 1, action: 'like' } })),
    passProfile: vi.fn(() => ({ type: 'compatibility/passProfile/fulfilled', payload: { profileId: 1, action: 'pass' } })),
  }
})

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      profile: profileSlice,
      gameCoin: gameCoinSlice,
      room: roomSlice,
      compatibility: compatibilitySlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        isLoading: false,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        phoneNumber: '+1234567890',
        otpSent: false,
        otpLoading: false,
        error: null,
      },
      profile: {
        profile: {
          id: '1',
          userId: 'user-1',
          displayName: 'TestUser',
          avatarId: 'cyber-warrior-01',
          interestTags: ['FPS', 'Strategy'],
          gameExperience: 'INTERMEDIATE' as const,
          bio: 'Test user bio',
          gamesPlayed: ['chess', 'racing'],
          totalGamesPlayed: 10,
          totalGamesWon: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        searchResults: [],
        searchLoading: false,
        availableAvatars: [],
        availableInterestTags: [],
        avatarsLoading: false,
        tagsLoading: false,
        isLoading: false,
        error: null,
      },
      gameCoin: {
        balance: 1000,
        transactions: [],
        dailyBonusAvailable: false,
        lastBonusClaimedAt: null,
        isLoading: false,
        error: null,
      },
      room: {
        currentRoom: null,
        rooms: [],
        participants: [],
        messages: [],
        isConnected: false,
        isLoading: false,
        error: null,
      },
      compatibility: {
        matches: [],
        currentMatch: null,
        recommendations: [
          {
            id: 1,
            displayName: 'CyberNinja',
            avatarId: 'cyber-warrior-01',
            interestTags: ['FPS', 'Strategy', 'RPG'],
            gameExperience: 'Advanced',
            bio: 'Competitive gamer',
            compatibilityScore: 87,
            totalGamesPlayed: 150,
            totalGamesWon: 120
          },
          {
            id: 2,
            displayName: 'PixelMaster',
            avatarId: 'cyber-warrior-02',
            interestTags: ['Puzzle', 'Arcade'],
            gameExperience: 'Intermediate',
            bio: 'Indie game enthusiast',
            compatibilityScore: 72,
            totalGamesPlayed: 89,
            totalGamesWon: 45
          }
        ],
        scores: {},
        leaderboard: [],
        leaderboardLoading: false,
        isLoading: false,
        error: null,
      },
      ...initialState,
    },
  })
}

const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('DiscoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Profile Display', () => {
    it('should display the first profile from recommendations', () => {
      renderWithProviders(<DiscoverPage />)

      expect(screen.getByText('CyberNinja')).toBeInTheDocument()
      expect(screen.getByText('Advanced Gamer')).toBeInTheDocument()
      expect(screen.getByText('87% Match')).toBeInTheDocument()
      expect(screen.getByText('Competitive gamer')).toBeInTheDocument()
      expect(screen.getByText('FPS')).toBeInTheDocument()
      expect(screen.getByText('Strategy')).toBeInTheDocument()
      expect(screen.getByText('RPG')).toBeInTheDocument()
    })

    it('should display profile statistics correctly', () => {
      renderWithProviders(<DiscoverPage />)

      expect(screen.getByText('150')).toBeInTheDocument() // Games played
      expect(screen.getByText('80%')).toBeInTheDocument() // Win rate (120/150 * 100)
    })

    it('should show compatibility score with appropriate color coding', () => {
      renderWithProviders(<DiscoverPage />)

      const compatibilityBadge = screen.getByText('87% Match')
      expect(compatibilityBadge).toHaveClass('text-green-400')
    })

    it('should display progress counter', () => {
      renderWithProviders(<DiscoverPage />)

      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate back to dashboard when back button is clicked', () => {
      renderWithProviders(<DiscoverPage />)

      const backButton = screen.getByText('← Back to Dashboard')
      fireEvent.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('should navigate to dashboard when no more profiles', () => {
      const storeWithNoProfiles = createMockStore({
        compatibility: {
          matches: [],
          currentMatch: null,
          recommendations: [],
          scores: {},
          leaderboard: [],
          leaderboardLoading: false,
          isLoading: false,
          error: null,
        },
      })

      renderWithProviders(<DiscoverPage />, storeWithNoProfiles)

      // Should show the no more profiles state
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument()
    })
  })

  describe('Profile Interactions', () => {
    it('should show like and pass buttons', () => {
      renderWithProviders(<DiscoverPage />)

      expect(screen.getByText('Like')).toBeInTheDocument()
      expect(screen.getByText('Pass')).toBeInTheDocument()
    })

    it('should handle like button click', async () => {
      const store = createMockStore()
      renderWithProviders(<DiscoverPage />, store)

      const likeButton = screen.getByText('Like')
      fireEvent.click(likeButton)

      // Should move to next profile after like
      await waitFor(() => {
        expect(screen.getByText('PixelMaster')).toBeInTheDocument()
      })
    })

    it('should handle pass button click', async () => {
      const store = createMockStore()
      renderWithProviders(<DiscoverPage />, store)

      const passButton = screen.getByText('Pass')
      fireEvent.click(passButton)

      // Should move to next profile after pass
      await waitFor(() => {
        expect(screen.getByText('PixelMaster')).toBeInTheDocument()
      })
    })

    it('should show swipe instructions', () => {
      renderWithProviders(<DiscoverPage />)

      expect(screen.getByText('Swipe right to like • Swipe left to pass')).toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state when fetching recommendations', () => {
      const storeWithLoading = createMockStore({
        compatibility: {
          matches: [],
          currentMatch: null,
          recommendations: [],
          scores: {},
          leaderboard: [],
          leaderboardLoading: false,
          isLoading: true,
          error: null,
        },
      })

      renderWithProviders(<DiscoverPage />, storeWithLoading)

      expect(screen.getByText('Finding compatible gamers...')).toBeInTheDocument()
    })

    it('should show error state when fetch fails', () => {
      const storeWithError = createMockStore({
        compatibility: {
          matches: [],
          currentMatch: null,
          recommendations: [],
          scores: {},
          leaderboard: [],
          leaderboardLoading: false,
          isLoading: false,
          error: 'Failed to load profiles',
        },
      })

      renderWithProviders(<DiscoverPage />, storeWithError)

      expect(screen.getByText('Error loading profiles: Failed to load profiles')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should show no more profiles state', () => {
      const storeWithNoProfiles = createMockStore({
        compatibility: {
          matches: [],
          currentMatch: null,
          recommendations: [],
          scores: {},
          leaderboard: [],
          leaderboardLoading: false,
          isLoading: false,
          error: null,
        },
      })

      renderWithProviders(<DiscoverPage />, storeWithNoProfiles)

      // Should show the no more profiles message
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument()
    })
  })

  describe('Compatibility Score Display', () => {
    it('should display high compatibility scores in green', () => {
      renderWithProviders(<DiscoverPage />)

      const highScoreBadge = screen.getByText('87% Match')
      expect(highScoreBadge).toHaveClass('text-green-400')
    })

    it('should display medium compatibility scores in yellow', () => {
      const storeWithMediumScore = createMockStore({
        compatibility: {
          matches: [],
          currentMatch: null,
          recommendations: [
            {
              id: 1,
              displayName: 'TestUser',
              avatarId: 'cyber-warrior-01',
              interestTags: ['FPS'],
              gameExperience: 'Beginner',
              bio: 'Test bio',
              compatibilityScore: 65, // Medium score
              totalGamesPlayed: 10,
              totalGamesWon: 5
            }
          ],
          scores: {},
          leaderboard: [],
          leaderboardLoading: false,
          isLoading: false,
          error: null,
        },
      })

      renderWithProviders(<DiscoverPage />, storeWithMediumScore)

      const mediumScoreBadge = screen.getByText('65% Match')
      expect(mediumScoreBadge).toHaveClass('text-yellow-400')
    })

    it('should display low compatibility scores in red', () => {
      const storeWithLowScore = createMockStore({
        compatibility: {
          matches: [],
          currentMatch: null,
          recommendations: [
            {
              id: 1,
              displayName: 'TestUser',
              avatarId: 'cyber-warrior-01',
              interestTags: ['FPS'],
              gameExperience: 'Beginner',
              bio: 'Test bio',
              compatibilityScore: 25, // Low score
              totalGamesPlayed: 10,
              totalGamesWon: 5
            }
          ],
          scores: {},
          leaderboard: [],
          leaderboardLoading: false,
          isLoading: false,
          error: null,
        },
      })

      renderWithProviders(<DiscoverPage />, storeWithLowScore)

      const lowScoreBadge = screen.getByText('25% Match')
      expect(lowScoreBadge).toHaveClass('text-red-400')
    })
  })

  describe('Win Rate Calculation', () => {
    it('should calculate win rate correctly for profiles with games', () => {
      renderWithProviders(<DiscoverPage />)

      // CyberNinja: 120 wins / 150 games = 80%
      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('should show 0% win rate for profiles with no games', () => {
      const storeWithNoGames = createMockStore({
        compatibility: {
          matches: [],
          currentMatch: null,
          recommendations: [
            {
              id: 1,
              displayName: 'NewUser',
              avatarId: 'cyber-warrior-01',
              interestTags: ['FPS'],
              gameExperience: 'Beginner',
              bio: 'New to gaming',
              compatibilityScore: 50,
              totalGamesPlayed: 0,
              totalGamesWon: 0
            }
          ],
          scores: {},
          leaderboard: [],
          leaderboardLoading: false,
          isLoading: false,
          error: null,
        },
      })

      renderWithProviders(<DiscoverPage />, storeWithNoGames)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      renderWithProviders(<DiscoverPage />)

      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main content
    })

    it('should have clickable buttons with proper labels', () => {
      renderWithProviders(<DiscoverPage />)

      const likeButton = screen.getByRole('button', { name: 'Like' })
      const passButton = screen.getByRole('button', { name: 'Pass' })
      
      expect(likeButton).toBeInTheDocument()
      expect(passButton).toBeInTheDocument()
    })
  })
})