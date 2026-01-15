import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { render, screen, cleanup } from '@testing-library/react'
import TruthOrDareGame from '../TruthOrDareGame'
import { GameState } from '../../../hooks/useGameState'

/**
 * Property 15: Turn-based Game Progression
 * Validates: Requirements 16.2, 16.3, 16.4
 */

// Mock game state for testing
const createMockGameState = (playerCount: number = 2): GameState => ({
  sessionId: 'test-session',
  gameType: 'TRUTH_DARE',
  status: 'active',
  players: Array.from({ length: playerCount }, (_, i) => ({
    id: `player${i + 1}`,
    displayName: `Player ${i + 1}`,
    isConnected: true,
    avatarId: `avatar${i + 1}`
  })),
  currentPlayer: 'player1',
  moves: [],
  scores: {},
  gameData: {}
})

describe('TruthOrDareGame Property Tests - Property 15: Turn-based Game Progression', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
    // Mock Math.random for consistent behavior
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('Property 15.1: Turn-based games maintain valid player rotation', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 6 }),
      (playerCount) => {
        const gameState = createMockGameState(playerCount)
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Each player should have a turn order position
        const turnOrderElements = screen.getAllByText(/Turn Order: #/)
        expect(turnOrderElements.length).toBe(playerCount)
        
        // Turn order should be sequential (1, 2, 3, ...)
        for (let i = 1; i <= playerCount; i++) {
          expect(screen.getByText(`Turn Order: #${i}`)).toBeInTheDocument()
        }
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.2: Game progress tracking is consistent', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 4 }),
      fc.integer({ min: 0, max: 12 }),
      (playerCount, completedTurns) => {
        const gameState = createMockGameState(playerCount)
        const maxTurns = playerCount * 3 // 3 rounds per player
        
        // Ensure completedTurns doesn't exceed maxTurns
        const validCompletedTurns = Math.min(completedTurns, maxTurns)
        
        gameState.gameData = {
          truthDare: {
            completedTurns: validCompletedTurns,
            maxTurns,
            gameStatus: validCompletedTurns >= maxTurns ? 'finished' : 'choosing'
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Progress should be displayed
        const progressElements = screen.getAllByText(/Progress:/)
        expect(progressElements.length).toBeGreaterThan(0)
        
        // Progress should show valid numbers
        const progressText = progressElements[0].textContent || ''
        const progressMatch = progressText.match(/(\d+)\s*\/\s*(\d+)/)
        
        if (progressMatch) {
          const [, current, total] = progressMatch
          const currentNum = parseInt(current)
          const totalNum = parseInt(total)
          
          expect(currentNum).toBeGreaterThanOrEqual(0)
          expect(currentNum).toBeLessThanOrEqual(totalNum)
          expect(totalNum).toBe(maxTurns)
        }
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.3: Round calculation is mathematically correct', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 4 }),
      fc.integer({ min: 0, max: 12 }),
      (playerCount, completedTurns) => {
        const gameState = createMockGameState(playerCount)
        const maxTurns = playerCount * 3
        const validCompletedTurns = Math.min(completedTurns, maxTurns)
        
        // Set up gameData before rendering to avoid initialization issues
        gameState.gameData = {
          truthDare: {
            completedTurns: validCompletedTurns,
            maxTurns,
            gameStatus: 'choosing',
            playerTurnOrder: Array.from({ length: playerCount }, (_, i) => `player${i + 1}`),
            currentPlayer: 'player1',
            currentTurnIndex: 0
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Round should be calculated correctly
        const roundElements = screen.getAllByText(/Round:/)
        expect(roundElements.length).toBeGreaterThan(0)
        
        const roundText = roundElements[0].textContent || ''
        const roundMatch = roundText.match(/(\d+)\s*\/\s*3/)
        
        if (roundMatch) {
          const [, currentRound] = roundMatch
          const currentRoundNum = parseInt(currentRound)
          // The component calculates: Math.floor(completedTurns / gameState.players.length) + 1
          const expectedRound = Math.floor(validCompletedTurns / playerCount) + 1
          
          expect(currentRoundNum).toBe(expectedRound)
          expect(currentRoundNum).toBeGreaterThanOrEqual(1)
          expect(currentRoundNum).toBeLessThanOrEqual(4) // Allow for edge case where all turns completed
        }
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.4: Current player indication is always valid', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 4 }),
      fc.integer({ min: 0, max: 3 }),
      (playerCount, turnIndex) => {
        const gameState = createMockGameState(playerCount)
        const validTurnIndex = turnIndex % playerCount
        const currentPlayerId = `player${validTurnIndex + 1}`
        
        gameState.gameData = {
          truthDare: {
            currentPlayer: currentPlayerId,
            currentTurnIndex: validTurnIndex,
            playerTurnOrder: Array.from({ length: playerCount }, (_, i) => `player${i + 1}`),
            gameStatus: 'choosing'
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Current player should be displayed
        const currentPlayerElements = screen.getAllByText(/Current Turn:/)
        expect(currentPlayerElements.length).toBeGreaterThan(0)
        
        // Current player should be one of the valid players
        const currentPlayerText = currentPlayerElements[0].textContent || ''
        const playerNameMatch = currentPlayerText.match(/Player (\d+)/)
        
        if (playerNameMatch) {
          const [, playerNum] = playerNameMatch
          const playerNumber = parseInt(playerNum)
          expect(playerNumber).toBeGreaterThanOrEqual(1)
          expect(playerNumber).toBeLessThanOrEqual(playerCount)
        }
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.5: Game status transitions are deterministic', () => {
    fc.assert(fc.property(
      fc.constantFrom('waiting', 'choosing', 'answering', 'finished'),
      (status) => {
        const gameState = createMockGameState(2)
        gameState.gameData = {
          truthDare: {
            gameStatus: status,
            currentPlayer: 'player1'
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Status should be displayed
        const statusElements = screen.getAllByText(/Status:/)
        expect(statusElements.length).toBeGreaterThan(0)
        
        const statusText = statusElements[0].textContent || ''
        expect(statusText).toMatch(/Status:\s*(waiting|choosing|answering|finished)/i)
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.6: Question selection is from valid question types', () => {
    fc.assert(fc.property(
      fc.constantFrom('TRUTH', 'DARE'),
      (questionType) => {
        const gameState = createMockGameState(2)
        gameState.gameData = {
          truthDare: {
            currentQuestion: {
              id: 1,
              questionType,
              content: 'Test question',
              difficultyLevel: 'MEDIUM'
            },
            gameStatus: 'answering',
            currentPlayer: 'player1'
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Question type should be displayed correctly
        if (questionType === 'TRUTH') {
          expect(screen.getByText('🤔 TRUTH')).toBeInTheDocument()
        } else {
          expect(screen.getByText('😈 DARE')).toBeInTheDocument()
        }
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.7: Difficulty levels are valid and displayed', () => {
    fc.assert(fc.property(
      fc.constantFrom('EASY', 'MEDIUM', 'HARD'),
      (difficulty) => {
        const gameState = createMockGameState(2)
        gameState.gameData = {
          truthDare: {
            currentQuestion: {
              id: 1,
              questionType: 'TRUTH',
              content: 'Test question',
              difficultyLevel: difficulty
            },
            gameStatus: 'answering',
            currentPlayer: 'player1'
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Difficulty should be displayed
        expect(screen.getByText(difficulty)).toBeInTheDocument()
        
        // Difficulty should have appropriate styling
        const difficultyElement = screen.getByText(difficulty)
        const className = difficultyElement.className
        
        switch (difficulty) {
          case 'EASY':
            expect(className).toContain('text-green-400')
            break
          case 'MEDIUM':
            expect(className).toContain('text-yellow-400')
            break
          case 'HARD':
            expect(className).toContain('text-red-400')
            break
        }
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.8: Player completion tracking is accurate', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 4 }),
      fc.integer({ min: 0, max: 3 }),
      (playerCount, completedRounds) => {
        const gameState = createMockGameState(playerCount)
        
        gameState.gameData = {
          truthDare: {
            completedTurns: completedRounds * playerCount,
            maxTurns: playerCount * 3,
            gameStatus: 'choosing',
            playerTurnOrder: Array.from({ length: playerCount }, (_, i) => `player${i + 1}`)
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        // Each player should show correct completion count
        const completedElements = screen.getAllByText(/Completed: \d+\/3/)
        expect(completedElements.length).toBe(playerCount)
        
        completedElements.forEach(element => {
          const completedText = element.textContent || ''
          const completedMatch = completedText.match(/Completed: (\d+)\/3/)
          
          if (completedMatch) {
            const [, completed] = completedMatch
            const completedNum = parseInt(completed)
            expect(completedNum).toBeGreaterThanOrEqual(0)
            expect(completedNum).toBeLessThanOrEqual(3)
            // The component calculates: Math.floor(completedTurns / gameState.players.length)
            // which should equal completedRounds for our test setup
            expect(completedNum).toBe(completedRounds)
          }
        })
        
        unmount()
        return true
      }
    ))
  })

  it('Property 15.9: Game completion detection is correct', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 4 }),
      fc.boolean(),
      (playerCount, isFinished) => {
        const gameState = createMockGameState(playerCount)
        const maxTurns = playerCount * 3
        const completedTurns = isFinished ? maxTurns : Math.floor(maxTurns / 2)
        
        gameState.gameData = {
          truthDare: {
            completedTurns,
            maxTurns,
            gameStatus: isFinished ? 'finished' : 'choosing'
          }
        }
        
        const { unmount } = render(<TruthOrDareGame gameState={gameState} onMove={mockOnMove} />)
        
        if (isFinished) {
          // Should show completion message
          expect(screen.getByText(/Game Complete!/)).toBeInTheDocument()
        } else {
          // Should not show completion message
          expect(screen.queryByText(/Game Complete!/)).toBeNull()
        }
        
        unmount()
        return true
      }
    ))
  })
})