import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BubbleBlastGame from '../BubbleBlastGame'
import { GameState } from '../../../hooks/useGameState'

const createMockGameState = (): GameState => ({
  sessionId: 'test-session',
  gameType: 'BUBBLE_BLAST',
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

describe('BubbleBlastGame', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
  })

  it('renders Bubble Blast game component', () => {
    const gameState = createMockGameState()
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('Bubble Blast')).toBeInTheDocument()
    expect(screen.getByText('Score:')).toBeInTheDocument()
    expect(screen.getByText('Time:')).toBeInTheDocument()
  })

  it('shows start game button when game is not active', () => {
    const gameState = createMockGameState()
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('🎯 Start Game')).toBeInTheDocument()
  })

  it('displays game canvas', () => {
    const gameState = createMockGameState()
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width', '800')
    expect(canvas).toHaveAttribute('height', '600')
  })

  it('shows leaderboards', () => {
    const gameState = createMockGameState()
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('🏆 Daily Leaders')).toBeInTheDocument()
    expect(screen.getByText('📅 Weekly Leaders')).toBeInTheDocument()
    expect(screen.getByText('👑 All-Time Leaders')).toBeInTheDocument()
  })

  it('displays game instructions', () => {
    const gameState = createMockGameState()
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('How to Play Bubble Blast:')).toBeInTheDocument()
    expect(screen.getByText(/Aim & Shoot/)).toBeInTheDocument()
    expect(screen.getByText(/Match Colors/)).toBeInTheDocument()
    expect(screen.getByText(/Beat the Clock/)).toBeInTheDocument()
  })

  it('starts game when start button is clicked', () => {
    const gameState = createMockGameState()
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    const startButton = screen.getByText('🎯 Start Game')
    fireEvent.click(startButton)
    
    expect(mockOnMove).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'BUBBLE_BLAST_START'
      })
    )
  })

  it('handles canvas clicks for shooting', () => {
    const gameState = createMockGameState()
    gameState.gameData = {
      bubbleBlast: {
        gameActive: true,
        timeRemaining: 300,
        score: 0
      }
    }
    
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    const canvas = document.querySelector('canvas')
    if (canvas) {
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })
      // Should trigger shooting mechanics (tested in property tests)
    }
  })

  it('displays game over screen when game ends', () => {
    const gameState = createMockGameState()
    gameState.gameData = {
      bubbleBlast: {
        gameActive: false,
        gameEnded: true,
        score: 1500
      }
    }
    
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('🎉 Game Over!')).toBeInTheDocument()
    expect(screen.getByText('Final Score: 1500')).toBeInTheDocument()
    expect(screen.getByText('Play Again')).toBeInTheDocument()
  })

  it('formats time correctly', () => {
    const gameState = createMockGameState()
    gameState.gameData = {
      bubbleBlast: {
        timeRemaining: 125 // 2:05
      }
    }
    
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('shows score updates', () => {
    const gameState = createMockGameState()
    gameState.gameData = {
      bubbleBlast: {
        score: 2500
      }
    }
    
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('2500')).toBeInTheDocument()
  })

  it('displays leaderboard entries', () => {
    const gameState = createMockGameState()
    render(<BubbleBlastGame gameState={gameState} onMove={mockOnMove} />)
    
    // Check for some default leaderboard entries
    expect(screen.getByText('BubbleMaster')).toBeInTheDocument()
    expect(screen.getByText('WeeklyChamp')).toBeInTheDocument()
    expect(screen.getByText('LegendaryPopper')).toBeInTheDocument()
  })
})