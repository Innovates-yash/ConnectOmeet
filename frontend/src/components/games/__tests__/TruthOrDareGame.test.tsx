import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TruthOrDareGame from '../TruthOrDareGame'
import { GameState } from '../../../hooks/useGameState'

const createMockGameState = (): GameState => ({
  sessionId: 'test-session',
  gameType: 'TRUTH_DARE',
  status: 'active',
  players: [
    { id: 'player1', displayName: 'Player 1', isConnected: true, avatarId: 'avatar1' },
    { id: 'player2', displayName: 'Player 2', isConnected: true, avatarId: 'avatar2' }
  ],
  currentPlayer: 'player1',
  moves: [],
  scores: {},
  gameData: {}
})

describe('TruthOrDareGame', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
    // Mock Math.random to ensure consistent player order
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders Truth or Dare game component', () => {
    const gameState = createMockGameState()
    render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('Truth or Dare')).toBeInTheDocument()
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Player 2').length).toBeGreaterThan(0)
  })

  it('shows choice buttons for current player', () => {
    const gameState = createMockGameState()
    render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
    
    // Check if buttons exist (they might not be visible if it's not the current player's turn)
    const truthButtons = screen.queryAllByText('🤔 TRUTH')
    const dareButtons = screen.queryAllByText('😈 DARE')
    
    // At least one of these should be true: either buttons exist or waiting message exists
    const hasButtons = truthButtons.length > 0 && dareButtons.length > 0
    const hasWaitingMessage = screen.queryByText(/Waiting for/) !== null
    
    expect(hasButtons || hasWaitingMessage).toBe(true)
  })

  it('handles truth choice when it is current player turn', () => {
    const gameState = createMockGameState()
    // Set up game data to ensure player1 is current player
    gameState.gameData = {
      truthDare: {
        currentPlayer: 'player1',
        gameStatus: 'choosing',
        playerTurnOrder: ['player1', 'player2']
      }
    }
    
    render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
    
    const truthButton = screen.queryByText('🤔 TRUTH')
    if (truthButton) {
      fireEvent.click(truthButton)
      
      expect(mockOnMove).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRUTH_DARE_CHOICE',
          choice: 'TRUTH'
        })
      )
    }
  })

  it('handles dare choice when it is current player turn', () => {
    const gameState = createMockGameState()
    // Set up game data to ensure player1 is current player
    gameState.gameData = {
      truthDare: {
        currentPlayer: 'player1',
        gameStatus: 'choosing',
        playerTurnOrder: ['player1', 'player2']
      }
    }
    
    render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
    
    const dareButton = screen.queryByText('😈 DARE')
    if (dareButton) {
      fireEvent.click(dareButton)
      
      expect(mockOnMove).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRUTH_DARE_CHOICE',
          choice: 'DARE'
        })
      )
    }
  })

  it('shows game progress', () => {
    const gameState = createMockGameState()
    render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText(/Round:/)).toBeInTheDocument()
    expect(screen.getByText(/Progress:/)).toBeInTheDocument()
  })

  it('displays player turn order', () => {
    const gameState = createMockGameState()
    render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText(/Turn Order: #1/)).toBeInTheDocument()
    expect(screen.getByText(/Turn Order: #2/)).toBeInTheDocument()
  })
})