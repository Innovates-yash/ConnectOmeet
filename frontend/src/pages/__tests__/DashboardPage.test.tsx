import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import DashboardPage from '../DashboardPage'
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

// Mock LogoutButton component
vi.mock('../../components/auth/LogoutButton', () => ({
  default: ({ variant }: { variant?: string }) => (
    <button data-testid="logout-button" data-variant={variant}>
      Logout
    </button>
  ),
}))

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
          displayName: 'TestGamer',
          avatarId: 'cyber-warrior-01',
          interestTags: ['FPS', 'Strategy', 'RPG'],
          gameExperience: 'INTERMEDIATE' as const,
          bio: 'Love playing competitive games!',
          gamesPlayed: ['chess', 'racing'],
          totalGamesPlayed: 25,
          totalGamesWon: 15,
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
        balance: 2500,
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
        recommendations: [],
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Layout', () => {
    it('should render the main dashboard with header and navigation cards', () => {
      renderWithProviders(<DashboardPage />)

      // Check header elements
      expect(screen.getByText('GameVerse')).toBeInTheDocument()
      expect(screen.getByText('💰 2500 GameCoins')).toBeInTheDocument()
      expect(screen.getAllByText('TestGamer')[0]).toBeInTheDocument()
      expect(screen.getAllByText('INTERMEDIATE')[0]).toBeInTheDocument()

      // Check welcome message
      expect(screen.getByText(/Welcome to the Cyberpunk Gaming Universe/)).toBeInTheDocument()
      expect(screen.getAllByText('TestGamer')[0]).toBeInTheDocument()

      // Check all four dashboard cards
      expect(screen.getByText('Meet People')).toBeInTheDocument()
      expect(screen.getByText('The Room (Lounge)')).toBeInTheDocument()
      expect(screen.getByText('Game with Friend')).toBeInTheDocument()
      expect(screen.getByText('Play with Stranger')).toBeInTheDocument()
    })

    it('should display user profile information correctly', () => {
      renderWithProviders(<DashboardPage />)

      // Check profile stats
      expect(screen.getByText('25')).toBeInTheDocument() // Games played
      expect(screen.getByText('60%')).toBeInTheDocument() // Win rate (15/25 * 100)

      // Check interest tags
      expect(screen.getByText('FPS')).toBeInTheDocument()
      expect(screen.getByText('Strategy')).toBeInTheDocument()
      expect(screen.getByText('RPG')).toBeInTheDocument()

      // Check bio
      expect(screen.getByText('Love playing competitive games!')).toBeInTheDocument()
    })

    it('should handle missing profile data gracefully', () => {
      const storeWithoutProfile = createMockStore({
        profile: {
          profile: null,
          searchResults: [],
          searchLoading: false,
          availableAvatars: [],
          availableInterestTags: [],
          avatarsLoading: false,
          tagsLoading: false,
          isLoading: false,
          error: null,
        },
      })

      renderWithProviders(<DashboardPage />, storeWithoutProfile)

      // Should show default values
      expect(screen.getByText('Gamer')).toBeInTheDocument()
      expect(screen.getByText('U')).toBeInTheDocument() // Default avatar initial
    })
  })

  describe('Navigation Functionality', () => {
    it('should navigate to discover page when Meet People card is clicked', () => {
      renderWithProviders(<DashboardPage />)

      const meetPeopleCard = screen.getByText('Meet People').closest('div')
      fireEvent.click(meetPeopleCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/discover')
    })

    it('should navigate to room page when The Room card is clicked', () => {
      renderWithProviders(<DashboardPage />)

      const roomCard = screen.getByText('The Room (Lounge)').closest('div')
      fireEvent.click(roomCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/room')
    })

    it('should navigate to private lobby when Game with Friend card is clicked', () => {
      renderWithProviders(<DashboardPage />)

      const gameWithFriendCard = screen.getByText('Game with Friend').closest('div')
      fireEvent.click(gameWithFriendCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/private-lobby')
    })

    it('should navigate to matchmaking when Play with Stranger card is clicked', () => {
      renderWithProviders(<DashboardPage />)

      const playWithStrangerCard = screen.getByText('Play with Stranger').closest('div')
      fireEvent.click(playWithStrangerCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/matchmaking')
    })
  })

  describe('Card Interactions', () => {
    it('should display hover indicators on card hover', () => {
      renderWithProviders(<DashboardPage />)

      // Check that hover indicators are present (though not visible by default)
      const hoverIndicators = screen.getAllByText('Click to Enter →')
      expect(hoverIndicators).toHaveLength(4)
    })

    it('should have proper cyberpunk styling classes on cards', () => {
      renderWithProviders(<DashboardPage />)

      // Find the actual clickable card container
      const cards = document.querySelectorAll('[class*="cursor-pointer"]')
      expect(cards.length).toBeGreaterThan(0)
      
      const firstCard = cards[0]
      expect(firstCard).toHaveClass('cursor-pointer')
      expect(firstCard).toHaveClass('transition-all')
    })
  })

  describe('Statistics Display', () => {
    it('should calculate and display win rate correctly', () => {
      renderWithProviders(<DashboardPage />)

      // With 15 wins out of 25 games, win rate should be 60%
      expect(screen.getByText('60%')).toBeInTheDocument()
    })

    it('should handle zero games played for win rate calculation', () => {
      const storeWithNoGames = createMockStore({
        profile: {
          profile: {
            id: '1',
            userId: 'user-1',
            displayName: 'NewGamer',
            avatarId: 'cyber-warrior-01',
            interestTags: ['FPS'],
            gameExperience: 'BEGINNER' as const,
            bio: '',
            gamesPlayed: [],
            totalGamesPlayed: 0,
            totalGamesWon: 0,
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
      })

      renderWithProviders(<DashboardPage />, storeWithNoGames)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should display GameCoin balance from Redux state', () => {
      renderWithProviders(<DashboardPage />)

      expect(screen.getByText('💰 2500 GameCoins')).toBeInTheDocument()
    })

    it('should fallback to default GameCoin balance when not available', () => {
      const storeWithoutBalance = createMockStore({
        gameCoin: {
          balance: null,
          transactions: [],
          dailyBonusAvailable: false,
          lastBonusClaimedAt: null,
          isLoading: false,
          error: null,
        },
      })

      renderWithProviders(<DashboardPage />, storeWithoutBalance)

      expect(screen.getByText('💰 1000 GameCoins')).toBeInTheDocument()
    })
  })

  describe('Experience Level Visualization', () => {
    it('should display correct progress bar width for Intermediate level', () => {
      renderWithProviders(<DashboardPage />)

      const experienceSection = screen.getByText('⚡ Experience Level').parentElement
      const progressBar = experienceSection?.querySelector('div[style*="width"]')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should display correct progress bar width for Beginner level', () => {
      const storeWithBeginner = createMockStore({
        profile: {
          profile: {
            id: '1',
            userId: 'user-1',
            displayName: 'NewGamer',
            avatarId: 'cyber-warrior-01',
            interestTags: ['FPS'],
            gameExperience: 'BEGINNER' as const,
            bio: '',
            gamesPlayed: [],
            totalGamesPlayed: 0,
            totalGamesWon: 0,
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
      })

      renderWithProviders(<DashboardPage />, storeWithBeginner)

      const experienceSection = screen.getByText('⚡ Experience Level').parentElement
      const progressBar = experienceSection?.querySelector('div[style*="width"]')
      expect(progressBar).toHaveStyle({ width: '25%' })
    })

    it('should display correct progress bar width for Advanced level', () => {
      const storeWithAdvanced = createMockStore({
        profile: {
          profile: {
            id: '1',
            userId: 'user-1',
            displayName: 'ProGamer',
            avatarId: 'cyber-warrior-01',
            interestTags: ['FPS'],
            gameExperience: 'ADVANCED' as const,
            bio: '',
            gamesPlayed: ['chess', 'racing'],
            totalGamesPlayed: 100,
            totalGamesWon: 80,
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
      })

      renderWithProviders(<DashboardPage />, storeWithAdvanced)

      const experienceSection = screen.getByText('⚡ Experience Level').parentElement
      const progressBar = experienceSection?.querySelector('div[style*="width"]')
      expect(progressBar).toHaveStyle({ width: '75%' })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and semantic structure', () => {
      renderWithProviders(<DashboardPage />)

      // Check for semantic HTML structure
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main content

      // Check that cards are clickable elements
      const cards = screen.getAllByRole('generic').filter(el => 
        el.classList.contains('cursor-pointer')
      )
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should render logout button with proper variant', () => {
      renderWithProviders(<DashboardPage />)

      const logoutButton = screen.getByTestId('logout-button')
      expect(logoutButton).toHaveAttribute('data-variant', 'icon')
    })
  })
})