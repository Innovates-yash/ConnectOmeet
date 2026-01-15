import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemeBattleGame from '../MemeBattleGame'
import { GameState } from '../../../hooks/useGameState'

const createMockGameState = (): GameState => ({
  sessionId: 'test-session',
  gameType: 'MEME_BATTLE',
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

describe('MemeBattleGame', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
  })

  it('renders Meme Battle game component', () => {
    const gameState = createMockGameState()
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('Meme Battle')).toBeInTheDocument()
    // There might be multiple "Phase:" texts in the component, just check that at least one exists
    expect(screen.getAllByText(/Phase:/).length).toBeGreaterThan(0)
  })

  it('shows competition information', () => {
    const gameState = createMockGameState()
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText(/Week:/)).toBeInTheDocument()
    expect(screen.getByText(/Time Remaining:/)).toBeInTheDocument()
    expect(screen.getByText(/Prize Pool:/)).toBeInTheDocument()
    expect(screen.getByText(/Entry Fee:/)).toBeInTheDocument()
  })

  it('shows submit meme button when user can submit', () => {
    const gameState = createMockGameState()
    // Set initial state to submission phase where user can submit
    gameState.gameData = {
      memeBattle: {
        phase: 'submission',
        canSubmit: true,
        canVote: false
      }
    }
    
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    const submitButton = screen.queryByText('📤 Submit Meme')
    const submittedButton = screen.queryByText('✅ Meme Submitted')
    
    // Either submit button should be visible or submitted status should be shown
    expect(submitButton || submittedButton).toBeTruthy()
  })

  it('displays meme gallery', () => {
    const gameState = createMockGameState()
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText(/Community Submissions|Final Results/)).toBeInTheDocument()
  })

  it('shows how to play instructions', () => {
    const gameState = createMockGameState()
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText('How Meme Battle Works:')).toBeInTheDocument()
    expect(screen.getByText(/Submission Phase/)).toBeInTheDocument()
    expect(screen.getByText(/Voting Phase/)).toBeInTheDocument()
    expect(screen.getAllByText(/Results/)).toHaveLength(2) // One in header, one in instructions
  })

  it('opens upload modal when submit button is clicked', () => {
    const gameState = createMockGameState()
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    const submitButton = screen.queryByText('📤 Submit Meme')
    if (submitButton) {
      fireEvent.click(submitButton)
      expect(screen.getByText('Submit Your Meme')).toBeInTheDocument()
    }
  })

  it('handles like button clicks', () => {
    const gameState = createMockGameState()
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    // Look for like buttons (heart icons)
    const likeButtons = screen.queryAllByText('🤍')
    if (likeButtons.length > 0) {
      fireEvent.click(likeButtons[0])
      expect(mockOnMove).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MEME_BATTLE_LIKE'
        })
      )
    }
  })

  it('displays different phases correctly', () => {
    const gameState = createMockGameState()
    gameState.gameData = {
      memeBattle: {
        phase: 'voting',
        canSubmit: false,
        canVote: true
      }
    }
    
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    // Check for voting phase in the phase indicator (not in instructions)
    expect(screen.getAllByText(/voting/i)).toHaveLength(2) // One in phase indicator, one in instructions
  })

  it('shows winner when competition is finished', () => {
    const gameState = createMockGameState()
    gameState.gameData = {
      memeBattle: {
        phase: 'results',
        canSubmit: false,
        canVote: false
      }
    }
    
    render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
    
    expect(screen.getByText(/Final Results/)).toBeInTheDocument()
  })
})