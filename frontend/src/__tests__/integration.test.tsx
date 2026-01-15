import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../store/slices/authSlice'
import profileSlice from '../store/slices/profileSlice'
import matchmakingSlice from '../store/slices/matchmakingSlice'
import App from '../App'

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN
}

global.WebSocket = vi.fn(() => mockWebSocket) as any

// Mock fetch
global.fetch = vi.fn()

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      profile: profileSlice,
      matchmaking: matchmakingSlice
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', phoneNumber: '+1234567890' },
        token: 'test-token',
        error: null
      },
      profile: {
        profile: {
          userId: '1',
          displayName: 'TestUser',
          gameExperience: 'INTERMEDIATE',
          interestTags: ['action', 'strategy'],
          bio: 'Test bio'
        },
        isLoading: false,
        error: null
      },
      matchmaking: {
        isInQueue: false,
        queueStartTime: null,
        estimatedWaitTime: null,
        gameType: null,
        status: 'idle',
        matchFound: false,
        matchDetails: null,
        error: null,
        queuePosition: null,
        alternativeGames: []
      },
      ...initialState
    }
  })
}

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createTestStore(initialState)
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })
  })

  it('should navigate from dashboard to matchmaking', async () => {
    renderWithProviders(<App />)
    
    // Should be on dashboard
    await waitFor(() => {
      expect(screen.getByText('Welcome to the Cyberpunk Gaming Universe')).toBeInTheDocument()
    })
    
    // Click on "Play with Stranger" card
    const playWithStrangerCard = screen.getByText('Play with Stranger')
    fireEvent.click(playWithStrangerCard)
    
    // Should navigate to matchmaking
    await waitFor(() => {
      expect(screen.getByText('Find Your Next Gaming Challenge')).toBeInTheDocument()
    })
  })

  it('should handle game session navigation', async () => {
    // Mock a game session route
    Object.defineProperty(window, 'location', {
      value: { pathname: '/game/CHESS/session123' },
      writable: true
    })
    
    renderWithProviders(<App />)
    
    // Should show game engine loading state
    await waitFor(() => {
      expect(screen.getByText('Loading Game...')).toBeInTheDocument()
    })
  })

  it('should handle authentication flow', async () => {
    const unauthenticatedState = {
      auth: {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        error: null
      }
    }
    
    renderWithProviders(<App />, unauthenticatedState)
    
    // Should redirect to auth page
    await waitFor(() => {
      expect(screen.getByText('Welcome to GameVerse')).toBeInTheDocument()
    })
  })

  it('should handle profile setup flow', async () => {
    const noProfileState = {
      profile: {
        profile: null,
        isLoading: false,
        error: null
      }
    }
    
    renderWithProviders(<App />, noProfileState)
    
    // Should redirect to profile setup
    await waitFor(() => {
      expect(screen.getByText('Complete Your Vibe Check')).toBeInTheDocument()
    })
  })

  it('should handle error states gracefully', async () => {
    const errorState = {
      matchmaking: {
        isInQueue: false,
        queueStartTime: null,
        estimatedWaitTime: null,
        gameType: null,
        status: 'idle',
        matchFound: false,
        matchDetails: null,
        error: 'Connection failed',
        queuePosition: null,
        alternativeGames: []
      }
    }
    
    renderWithProviders(<App />, errorState)
    
    // Navigate to matchmaking to see error
    const playWithStrangerCard = screen.getByText('Play with Stranger')
    fireEvent.click(playWithStrangerCard)
    
    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })
  })
})