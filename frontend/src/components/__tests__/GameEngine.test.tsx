import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { vi, describe, test, expect } from 'vitest'
import GameEngine from '../GameEngine'
import authSlice from '../../store/slices/authSlice'
import profileSlice from '../../store/slices/profileSlice'

// Mock the CarRacingGame component
vi.mock('../games/CarRacingGame', () => ({
  default: ({ gameState }: { gameState: any }) => (
    <div>
      <h2>Car Racing</h2>
      <p>Racing track will be implemented here</p>
      <p>Status: {gameState.status}</p>
      <p>Players: {gameState.players.length}</p>
    </div>
  )
}))

// Mock the custom hooks
vi.mock('../../hooks/useGameState', () => ({
  useGameState: vi.fn(() => ({
    gameState: {
      sessionId: 'session123',
      gameType: 'CHESS',
      players: [
        { id: '1', displayName: 'Player1', avatarId: 'avatar1', isConnected: true },
        { id: '2', displayName: 'Player2', avatarId: 'avatar2', isConnected: false }
      ],
      currentPlayer: '1',
      gameData: {},
      status: 'waiting',
      moves: [],
      scores: { '1': 10, '2': 5 }
    },
    error: null,
    updateGameState: vi.fn(),
    addMove: vi.fn(),
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
    setError: vi.fn()
  }))
}))

vi.mock('../../hooks/useGameWebSocket', () => ({
  useGameWebSocket: vi.fn(() => ({
    isConnected: false,
    sendMove: vi.fn(),
    leaveGame: vi.fn()
  }))
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ gameType: 'CHESS', sessionId: 'session123' })
  }
})

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      profile: profileSlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        isLoading: false,
        token: 'test-token',
        refreshToken: null,
        phoneNumber: '+1234567890',
        otpSent: false,
        otpLoading: false,
        error: null,
      },
      profile: {
        profile: {
          id: '1',
          userId: '1',
          displayName: 'TestPlayer',
          avatarId: 'avatar1',
          bio: 'Test bio',
          interestTags: ['gaming', 'strategy'],
          gameExperience: 'INTERMEDIATE' as const,
          gamesPlayed: ['CHESS', 'UNO'],
          totalGamesPlayed: 10,
          totalGamesWon: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        isLoading: false,
        error: null,
        searchResults: [],
        searchLoading: false,
        availableAvatars: [],
        availableInterestTags: [],
        avatarsLoading: false,
        tagsLoading: false
      },
    },
  })
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={createTestStore()}>
      <MemoryRouter initialEntries={['/game/CHESS/session123']}>
        {component}
      </MemoryRouter>
    </Provider>
  )
}

describe('GameEngine Component', () => {
  test('renders game engine with valid game type and session', () => {
    renderWithProviders(<GameEngine />)
    
    expect(screen.getByText('Chess')).toBeInTheDocument()
    expect(screen.getByText('Leave Game')).toBeInTheDocument()
    expect(screen.getByText('Players:')).toBeInTheDocument()
    expect(screen.getByText('Chess board will be implemented here')).toBeInTheDocument()
    expect(screen.getByText('Status: waiting')).toBeInTheDocument()
    expect(screen.getByText('Players: 2')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  test('renders car racing game correctly', () => {
    // Mock useParams to return CAR_RACING
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => vi.fn(),
        useParams: () => ({ gameType: 'CAR_RACING', sessionId: 'session123' })
      }
    })

    vi.doMock('../../hooks/useGameState', () => ({
      useGameState: vi.fn(() => ({
        gameState: {
          sessionId: 'session123',
          gameType: 'CAR_RACING',
          players: [{ id: '1', displayName: 'Player1', avatarId: 'avatar1', isConnected: true }],
          currentPlayer: '1',
          gameData: {},
          status: 'waiting',
          moves: [],
          scores: {}
        },
        error: null,
        updateGameState: vi.fn(),
        addMove: vi.fn(),
        addPlayer: vi.fn(),
        removePlayer: vi.fn(),
        setError: vi.fn()
      }))
    }))

    renderWithProviders(<GameEngine />)
    
    expect(screen.getByText('Car Racing')).toBeInTheDocument()
    expect(screen.getByText('Racing track will be implemented here')).toBeInTheDocument()
  })

  test('shows error for invalid game type', () => {
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => vi.fn(),
        useParams: () => ({ gameType: 'INVALID_GAME', sessionId: 'session123' })
      }
    })

    vi.doMock('../../hooks/useGameState', () => ({
      useGameState: vi.fn(() => ({
        gameState: {
          sessionId: 'session123',
          gameType: 'INVALID_GAME',
          players: [],
          currentPlayer: '',
          gameData: {},
          status: 'waiting',
          moves: [],
          scores: {}
        },
        error: null,
        updateGameState: vi.fn(),
        addMove: vi.fn(),
        addPlayer: vi.fn(),
        removePlayer: vi.fn(),
        setError: vi.fn()
      }))
    }))
    
    renderWithProviders(<GameEngine />)
    
    expect(screen.getByText('Unknown game type: INVALID_GAME')).toBeInTheDocument()
  })

  test('shows error for missing session ID', () => {
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => vi.fn(),
        useParams: () => ({ gameType: 'CHESS', sessionId: undefined })
      }
    })
    
    renderWithProviders(<GameEngine />)
    
    expect(screen.getByText('Invalid Game Session')).toBeInTheDocument()
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument()
  })
})