import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LudoGame from '../LudoGame'
import { GameState } from '../../../hooks/useGameState'

const createMockGameState = (): GameState => ({
  sessionId: 'test-session',
  gameType: 'LUDO',
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

describe('LudoGame Simple Tests', () => {
  const mockOnMove = vi.fn()

  it('renders Ludo game component', () => {
    const gameState = createMockGameState()
    render(<LudoGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('Ludo')).toBeInTheDocument()
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Player 2').length).toBeGreaterThan(0)
  })

  it('shows dice roll button', () => {
    const gameState = createMockGameState()
    render(<LudoGame gameState={gameState} onMove={mockOnMove} />)
    
    const diceButton = screen.getByRole('button')
    expect(diceButton).toBeInTheDocument()
  })
})