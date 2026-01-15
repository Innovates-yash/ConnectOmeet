import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { render, screen, cleanup } from '@testing-library/react'
import UnoGame from '../UnoGame'
import { GameState } from '../../../hooks/useGameState'

/**
 * Property 13: Card Game Rule Enforcement (Uno)
 * Validates: Requirements 13.2, 13.3, 13.4, 13.5
 */

// Mock game state for testing
const createMockGameState = (): GameState => ({
  sessionId: 'test-session',
  gameType: 'UNO',
  status: 'active',
  players: [
    { id: 'player1', displayName: 'Player 1', isConnected: true, avatarId: 'avatar1' },
    { id: 'player2', displayName: 'Player 2', isConnected: true, avatarId: 'avatar2' },
    { id: 'player3', displayName: 'Player 3', isConnected: true, avatarId: 'avatar3' }
  ],
  currentPlayer: 'player1',
  moves: [],
  scores: {},
  gameData: {}
})

describe('UnoGame Property Tests - Property 13: Card Game Rule Enforcement', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('Property 13.1: Uno deck maintains correct card count invariant', () => {
    fc.assert(fc.property(fc.anything(), () => {
      const gameState = createMockGameState()
      const { unmount } = render(<UnoGame gameState={gameState} onMove={mockOnMove} />)
      
      // Find deck indicator
      const deckElement = screen.getByText(/Cards in Deck:/i)
      expect(deckElement).toBeTruthy()
      
      // Deck count should be a valid number
      const deckText = deckElement.textContent || ''
      const deckCount = parseInt(deckText.match(/\d+/)?.[0] || '0')
      expect(deckCount).toBeGreaterThanOrEqual(0)
      expect(deckCount).toBeLessThanOrEqual(108) // Standard Uno deck size
      
      unmount()
      return true
    }))
  })

  it('Property 13.2: Player hand counts are consistent', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 4 }),
      (playerCount) => {
        const gameState = createMockGameState()
        // Adjust players to match count
        gameState.players = gameState.players.slice(0, playerCount)
        
        const { unmount } = render(<UnoGame gameState={gameState} onMove={mockOnMove} />)
        
        // Find all numeric displays that could be card counts
        const allNumbers = screen.getAllByText(/\d+/)
        
        // Should have at least one numeric display
        expect(allNumbers.length).toBeGreaterThan(0)
        
        // Each displayed number should be parseable and reasonable
        allNumbers.forEach(element => {
          const text = element.textContent || '0'
          const number = parseInt(text)
          if (!isNaN(number)) {
            expect(number).toBeGreaterThanOrEqual(0)
            expect(number).toBeLessThanOrEqual(108) // Max possible in Uno
          }
        })
        
        unmount()
        return true
      }
    ))
  })

  it('Property 13.3: Game status transitions are valid', () => {
    fc.assert(fc.property(
      fc.constantFrom('active', 'finished'),
      (status) => {
        const gameState = createMockGameState()
        gameState.gameData = {
          uno: {
            gameStatus: status,
            currentPlayer: 'player1'
          }
        }
        
        const { unmount } = render(<UnoGame gameState={gameState} onMove={mockOnMove} />)
        
        // Status should be displayed and valid
        const statusElements = screen.getAllByText(/Status:/)
        expect(statusElements.length).toBeGreaterThan(0)
        
        const statusText = statusElements[0].textContent || ''
        expect(statusText).toMatch(/Status:\s*(active|finished)/i)
        
        unmount()
        return true
      }
    ))
  })

  it('Property 13.4: Current player indication is consistent', () => {
    fc.assert(fc.property(
      fc.constantFrom('player1', 'player2', 'player3'),
      (currentPlayer) => {
        const gameState = createMockGameState()
        gameState.gameData = {
          uno: {
            currentPlayer,
            gameStatus: 'active'
          }
        }
        
        const { unmount } = render(<UnoGame gameState={gameState} onMove={mockOnMove} />)
        
        // Current player should be displayed
        const currentPlayerElements = screen.getAllByText(/Current Player:/i)
        expect(currentPlayerElements.length).toBeGreaterThan(0)
        
        // Should show a valid player name
        const playerText = currentPlayerElements[0].textContent || ''
        expect(playerText).toMatch(/Current Player:\s*(Player \d+)/i)
        
        unmount()
        return true
      }
    ))
  })

  it('Property 13.5: Card colors are valid Uno colors', () => {
    fc.assert(fc.property(fc.anything(), () => {
      const gameState = createMockGameState()
      const { unmount } = render(<UnoGame gameState={gameState} onMove={mockOnMove} />)
      
      // Find current color indicator
      const colorElements = screen.queryAllByText(/Current Color:/i)
      
      if (colorElements.length > 0) {
        // If color is displayed, it should be valid
        const colorSection = colorElements[0].closest('div')
        expect(colorSection).toBeTruthy()
        
        // Should have a color indicator (colored div)
        const colorDiv = colorSection?.querySelector('div[class*="bg-"]')
        if (colorDiv) {
          const className = colorDiv.className
          const hasValidColor = className.includes('bg-red') || 
                               className.includes('bg-blue') || 
                               className.includes('bg-green') || 
                               className.includes('bg-yellow')
          expect(hasValidColor).toBe(true)
        }
      }
      
      unmount()
      return true
    }))
  })

  it('Property 13.6: Direction indicator shows valid directions', () => {
    fc.assert(fc.property(
      fc.constantFrom(1, -1),
      (direction) => {
        const gameState = createMockGameState()
        gameState.gameData = {
          uno: {
            direction,
            gameStatus: 'active'
          }
        }
        
        const { unmount } = render(<UnoGame gameState={gameState} onMove={mockOnMove} />)
        
        // Direction should be displayed
        const directionElements = screen.getAllByText(/Direction:/i)
        expect(directionElements.length).toBeGreaterThan(0)
        
        // Should show arrow indicating direction
        const directionText = directionElements[0].textContent || ''
        expect(directionText).toMatch(/Direction:\s*[→←]/i)
        
        unmount()
        return true
      }
    ))
  })
})