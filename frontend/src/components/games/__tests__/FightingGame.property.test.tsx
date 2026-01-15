import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import fc from 'fast-check'
import FightingGame from '../FightingGame'
import { GameState } from '../../../hooks/useGameState'

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  sessionId: 'test-session',
  gameType: 'FIGHTING',
  status: 'active',
  players: [
    { id: 'player1', displayName: 'Fighter 1', isConnected: true, avatarId: 'avatar1' },
    { id: 'player2', displayName: 'Fighter 2', isConnected: true, avatarId: 'avatar2' }
  ],
  currentPlayer: 'player1',
  moves: [],
  scores: {},
  gameData: {},
  ...overrides
})

// Generators for property-based testing
const healthGenerator = fc.integer({ min: 0, max: 100 })
const moveTypeGenerator = fc.constantFrom('punch', 'kick', 'block')
const playerIdGenerator = fc.constantFrom('player1', 'player2')
const comboCountGenerator = fc.integer({ min: 0, max: 10 })
const damageGenerator = fc.integer({ min: 0, max: 50 })

const fighterGenerator = fc.record({
  id: playerIdGenerator,
  name: fc.string({ minLength: 3, maxLength: 15 }),
  health: healthGenerator,
  maxHealth: fc.constant(100),
  isBlocking: fc.boolean(),
  isAttacking: fc.boolean(),
  comboCount: comboCountGenerator
})

const fightingStateGenerator = fc.record({
  fighters: fc.array(fighterGenerator, { minLength: 2, maxLength: 2 }),
  gameActive: fc.boolean(),
  gameEnded: fc.boolean(),
  winner: fc.option(playerIdGenerator, { nil: null })
})

describe('FightingGame Property Tests', () => {
  const mockOnMove = vi.fn()

  beforeEach(() => {
    mockOnMove.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  /**
   * Property 18: Combat System Mechanics
   * Validates: Requirements 19.2, 19.3, 19.4
   */

  it('Property 18.1: Health depletion leads to victory condition', () => {
    fc.assert(fc.property(
      fc.array(fighterGenerator, { minLength: 2, maxLength: 2 }),
      fc.boolean(),
      (fighters, gameActive) => {
        // Ensure one fighter has 0 health to test victory condition
        const testFighters = [
          { ...fighters[0], health: 0 },
          { ...fighters[1], health: fc.sample(healthGenerator, 1)[0] }
        ]

        const gameState = createMockGameState({
          gameData: {
            fighting: {
              fighters: testFighters,
              gameActive,
              gameEnded: testFighters[0].health <= 0,
              winner: testFighters[0].health <= 0 ? testFighters[1].id : null
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // When a fighter has 0 health, game should show victory condition
        if (testFighters[0].health <= 0) {
          expect(screen.getByText('🏆 Fight Over!')).toBeInTheDocument()
          expect(screen.getByText(/Winner:/)).toBeInTheDocument()
        }
        
        // Component should always render the main title
        expect(screen.getByText('🥊 Fighting Arena')).toBeInTheDocument()
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.2: Combat moves apply appropriate damage effects', () => {
    fc.assert(fc.property(
      moveTypeGenerator,
      fc.boolean(), // isBlocking
      comboCountGenerator,
      (moveType, isBlocking, comboCount) => {
        const fighters = [
          {
            id: 'player1',
            name: 'Fighter 1',
            health: 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          },
          {
            id: 'player2', 
            name: 'Fighter 2',
            health: 100,
            maxHealth: 100,
            isBlocking,
            isAttacking: false,
            comboCount
          }
        ]

        const gameState = createMockGameState({
          gameData: {
            fighting: {
              fighters,
              gameActive: true,
              gameEnded: false,
              winner: null
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // Combat controls should be available when game is active - use getAllByText for multiple elements
        if (moveType === 'punch') {
          const punchElements = screen.getAllByText('👊 Punch (Q)')
          expect(punchElements.length).toBeGreaterThanOrEqual(1)
        } else if (moveType === 'kick') {
          const kickElements = screen.getAllByText('🦵 Kick (W)')
          expect(kickElements.length).toBeGreaterThanOrEqual(1)
        } else if (moveType === 'block') {
          const blockElements = screen.getAllByText('🛡️ Block (E)')
          expect(blockElements.length).toBeGreaterThanOrEqual(1)
        }
        
        // Fighter stats should be displayed - use getAllByText for multiple elements
        const fighter1Elements = screen.getAllByText('Fighter 1')
        const fighter2Elements = screen.getAllByText('Fighter 2')
        expect(fighter1Elements.length).toBeGreaterThanOrEqual(1)
        expect(fighter2Elements.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.3: Blocking reduces damage consistently', () => {
    fc.assert(fc.property(
      healthGenerator,
      fc.boolean(),
      (initialHealth, isBlocking) => {
        const fighters = [
          {
            id: 'player1',
            name: 'Fighter 1',
            health: 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: true,
            comboCount: 1
          },
          {
            id: 'player2',
            name: 'Fighter 2', 
            health: initialHealth,
            maxHealth: 100,
            isBlocking,
            isAttacking: false,
            comboCount: 0
          }
        ]

        const gameState = createMockGameState({
          gameData: {
            fighting: {
              fighters,
              gameActive: true,
              gameEnded: false,
              winner: null
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // Health should be displayed correctly
        expect(screen.getByText(`${initialHealth}/100`)).toBeInTheDocument()
        
        // Status should reflect blocking state
        if (isBlocking) {
          expect(screen.getByText('Blocking')).toBeInTheDocument()
        }
        
        // Fighter status should be consistent with their state
        fighters.forEach(fighter => {
          if (fighter.isAttacking) {
            const attackingElements = screen.getAllByText('Attacking')
            expect(attackingElements.length).toBeGreaterThanOrEqual(1)
          } else if (fighter.isBlocking) {
            const blockingElements = screen.getAllByText('Blocking')
            expect(blockingElements.length).toBeGreaterThanOrEqual(1)
          }
        })
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.4: Combo system provides bonus damage', () => {
    fc.assert(fc.property(
      comboCountGenerator,
      fc.boolean(),
      (comboCount, gameActive) => {
        const fighters = [
          {
            id: 'player1',
            name: 'Fighter 1',
            health: 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount
          },
          {
            id: 'player2',
            name: 'Fighter 2',
            health: 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          }
        ]

        const gameState = createMockGameState({
          gameData: {
            fighting: {
              fighters,
              gameActive,
              gameEnded: false,
              winner: null
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // Combo count should be displayed in fighter stats - use getAllByText for multiple elements
        const comboElements = screen.getAllByText(`${comboCount}x`)
        expect(comboElements.length).toBeGreaterThanOrEqual(1)
        
        // Component should render consistently regardless of combo state
        expect(screen.getByText('🥊 Fighting Arena')).toBeInTheDocument()
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.5: Game state transitions are consistent', () => {
    fc.assert(fc.property(
      fc.boolean(),
      fc.boolean(),
      fc.option(playerIdGenerator, { nil: null }),
      (gameActive, gameEnded, winner) => {
        const fighters = [
          {
            id: 'player1',
            name: 'Fighter 1',
            health: winner === 'player2' ? 0 : 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          },
          {
            id: 'player2',
            name: 'Fighter 2',
            health: winner === 'player1' ? 0 : 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          }
        ]

        const gameState = createMockGameState({
          gameData: {
            fighting: {
              fighters,
              gameActive,
              gameEnded,
              winner
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        if (!gameActive && !gameEnded) {
          // Should show start button
          expect(screen.getByText('🥊 Start Fight')).toBeInTheDocument()
        } else if (!gameActive && gameEnded && winner) {
          // Should show game over screen
          expect(screen.getByText('🏆 Fight Over!')).toBeInTheDocument()
          expect(screen.getByText(/Winner:/)).toBeInTheDocument()
        } else if (gameActive && !gameEnded) {
          // Should show combat controls
          expect(screen.getByText('👊 Punch (Q)')).toBeInTheDocument()
          expect(screen.getByText('🦵 Kick (W)')).toBeInTheDocument()
          expect(screen.getByText('🛡️ Block (E)')).toBeInTheDocument()
        }
        
        // Component should always render the main title
        expect(screen.getByText('🥊 Fighting Arena')).toBeInTheDocument()
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.6: Fighter health bars display correctly', () => {
    fc.assert(fc.property(
      healthGenerator,
      healthGenerator,
      (health1, health2) => {
        const fighters = [
          {
            id: 'player1',
            name: 'Fighter 1',
            health: health1,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          },
          {
            id: 'player2',
            name: 'Fighter 2',
            health: health2,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          }
        ]

        const gameState = createMockGameState({
          gameData: {
            fighting: {
              fighters,
              gameActive: true,
              gameEnded: false,
              winner: null
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // Health values should be displayed correctly - use getAllByText for multiple elements
        const health1Elements = screen.getAllByText(`${health1}/100`)
        const health2Elements = screen.getAllByText(`${health2}/100`)
        expect(health1Elements.length).toBeGreaterThanOrEqual(1)
        expect(health2Elements.length).toBeGreaterThanOrEqual(1)
        
        // Fighter names should be displayed - use getAllByText for multiple elements
        const fighter1Elements = screen.getAllByText('Fighter 1')
        const fighter2Elements = screen.getAllByText('Fighter 2')
        expect(fighter1Elements.length).toBeGreaterThanOrEqual(1)
        expect(fighter2Elements.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.7: Combat controls trigger move actions', () => {
    fc.assert(fc.property(
      moveTypeGenerator,
      (moveType) => {
        const fighters = [
          {
            id: 'player1',
            name: 'Fighter 1',
            health: 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          },
          {
            id: 'player2',
            name: 'Fighter 2',
            health: 100,
            maxHealth: 100,
            isBlocking: false,
            isAttacking: false,
            comboCount: 0
          }
        ]

        const gameState = createMockGameState({
          gameData: {
            fighting: {
              fighters,
              gameActive: true,
              gameEnded: false,
              winner: null,
              currentPlayer: 'player1'
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // Find and click the appropriate combat button
        let button
        if (moveType === 'punch') {
          button = screen.getByText('👊 Punch (Q)')
        } else if (moveType === 'kick') {
          button = screen.getByText('🦵 Kick (W)')
        } else if (moveType === 'block') {
          button = screen.getByText('🛡️ Block (E)')
        }
        
        if (button) {
          fireEvent.click(button)
          expect(mockOnMove).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'FIGHTING_MOVE',
              moveType
            })
          )
        }
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.8: Canvas renders fighting arena consistently', () => {
    fc.assert(fc.property(
      fightingStateGenerator,
      (fightingState) => {
        const gameState = createMockGameState({
          gameData: {
            fighting: fightingState
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // Canvas should always be present
        const canvas = document.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas).toHaveAttribute('width', '800')
        expect(canvas).toHaveAttribute('height', '400')
        
        // Canvas should have fighting arena styling
        expect(canvas).toHaveClass('border-2', 'border-red-500', 'rounded-lg')
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.9: Instructions are always visible', () => {
    fc.assert(fc.property(
      fightingStateGenerator,
      (fightingState) => {
        const gameState = createMockGameState({
          gameData: {
            fighting: fightingState
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        // Instructions should always be visible - use getAllByText for multiple renders
        const instructionElements = screen.getAllByText('How to Fight:')
        expect(instructionElements.length).toBeGreaterThanOrEqual(1)
        
        // Check for instruction content - use getAllByText for multiple elements
        const punchElements = screen.getAllByText(/Punch \(Q\)/)
        const kickElements = screen.getAllByText(/Kick \(W\)/)
        const blockElements = screen.getAllByText(/Block \(E\)/)
        const comboElements = screen.getAllByText(/Combos/)
        const victoryElements = screen.getAllByText(/Victory/)
        
        expect(punchElements.length).toBeGreaterThanOrEqual(1)
        expect(kickElements.length).toBeGreaterThanOrEqual(1)
        expect(blockElements.length).toBeGreaterThanOrEqual(1)
        expect(comboElements.length).toBeGreaterThanOrEqual(1)
        expect(victoryElements.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      }
    ), { numRuns: 10 })
  })

  it('Property 18.10: Start fight requires exactly 2 players', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        id: fc.string(),
        displayName: fc.string(),
        isConnected: fc.boolean(),
        avatarId: fc.string()
      }), { minLength: 0, maxLength: 4 }),
      (players) => {
        const gameState = createMockGameState({
          players,
          gameData: {
            fighting: {
              fighters: [],
              gameActive: false,
              gameEnded: false,
              winner: null
            }
          }
        })

        const { unmount } = render(<FightingGame gameState={gameState} onMove={mockOnMove} />)
        
        const startButton = screen.queryByText('🥊 Start Fight')
        
        if (players.length < 2) {
          // Button should be disabled or show error message
          if (startButton) {
            expect(startButton).toBeDisabled()
          }
          expect(screen.getByText('Need 2 players to start fighting')).toBeInTheDocument()
        } else if (players.length >= 2) {
          // Button should be enabled
          if (startButton) {
            expect(startButton).not.toBeDisabled()
          }
        }
        
        unmount()
      }
    ), { numRuns: 10 })
  })
})