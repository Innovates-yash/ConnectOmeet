import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GameState } from '../../hooks/useGameState'

interface FightingGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface Fighter {
  id: string
  name: string
  x: number
  y: number
  health: number
  maxHealth: number
  facing: 'left' | 'right'
  isBlocking: boolean
  isAttacking: boolean
  attackType: 'punch' | 'kick' | null
  comboCount: number
  lastMoveTime: number
}

interface FightingGameState {
  fighters: Fighter[]
  gameActive: boolean
  gameEnded: boolean
  winner: string | null
  currentPlayer: string
  moveHistory: Array<{
    playerId: string
    moveType: 'punch' | 'kick' | 'block'
    timestamp: number
    damage?: number
    blocked?: boolean
    combo?: boolean
  }>
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 400
const FIGHTER_WIDTH = 60
const FIGHTER_HEIGHT = 80
const BASE_DAMAGE = { punch: 15, kick: 25 }
const COMBO_MULTIPLIER = 1.5
const COMBO_WINDOW = 2000 // 2 seconds for combo window
const BLOCK_REDUCTION = 0.3 // 70% damage reduction when blocking

const FightingGame: React.FC<FightingGameProps> = ({ gameState, onMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const [gameState_internal, setGameState_internal] = useState<FightingGameState>({
    fighters: [],
    gameActive: false,
    gameEnded: false,
    winner: null,
    currentPlayer: gameState.players[0]?.id || '',
    moveHistory: []
  })

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.fighting) {
      setGameState_internal(prev => ({ ...prev, ...gameState.gameData.fighting }))
    }
  }, [gameState.gameData])

  // Initialize fighters when game starts
  const initializeFighters = useCallback(() => {
    if (gameState.players.length < 2) return

    const fighters: Fighter[] = [
      {
        id: gameState.players[0].id,
        name: gameState.players[0].displayName,
        x: 150,
        y: CANVAS_HEIGHT - FIGHTER_HEIGHT - 50,
        health: 100,
        maxHealth: 100,
        facing: 'right',
        isBlocking: false,
        isAttacking: false,
        attackType: null,
        comboCount: 0,
        lastMoveTime: 0
      },
      {
        id: gameState.players[1].id,
        name: gameState.players[1].displayName,
        x: CANVAS_WIDTH - 150 - FIGHTER_WIDTH,
        y: CANVAS_HEIGHT - FIGHTER_HEIGHT - 50,
        health: 100,
        maxHealth: 100,
        facing: 'left',
        isBlocking: false,
        isAttacking: false,
        attackType: null,
        comboCount: 0,
        lastMoveTime: 0
      }
    ]

    setGameState_internal(prev => ({
      ...prev,
      fighters,
      gameActive: true,
      gameEnded: false,
      winner: null,
      moveHistory: []
    }))

    onMove({
      type: 'FIGHTING_START',
      fighters,
      gameState: {
        fighters,
        gameActive: true,
        gameEnded: false
      }
    })
  }, [gameState.players, onMove])

  // Execute combat move
  const executeCombatMove = useCallback((moveType: 'punch' | 'kick' | 'block', playerId: string) => {
    if (!gameState_internal.gameActive || gameState_internal.gameEnded) return

    setGameState_internal(prev => {
      const fighters = [...prev.fighters]
      const attackerIndex = fighters.findIndex(f => f.id === playerId)
      const defenderIndex = attackerIndex === 0 ? 1 : 0
      
      if (attackerIndex === -1) return prev

      const attacker = { ...fighters[attackerIndex] }
      const defender = { ...fighters[defenderIndex] }
      const currentTime = Date.now()

      let damage = 0
      let blocked = false
      let isCombo = false

      if (moveType === 'block') {
        // Set blocking state
        attacker.isBlocking = true
        attacker.attackType = null
        attacker.isAttacking = false
        
        // Reset blocking after 1 second - use ref to track timeout
        const timeoutId = setTimeout(() => {
          setGameState_internal(current => ({
            ...current,
            fighters: current.fighters.map(f => 
              f.id === playerId ? { ...f, isBlocking: false } : f
            )
          }))
        }, 1000)
        
        // Store timeout ID for cleanup
        if (typeof window !== 'undefined') {
          (window as any).fightingGameTimeouts = (window as any).fightingGameTimeouts || []
          ;(window as any).fightingGameTimeouts.push(timeoutId)
        }
      } else {
        // Attack move
        attacker.isAttacking = true
        attacker.attackType = moveType
        attacker.isBlocking = false

        // Check if defender is blocking
        blocked = defender.isBlocking

        // Calculate base damage
        damage = BASE_DAMAGE[moveType]

        // Check for combo
        if (currentTime - attacker.lastMoveTime < COMBO_WINDOW && attacker.comboCount > 0) {
          isCombo = true
          damage = Math.floor(damage * COMBO_MULTIPLIER)
          attacker.comboCount++
        } else {
          attacker.comboCount = 1
        }

        // Apply blocking reduction
        if (blocked) {
          damage = Math.floor(damage * BLOCK_REDUCTION)
        }

        // Apply damage
        defender.health = Math.max(0, defender.health - damage)
        attacker.lastMoveTime = currentTime

        // Reset attack animation after 500ms
        const timeoutId = setTimeout(() => {
          setGameState_internal(current => ({
            ...current,
            fighters: current.fighters.map(f => 
              f.id === playerId ? { ...f, isAttacking: false, attackType: null } : f
            )
          }))
        }, 500)
        
        // Store timeout ID for cleanup
        if (typeof window !== 'undefined') {
          (window as any).fightingGameTimeouts = (window as any).fightingGameTimeouts || []
          ;(window as any).fightingGameTimeouts.push(timeoutId)
        }
      }

      fighters[attackerIndex] = attacker
      fighters[defenderIndex] = defender

      // Check for winner
      let winner = null
      let gameEnded = false
      if (defender.health <= 0) {
        winner = attacker.id
        gameEnded = true
      }

      const moveRecord = {
        playerId,
        moveType,
        timestamp: currentTime,
        damage: moveType !== 'block' ? damage : undefined,
        blocked: moveType !== 'block' ? blocked : undefined,
        combo: moveType !== 'block' ? isCombo : undefined
      }

      return {
        ...prev,
        fighters,
        winner,
        gameEnded,
        moveHistory: [...prev.moveHistory, moveRecord]
      }
    })

    // Send move to server
    onMove({
      type: 'FIGHTING_MOVE',
      playerId,
      moveType,
      timestamp: Date.now()
    })
  }, [gameState_internal.gameActive, gameState_internal.gameEnded, onMove])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && (window as any).fightingGameTimeouts) {
        (window as any).fightingGameTimeouts.forEach((timeoutId: NodeJS.Timeout) => {
          clearTimeout(timeoutId)
        })
        ;(window as any).fightingGameTimeouts = []
      }
    }
  }, [])

  // Handle key presses for combat moves
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameState_internal.gameActive || gameState_internal.gameEnded) return

      const currentPlayerId = gameState.players.find(p => p.id === gameState_internal.currentPlayer)?.id
      if (!currentPlayerId) return

      switch (event.key.toLowerCase()) {
        case 'q':
          executeCombatMove('punch', currentPlayerId)
          break
        case 'w':
          executeCombatMove('kick', currentPlayerId)
          break
        case 'e':
          executeCombatMove('block', currentPlayerId)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState_internal.gameActive, gameState_internal.gameEnded, gameState_internal.currentPlayer, gameState.players, executeCombatMove])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      draw()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    if (gameState_internal.gameActive) {
      animate()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState_internal.gameActive])

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with fighting arena background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#2d1b69')
    gradient.addColorStop(1, '#11001c')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw arena floor
    ctx.fillStyle = '#4a4a4a'
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50)

    // Draw fighters
    gameState_internal.fighters.forEach((fighter, index) => {
      // Fighter body
      ctx.fillStyle = index === 0 ? '#ff6b6b' : '#4ecdc4'
      if (fighter.isBlocking) {
        ctx.fillStyle = '#ffd93d' // Yellow when blocking
      } else if (fighter.isAttacking) {
        ctx.fillStyle = '#ff4757' // Red when attacking
      }
      
      ctx.fillRect(fighter.x, fighter.y, FIGHTER_WIDTH, FIGHTER_HEIGHT)

      // Fighter outline
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(fighter.x, fighter.y, FIGHTER_WIDTH, FIGHTER_HEIGHT)

      // Fighter name
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(fighter.name, fighter.x + FIGHTER_WIDTH / 2, fighter.y - 10)

      // Health bar background
      const healthBarWidth = FIGHTER_WIDTH
      const healthBarHeight = 8
      const healthBarY = fighter.y - 25
      
      ctx.fillStyle = '#333333'
      ctx.fillRect(fighter.x, healthBarY, healthBarWidth, healthBarHeight)

      // Health bar
      const healthPercentage = fighter.health / fighter.maxHealth
      const currentHealthWidth = healthBarWidth * healthPercentage
      
      ctx.fillStyle = healthPercentage > 0.6 ? '#4ecdc4' : 
                     healthPercentage > 0.3 ? '#ffd93d' : '#ff6b6b'
      ctx.fillRect(fighter.x, healthBarY, currentHealthWidth, healthBarHeight)

      // Health bar border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(fighter.x, healthBarY, healthBarWidth, healthBarHeight)

      // Health text
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${fighter.health}/100`, fighter.x + FIGHTER_WIDTH / 2, healthBarY - 5)

      // Attack animation
      if (fighter.isAttacking && fighter.attackType) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.7)'
        if (fighter.attackType === 'punch') {
          // Draw punch effect
          const punchX = fighter.facing === 'right' ? fighter.x + FIGHTER_WIDTH : fighter.x - 20
          ctx.fillRect(punchX, fighter.y + 20, 20, 15)
        } else if (fighter.attackType === 'kick') {
          // Draw kick effect
          const kickX = fighter.facing === 'right' ? fighter.x + FIGHTER_WIDTH : fighter.x - 25
          ctx.fillRect(kickX, fighter.y + 40, 25, 20)
        }
      }

      // Block animation
      if (fighter.isBlocking) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'
        ctx.fillRect(fighter.x - 5, fighter.y - 5, FIGHTER_WIDTH + 10, FIGHTER_HEIGHT + 10)
      }

      // Combo indicator
      if (fighter.comboCount > 1) {
        ctx.fillStyle = '#ff6b6b'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${fighter.comboCount}x COMBO!`, fighter.x + FIGHTER_WIDTH / 2, fighter.y - 40)
      }
    })

    // Draw center line
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50)
    ctx.stroke()
    ctx.setLineDash([])
  }, [gameState_internal.fighters])

  const getCurrentPlayerFighter = () => {
    return gameState_internal.fighters.find(f => f.id === gameState_internal.currentPlayer)
  }

  const getOpponentFighter = () => {
    return gameState_internal.fighters.find(f => f.id !== gameState_internal.currentPlayer)
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-white">🥊 Fighting Arena</h2>
        {gameState_internal.gameActive && (
          <div className="text-white">
            Current Player: <span className="text-yellow-400 font-bold">{getCurrentPlayerFighter()?.name}</span>
          </div>
        )}
      </div>

      {!gameState_internal.gameActive && !gameState_internal.gameEnded && (
        <div className="text-center">
          <button
            onClick={initializeFighters}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-all transform hover:scale-105 text-white font-bold text-xl"
            disabled={gameState.players.length < 2}
          >
            🥊 Start Fight
          </button>
          {gameState.players.length < 2 && (
            <p className="text-red-400 mt-2">Need 2 players to start fighting</p>
          )}
        </div>
      )}

      {gameState_internal.gameEnded && gameState_internal.winner && (
        <div className="text-center bg-black/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-4">🏆 Fight Over!</h3>
          <p className="text-xl text-yellow-400 mb-4">
            Winner: {gameState_internal.fighters.find(f => f.id === gameState_internal.winner)?.name}
          </p>
          <button
            onClick={initializeFighters}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-all text-white font-bold"
          >
            Fight Again
          </button>
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-red-500 rounded-lg bg-gradient-to-b from-purple-900/20 to-red-900/20"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {gameState_internal.gameActive && (
          <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-2 text-white text-sm">
            <p>🥊 Combat Controls:</p>
            <p>Q - Punch (15 damage)</p>
            <p>W - Kick (25 damage)</p>
            <p>E - Block (70% damage reduction)</p>
          </div>
        )}
      </div>

      {/* Combat Controls */}
      {gameState_internal.gameActive && (
        <div className="flex space-x-4">
          <button
            onClick={() => executeCombatMove('punch', gameState_internal.currentPlayer)}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 border border-orange-500 rounded-lg transition-all text-white font-bold"
          >
            👊 Punch (Q)
          </button>
          <button
            onClick={() => executeCombatMove('kick', gameState_internal.currentPlayer)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-all text-white font-bold"
          >
            🦵 Kick (W)
          </button>
          <button
            onClick={() => executeCombatMove('block', gameState_internal.currentPlayer)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-all text-white font-bold"
          >
            🛡️ Block (E)
          </button>
        </div>
      )}

      {/* Fighter Stats */}
      {gameState_internal.fighters.length === 2 && (
        <div className="w-full max-w-4xl grid grid-cols-2 gap-6">
          {gameState_internal.fighters.map((fighter, index) => (
            <div key={fighter.id} className="bg-black/20 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-lg font-bold text-white mb-2 text-center">{fighter.name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-white">
                  <span>Health:</span>
                  <span className={`font-bold ${
                    fighter.health > 60 ? 'text-green-400' : 
                    fighter.health > 30 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {fighter.health}/100
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Combo:</span>
                  <span className="text-purple-400 font-bold">{fighter.comboCount}x</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Status:</span>
                  <span className={`font-bold ${
                    fighter.isAttacking ? 'text-red-400' :
                    fighter.isBlocking ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {fighter.isAttacking ? 'Attacking' : 
                     fighter.isBlocking ? 'Blocking' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Move History */}
      {gameState_internal.moveHistory.length > 0 && (
        <div className="w-full max-w-4xl bg-black/20 border border-purple-500/30 rounded-lg p-4">
          <h4 className="text-lg font-bold text-white mb-3">Combat Log</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {gameState_internal.moveHistory.slice(-5).map((move, index) => {
              const fighter = gameState_internal.fighters.find(f => f.id === move.playerId)
              return (
                <div key={index} className="text-sm text-gray-300">
                  <span className="text-white font-bold">{fighter?.name}</span> used{' '}
                  <span className={`font-bold ${
                    move.moveType === 'punch' ? 'text-orange-400' :
                    move.moveType === 'kick' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {move.moveType}
                  </span>
                  {move.damage && (
                    <>
                      {' '}for <span className="text-red-400 font-bold">{move.damage}</span> damage
                      {move.blocked && <span className="text-blue-400"> (blocked)</span>}
                      {move.combo && <span className="text-purple-400"> (COMBO!)</span>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 text-center max-w-4xl">
        <div className="text-white">
          <h4 className="font-bold mb-2">How to Fight:</h4>
          <div className="text-sm space-y-1">
            <p>👊 <strong>Punch (Q):</strong> Quick attack dealing 15 damage</p>
            <p>🦵 <strong>Kick (W):</strong> Powerful attack dealing 25 damage</p>
            <p>🛡️ <strong>Block (E):</strong> Reduce incoming damage by 70%</p>
            <p>⚡ <strong>Combos:</strong> Chain attacks within 2 seconds for 50% bonus damage</p>
            <p>🏆 <strong>Victory:</strong> Reduce opponent's health to 0 to win!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FightingGame