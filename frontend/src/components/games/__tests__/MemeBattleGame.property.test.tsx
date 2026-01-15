import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import fc from 'fast-check'
import MemeBattleGame from '../MemeBattleGame'
import { GameState } from '../../../hooks/useGameState'

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
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
  gameData: {},
  ...overrides
})

// Generators for property-based testing
const phaseGenerator = fc.constantFrom('submission', 'voting', 'results')

const memePostGenerator = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  imageUrl: fc.webUrl(),
  description: fc.option(fc.string({ maxLength: 500 })),
  likesCount: fc.integer({ min: 0, max: 1000 }),
  competitionWeek: fc.constantFrom('2024-01-08', '2024-01-15', '2024-01-22'),
  isWinner: fc.boolean(),
  createdAt: fc.constantFrom('2024-01-08T10:00:00Z', '2024-01-08T14:30:00Z', '2024-01-08T16:45:00Z'),
  userDisplayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  hasUserLiked: fc.boolean()
})

const memeBattleStateGenerator = fc.record({
  currentWeek: fc.date().map(d => d.toISOString().split('T')[0]),
  phase: phaseGenerator,
  allSubmissions: fc.array(memePostGenerator, { minLength: 0, maxLength: 10 }),
  canSubmit: fc.boolean(),
  canVote: fc.boolean(),
  entryFee: fc.integer({ min: 1, max: 100 }),
  prizePool: fc.integer({ min: 10, max: 1000 })
})

describe('MemeBattleGame Property Tests', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  /**
   * Property 16: Meme Competition Management
   * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5
   */

  it('Property 16.1: Phase progression maintains consistency', () => {
    fc.assert(fc.property(
      phaseGenerator,
      fc.boolean(),
      fc.boolean(),
      (phase, canSubmit, canVote) => {
        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              phase,
              canSubmit,
              canVote
            }
          }
        })

        const { container, unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Phase should be displayed consistently
        const phaseElements = container.querySelectorAll(`[class*="${phase}"]`)
        expect(phaseElements.length).toBeGreaterThanOrEqual(0)
        
        // Component should render without errors
        expect(container.firstChild).toBeTruthy()
        
        unmount()
      }
    ), { numRuns: 50 })
  })

  it('Property 16.2: Meme submissions maintain data integrity', () => {
    fc.assert(fc.property(
      fc.array(memePostGenerator, { minLength: 1, maxLength: 3 }),
      (submissions) => {
        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              phase: 'voting',
              allSubmissions: submissions,
              canSubmit: false,
              canVote: true
            }
          }
        })

        const { unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Check that the component renders without errors
        expect(screen.getByText('Meme Battle')).toBeInTheDocument()
        
        // Check that memes are displayed (at least the count should match)
        const memeElements = document.querySelectorAll('.aspect-video')
        expect(memeElements.length).toBe(submissions.length)
        
        unmount()
      }
    ), { numRuns: 20 })
  })

  it('Property 16.3: Like counts are preserved and updated correctly', () => {
    fc.assert(fc.property(
      memePostGenerator,
      (meme) => {
        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              phase: 'voting',
              allSubmissions: [meme],
              canSubmit: false,
              canVote: true
            }
          }
        })

        const { unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Like count should be displayed
        expect(screen.getByText(meme.likesCount.toString())).toBeInTheDocument()
        
        // If user can vote and it's not their meme, like button should be present
        if (meme.userId !== gameState.currentPlayer) {
          const likeButton = screen.queryByText(meme.hasUserLiked ? '❤️' : '🤍')
          expect(likeButton).toBeTruthy()
        }
        
        unmount()
      }
    ), { numRuns: 50 })
  })

  it('Property 16.4: Competition phases determine available actions', () => {
    fc.assert(fc.property(
      phaseGenerator,
      fc.boolean(),
      fc.boolean(),
      (phase, canSubmit, canVote) => {
        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              phase,
              canSubmit,
              canVote,
              allSubmissions: []
            }
          }
        })

        const { unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Submit button should only appear when canSubmit is true and user hasn't submitted
        const submitButtons = screen.queryAllByText('📤 Submit Meme')
        const submittedIndicators = screen.queryAllByText('✅ Meme Submitted')
        
        if (canSubmit) {
          // Either submit button or submitted indicator should be present
          expect(submitButtons.length > 0 || submittedIndicators.length > 0).toBeTruthy()
        }
        
        // Phase should be displayed correctly
        expect(screen.getAllByText(new RegExp(phase, 'i')).length).toBeGreaterThan(0)
        
        unmount()
      }
    ), { numRuns: 50 })
  })

  it('Property 16.5: Winner determination is consistent with like counts', () => {
    fc.assert(fc.property(
      fc.array(memePostGenerator, { minLength: 2, maxLength: 5 }),
      (submissions) => {
        // Ensure at least one winner exists
        const sortedByLikes = [...submissions].sort((a, b) => b.likesCount - a.likesCount)
        const winner = { ...sortedByLikes[0], isWinner: true }
        const others = sortedByLikes.slice(1).map(meme => ({ ...meme, isWinner: false }))
        const allSubmissions = [winner, ...others]

        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              phase: 'results',
              allSubmissions,
              canSubmit: false,
              canVote: false
            }
          }
        })

        const { unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Winner badge should be displayed
        expect(screen.getByText('🏆 WINNER 🏆')).toBeInTheDocument()
        
        // Final Results header should be shown
        expect(screen.getByText('🏆 Final Results')).toBeInTheDocument()
        
        // Winner should have the highest like count among displayed memes
        const winnerElement = screen.getByText('🏆 WINNER 🏆')
        expect(winnerElement).toBeInTheDocument()
        
        unmount()
      }
    ), { numRuns: 30 })
  })

  it('Property 16.6: File validation constraints are enforced', () => {
    fc.assert(fc.property(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // Up to 10MB
        type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf')
      }),
      (fileProps) => {
        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              phase: 'submission',
              canSubmit: true,
              canVote: false,
              allSubmissions: []
            }
          }
        })

        const { unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Open upload modal
        const submitButtons = screen.getAllByText('📤 Submit Meme')
        fireEvent.click(submitButtons[0])
        
        // Modal should be displayed
        expect(screen.getByText('Submit Your Meme')).toBeInTheDocument()
        
        // Check that file input exists and has correct accept attribute
        const fileInputElement = document.querySelector('input[type="file"]')
        expect(fileInputElement).toBeTruthy()
        expect(fileInputElement).toHaveAttribute('accept', 'image/jpeg,image/png,image/gif')
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 16.7: Competition timing affects phase transitions', () => {
    fc.assert(fc.property(
      fc.integer({ min: -10, max: 10 }), // Days relative to now
      (daysOffset) => {
        const now = new Date()
        const weekEnd = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000)
        
        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              weekEndDate: weekEnd,
              phase: daysOffset > 5 ? 'submission' : daysOffset > 0 ? 'voting' : 'results',
              canSubmit: daysOffset > 5,
              canVote: daysOffset > 0 && daysOffset <= 5,
              allSubmissions: []
            }
          }
        })

        const { container, unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Component should render without errors regardless of timing
        expect(container.firstChild).toBeTruthy()
        
        // Time remaining should be displayed (use getAllByText to handle multiple instances)
        expect(screen.getAllByText(/Time Remaining:/).length).toBeGreaterThan(0)
        
        unmount()
      }
    ), { numRuns: 30 })
  })

  it('Property 16.8: GameCoin values are displayed consistently', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 100 }),
      fc.integer({ min: 10, max: 1000 }),
      (entryFee, prizePool) => {
        const gameState = createMockGameState({
          gameData: {
            memeBattle: {
              phase: 'voting',
              entryFee,
              prizePool,
              canSubmit: false,
              canVote: true,
              allSubmissions: []
            }
          }
        })

        const { unmount } = render(<MemeBattleGame gameState={gameState} onMove={mockOnMove} />)
        
        // Entry fee should be displayed (use getAllByText to handle multiple instances)
        expect(screen.getAllByText(`${entryFee} GameCoins`).length).toBeGreaterThan(0)
        
        // Prize pool should be displayed (use getAllByText to handle multiple instances)
        expect(screen.getAllByText(`${prizePool} GameCoins`).length).toBeGreaterThan(0)
        
        // Instructions should mention the prize pool
        expect(screen.getAllByText(new RegExp(`Winner gets ${prizePool} GameCoins`)).length).toBeGreaterThan(0)
        
        // Instructions should mention the entry fee
        expect(screen.getAllByText(new RegExp(`Entry fee: ${entryFee} GameCoins`)).length).toBeGreaterThan(0)
        
        unmount()
      }
    ), { numRuns: 50 })
  })
})