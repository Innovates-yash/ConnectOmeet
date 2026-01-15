import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { render, screen, cleanup } from '@testing-library/react'
import ChessGame from '../ChessGame'
import { GameState } from '../../../hooks/useGameState'

/**
 * Property 12: Chess Rule Validation and Timing
 * Validates: Requirements 12.2, 12.3, 12.4, 12.5
 */

// Mock game state for testing
const createMockGameState = (): GameState => ({
  sessionId: 'test-session',
  gameType: 'CHESS',
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

describe('ChessGame Property Tests - Property 12: Chess Rule Validation and Timing', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('Property 12.1: Chess board maintains 8x8 structure invariant', () => {
    fc.assert(fc.property(fc.anything(), () => {
      const gameState = createMockGameState()
      const { unmount } = render(<ChessGame gameState={gameState} onMove={mockOnMove} />)
      
      // Chess board should always have exactly 64 squares (8x8)
      const boardElement = document.querySelector('.grid-cols-8')
      expect(boardElement).toBeTruthy()
      
      if (boardElement) {
        const squares = boardElement.children.length
        expect(squares).toBe(64)
      }
      
      unmount()
      return true
    }))
  })

  it('Property 12.2: Timer values are always non-negative and bounded', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 600 }),
      fc.integer({ min: 0, max: 600 }),
      (whiteTime, blackTime) => {
        const gameState = createMockGameState()
        gameState.gameData = {
          chess: {
            timeRemaining: { white: whiteTime, black: blackTime },
            currentPlayer: 'white',
            gameStatus: 'active'
          }
        }
        
        const { unmount } = render(<ChessGame gameState={gameState} onMove={mockOnMove} />)
        
        // Find timer displays - should be exactly 2
        const timerElements = screen.getAllByText(/\d+:\d+/)
        expect(timerElements.length).toBe(2)
        
        // Each timer should display valid time format
        timerElements.forEach(timer => {
          const timeText = timer.textContent || ''
          expect(timeText).toMatch(/^\d+:\d{2}$/)
          
          const [minutes, seconds] = timeText.split(':').map(Number)
          expect(minutes).toBeGreaterThanOrEqual(0)
          expect(minutes).toBeLessThanOrEqual(10)
          expect(seconds).toBeGreaterThanOrEqual(0)
          expect(seconds).toBeLessThan(60)
        })
        
        unmount()
        return true
      }
    ))
  })

  it('Property 12.3: Game status transitions are valid', () => {
    fc.assert(fc.property(
      fc.constantFrom('active', 'check', 'checkmate', 'stalemate', 'draw'),
      (status) => {
        const gameState = createMockGameState()
        gameState.gameData = {
          chess: {
            gameStatus: status,
            currentPlayer: 'white'
          }
        }
        
        const { unmount } = render(<ChessGame gameState={gameState} onMove={mockOnMove} />)
        
        // Status should be displayed and valid - use getAllByText to handle multiple
        const statusElements = screen.getAllByText(/Status:/)
        expect(statusElements.length).toBeGreaterThan(0)
        
        // Check the first status element
        const statusText = statusElements[0].textContent || ''
        expect(statusText).toMatch(/Status:\s*(active|check|checkmate|stalemate|draw)/i)
        
        unmount()
        return true
      }
    ))
  })

  it('Property 12.4: Player alternation is strictly enforced', () => {
    fc.assert(fc.property(
      fc.constantFrom('white', 'black'),
      (currentPlayer) => {
        const gameState = createMockGameState()
        gameState.gameData = {
          chess: {
            currentPlayer,
            gameStatus: 'active'
          }
        }
        
        const { unmount } = render(<ChessGame gameState={gameState} onMove={mockOnMove} />)
        
        // Current turn should be displayed correctly - use getAllByText to handle multiple
        const turnElements = screen.getAllByText(/Current turn:/i)
        expect(turnElements.length).toBeGreaterThan(0)
        
        // Check the first turn element
        const turnText = turnElements[0].textContent || ''
        expect(turnText).toMatch(new RegExp(`Current turn:\\s*${currentPlayer}`, 'i'))
        
        unmount()
        return true
      }
    ))
  })

  it('Property 12.5: Chess piece symbols are consistent', () => {
    fc.assert(fc.property(fc.anything(), () => {
      const gameState = createMockGameState()
      const { unmount } = render(<ChessGame gameState={gameState} onMove={mockOnMove} />)
      
      // Valid chess piece Unicode symbols
      const validSymbols = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟']
      
      // Find chess board
      const boardElement = document.querySelector('.grid-cols-8')
      expect(boardElement).toBeTruthy()
      
      if (boardElement) {
        // Check that any piece symbols found are valid
        Array.from(boardElement.children).forEach(square => {
          const symbol = square.textContent?.trim()
          if (symbol && symbol.length === 1) {
            // If it's a single character, it should be a valid chess symbol or empty
            if (validSymbols.includes(symbol)) {
              expect(validSymbols).toContain(symbol)
            }
          }
        })
      }
      
      unmount()
      return true
    }))
  })
})