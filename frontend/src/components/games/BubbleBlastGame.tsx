import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GameState } from '../../hooks/useGameState'

interface BubbleBlastGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface Bubble {
  id: number
  x: number
  y: number
  color: string
  radius: number
}

interface Projectile {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  color: string
  radius: number
}

interface BubbleBlastGameState {
  bubbles: Bubble[]
  projectiles: Projectile[]
  score: number
  timeRemaining: number
  gameActive: boolean
  gameEnded: boolean
  nextBubbleColor: string
  shooterX: number
  shooterY: number
  leaderboard: { daily: any[], weekly: any[], allTime: any[] }
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const BUBBLE_RADIUS = 20
const SHOOTER_RADIUS = 15
const GAME_DURATION = 5 * 60 // 5 minutes in seconds

const BubbleBlastGame: React.FC<BubbleBlastGameProps> = ({ gameState, onMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const [gameState_internal, setGameState_internal] = useState<BubbleBlastGameState>({
    bubbles: [],
    projectiles: [],
    score: 0,
    timeRemaining: GAME_DURATION,
    gameActive: false,
    gameEnded: false,
    nextBubbleColor: COLORS[0],
    shooterX: CANVAS_WIDTH / 2,
    shooterY: CANVAS_HEIGHT - 50,
    leaderboard: {
      daily: [
        { name: 'BubbleMaster', score: 15420 },
        { name: 'ArcadeKing', score: 12350 },
        { name: 'PopExpert', score: 9870 }
      ],
      weekly: [
        { name: 'WeeklyChamp', score: 18900 },
        { name: 'BubblePro', score: 16750 },
        { name: 'ScoreHunter', score: 14200 }
      ],
      allTime: [
        { name: 'LegendaryPopper', score: 25600 },
        { name: 'BubbleGod', score: 23400 },
        { name: 'UltimateShooter', score: 21800 }
      ]
    }
  })

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.bubbleBlast) {
      setGameState_internal(prev => ({ ...prev, ...gameState.gameData.bubbleBlast }))
    }
  }, [gameState.gameData])

  // Generate initial bubble grid
  const generateInitialBubbles = useCallback(() => {
    const bubbles: Bubble[] = []
    let id = 0
    
    for (let row = 0; row < 8; row++) {
      const bubblesInRow = 10 - (row % 2)
      const startX = (row % 2) * BUBBLE_RADIUS
      
      for (let col = 0; col < bubblesInRow; col++) {
        bubbles.push({
          id: id++,
          x: startX + col * (BUBBLE_RADIUS * 2),
          y: row * (BUBBLE_RADIUS * 1.8),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          radius: BUBBLE_RADIUS
        })
      }
    }
    
    return bubbles
  }, [])

  // Start game
  const startGame = useCallback(() => {
    const initialBubbles = generateInitialBubbles()
    setGameState_internal(prev => ({
      ...prev,
      bubbles: initialBubbles,
      projectiles: [],
      score: 0,
      timeRemaining: GAME_DURATION,
      gameActive: true,
      gameEnded: false,
      nextBubbleColor: COLORS[Math.floor(Math.random() * COLORS.length)]
    }))

    onMove({
      type: 'BUBBLE_BLAST_START',
      gameState: {
        bubbles: initialBubbles,
        score: 0,
        timeRemaining: GAME_DURATION,
        gameActive: true
      }
    })
  }, [generateInitialBubbles, onMove])

  // End game
  const endGame = useCallback(() => {
    setGameState_internal(prev => ({
      ...prev,
      gameActive: false,
      gameEnded: true
    }))

    onMove({
      type: 'BUBBLE_BLAST_END',
      score: gameState_internal.score,
      gameState: {
        gameActive: false,
        gameEnded: true,
        finalScore: gameState_internal.score
      }
    })
  }, [gameState_internal.score, onMove])

  // Timer countdown
  useEffect(() => {
    if (!gameState_internal.gameActive || gameState_internal.timeRemaining <= 0) return

    const timer = setInterval(() => {
      setGameState_internal(prev => {
        const newTime = prev.timeRemaining - 1
        if (newTime <= 0) {
          setTimeout(endGame, 100)
          return { ...prev, timeRemaining: 0 }
        }
        return { ...prev, timeRemaining: newTime }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState_internal.gameActive, gameState_internal.timeRemaining, endGame])

  // Handle canvas click for shooting
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState_internal.gameActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top

    // Calculate shooting direction
    const dx = clickX - gameState_internal.shooterX
    const dy = clickY - gameState_internal.shooterY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const speed = 8
    const normalizedDx = (dx / distance) * speed
    const normalizedDy = (dy / distance) * speed

    // Create new projectile
    const newProjectile: Projectile = {
      id: Date.now(),
      x: gameState_internal.shooterX,
      y: gameState_internal.shooterY,
      dx: normalizedDx,
      dy: normalizedDy,
      color: gameState_internal.nextBubbleColor,
      radius: BUBBLE_RADIUS
    }

    setGameState_internal(prev => ({
      ...prev,
      projectiles: [...prev.projectiles, newProjectile],
      nextBubbleColor: COLORS[Math.floor(Math.random() * COLORS.length)]
    }))
  }, [gameState_internal.gameActive, gameState_internal.shooterX, gameState_internal.shooterY, gameState_internal.nextBubbleColor])

  // Check collision between two circles
  const checkCollision = useCallback((obj1: { x: number, y: number, radius: number }, obj2: { x: number, y: number, radius: number }) => {
    const dx = obj1.x - obj2.x
    const dy = obj1.y - obj2.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < (obj1.radius + obj2.radius)
  }, [])

  // Find connected bubbles of same color
  const findConnectedBubbles = useCallback((bubbles: Bubble[], startBubble: Bubble): Bubble[] => {
    const connected: Bubble[] = []
    const visited = new Set<number>()
    const queue = [startBubble]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.id)) continue
      
      visited.add(current.id)
      connected.push(current)

      // Find adjacent bubbles of same color
      bubbles.forEach(bubble => {
        if (!visited.has(bubble.id) && 
            bubble.color === startBubble.color && 
            checkCollision(current, bubble)) {
          queue.push(bubble)
        }
      })
    }

    return connected
  }, [checkCollision])

  // Game physics and collision detection
  const updateGame = useCallback(() => {
    if (!gameState_internal.gameActive) return

    setGameState_internal(prev => {
      let newBubbles = [...prev.bubbles]
      let newProjectiles = [...prev.projectiles]
      let newScore = prev.score

      // Update projectiles
      newProjectiles = newProjectiles.map(projectile => ({
        ...projectile,
        x: projectile.x + projectile.dx,
        y: projectile.y + projectile.dy
      })).filter(projectile => {
        // Remove projectiles that hit walls or go off screen
        if (projectile.x <= projectile.radius || projectile.x >= CANVAS_WIDTH - projectile.radius) {
          projectile.dx = -projectile.dx
        }
        if (projectile.y <= projectile.radius) {
          return false // Remove projectile that hits top
        }
        if (projectile.y >= CANVAS_HEIGHT) {
          return false // Remove projectile that goes off bottom
        }

        // Check collision with bubbles
        for (const bubble of newBubbles) {
          if (checkCollision(projectile, bubble)) {
            // Add projectile as new bubble
            const newBubble: Bubble = {
              id: Date.now(),
              x: bubble.x,
              y: bubble.y + bubble.radius * 2,
              color: projectile.color,
              radius: BUBBLE_RADIUS
            }

            // Find connected bubbles of same color
            const connectedBubbles = findConnectedBubbles([...newBubbles, newBubble], newBubble)
            
            if (connectedBubbles.length >= 3) {
              // Remove connected bubbles and award points
              const bubbleIds = new Set(connectedBubbles.map(b => b.id))
              newBubbles = newBubbles.filter(b => !bubbleIds.has(b.id))
              newScore += connectedBubbles.length * 100
            } else {
              // Add the new bubble
              newBubbles.push(newBubble)
            }

            return false // Remove the projectile
          }
        }

        return true // Keep the projectile
      })

      return {
        ...prev,
        bubbles: newBubbles,
        projectiles: newProjectiles,
        score: newScore
      }
    })
  }, [gameState_internal.gameActive, checkCollision, findConnectedBubbles])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      updateGame()
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
  }, [gameState_internal.gameActive, updateGame])

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw bubbles
    gameState_internal.bubbles.forEach(bubble => {
      ctx.beginPath()
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
      ctx.fillStyle = bubble.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Draw projectiles
    gameState_internal.projectiles.forEach(projectile => {
      ctx.beginPath()
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2)
      ctx.fillStyle = projectile.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Draw shooter
    ctx.beginPath()
    ctx.arc(gameState_internal.shooterX, gameState_internal.shooterY, SHOOTER_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = gameState_internal.nextBubbleColor
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw next bubble indicator
    ctx.beginPath()
    ctx.arc(gameState_internal.shooterX + 50, gameState_internal.shooterY, SHOOTER_RADIUS - 5, 0, Math.PI * 2)
    ctx.fillStyle = gameState_internal.nextBubbleColor
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [gameState_internal])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-white">Bubble Blast</h2>
        <div className="flex items-center space-x-6 text-white">
          <div>Score: <span className="text-yellow-400 font-bold text-xl">{gameState_internal.score}</span></div>
          <div>Time: <span className="text-red-400 font-bold text-xl">{formatTime(gameState_internal.timeRemaining)}</span></div>
        </div>
      </div>

      {!gameState_internal.gameActive && !gameState_internal.gameEnded && (
        <div className="text-center">
          <button
            onClick={startGame}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg transition-all transform hover:scale-105 text-white font-bold text-xl"
          >
            🎯 Start Game
          </button>
        </div>
      )}

      {gameState_internal.gameEnded && (
        <div className="text-center bg-black/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-4">🎉 Game Over!</h3>
          <p className="text-xl text-yellow-400 mb-4">Final Score: {gameState_internal.score}</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-all text-white font-bold"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="border-2 border-purple-500 rounded-lg cursor-crosshair bg-gradient-to-b from-purple-900/20 to-blue-900/20"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {gameState_internal.gameActive && (
          <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-2 text-white text-sm">
            <p>🎯 Click to shoot bubbles</p>
            <p>💥 Match 3+ colors to pop</p>
            <p>⏰ {formatTime(gameState_internal.timeRemaining)} remaining</p>
          </div>
        )}
      </div>

      {/* Leaderboards */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/20 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-lg font-bold text-yellow-400 mb-3 text-center">🏆 Daily Leaders</h4>
          {gameState_internal.leaderboard.daily.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-white mb-2">
              <span className="flex items-center">
                <span className="text-yellow-400 mr-2">#{index + 1}</span>
                {entry.name}
              </span>
              <span className="text-yellow-400 font-bold">{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="bg-black/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-lg font-bold text-blue-400 mb-3 text-center">📅 Weekly Leaders</h4>
          {gameState_internal.leaderboard.weekly.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-white mb-2">
              <span className="flex items-center">
                <span className="text-blue-400 mr-2">#{index + 1}</span>
                {entry.name}
              </span>
              <span className="text-blue-400 font-bold">{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4">
          <h4 className="text-lg font-bold text-purple-400 mb-3 text-center">👑 All-Time Leaders</h4>
          {gameState_internal.leaderboard.allTime.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-white mb-2">
              <span className="flex items-center">
                <span className="text-purple-400 mr-2">#{index + 1}</span>
                {entry.name}
              </span>
              <span className="text-purple-400 font-bold">{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4 text-center max-w-4xl">
        <div className="text-white">
          <h4 className="font-bold mb-2">How to Play Bubble Blast:</h4>
          <div className="text-sm space-y-1">
            <p>🎯 <strong>Aim & Shoot:</strong> Click anywhere to shoot bubbles toward that direction</p>
            <p>💥 <strong>Match Colors:</strong> Connect 3 or more bubbles of the same color to pop them</p>
            <p>⏰ <strong>Beat the Clock:</strong> Score as many points as possible in 5 minutes</p>
            <p>🏆 <strong>Compete:</strong> Climb the daily, weekly, and all-time leaderboards!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BubbleBlastGame