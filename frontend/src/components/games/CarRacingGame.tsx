import React, { useRef, useEffect, useState, useCallback } from 'react'
import { GameState } from '../../hooks/useGameState'

interface CarRacingGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface CarPosition {
  id: string
  playerId: string
  x: number
  y: number
  angle: number
  speed: number
  lap: number
  finished: boolean
  color: string
}

interface TrackData {
  width: number
  height: number
  checkpoints: { x: number; y: number }[]
  boundaries: { x1: number; y1: number; x2: number; y2: number }[]
  startLine: { x: number; y: number; width: number }
  finishLine: { x: number; y: number; width: number }
}

interface RacingGameState {
  track: TrackData
  cars: CarPosition[]
  raceStatus: 'waiting' | 'countdown' | 'racing' | 'finished'
  lapCount: number
  maxLaps: number
  startTime: number
  winner?: string
}

const CarRacingGame: React.FC<CarRacingGameProps> = ({ gameState, onMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const keysPressed = useRef<Set<string>>(new Set())
  
  const [racingState, setRacingState] = useState<RacingGameState>({
    track: createDefaultTrack(),
    cars: [],
    raceStatus: 'waiting',
    lapCount: 0,
    maxLaps: 3,
    startTime: 0
  })

  const [countdown, setCountdown] = useState<number>(0)
  const [myCarId, setMyCarId] = useState<string>('')

  // Initialize racing state from game state
  useEffect(() => {
    if (gameState.gameData?.racing) {
      setRacingState(gameState.gameData.racing)
    } else {
      // Initialize cars for all players
      const cars: CarPosition[] = gameState.players.map((player, index) => ({
        id: `car_${player.id}`,
        playerId: player.id,
        x: 100 + (index * 50),
        y: 300,
        angle: 0,
        speed: 0,
        lap: 0,
        finished: false,
        color: getPlayerColor(index)
      }))
      
      setRacingState(prev => ({ ...prev, cars }))
      setMyCarId(`car_${gameState.players.find(p => p.id === 'current_user')?.id || gameState.players[0]?.id}`)
    }
  }, [gameState.gameData, gameState.players])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (racingState.raceStatus === 'racing') {
      const gameLoop = () => {
        updateCarPosition()
        animationFrameRef.current = requestAnimationFrame(gameLoop)
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [racingState.raceStatus])

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    renderGame(ctx)
  }, [racingState])

  const updateCarPosition = useCallback(() => {
    const myCar = racingState.cars.find(car => car.id === myCarId)
    if (!myCar) return

    let newX = myCar.x
    let newY = myCar.y
    let newAngle = myCar.angle
    let newSpeed = myCar.speed

    // Handle input
    if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) {
      newSpeed = Math.min(newSpeed + 0.5, 8)
    }
    if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) {
      newSpeed = Math.max(newSpeed - 0.5, -4)
    }
    if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
      if (Math.abs(newSpeed) > 0.1) {
        newAngle -= 3 * (newSpeed / 8)
      }
    }
    if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
      if (Math.abs(newSpeed) > 0.1) {
        newAngle += 3 * (newSpeed / 8)
      }
    }

    // Apply friction
    newSpeed *= 0.98

    // Calculate new position
    const radians = (newAngle * Math.PI) / 180
    newX += Math.cos(radians) * newSpeed
    newY += Math.sin(radians) * newSpeed

    // Check boundaries
    const collision = checkBoundaryCollision(newX, newY)
    if (collision) {
      newSpeed *= -0.3 // Bounce back with reduced speed
      newX = myCar.x
      newY = myCar.y
    }

    // Check finish line
    const finishLineCrossed = checkFinishLineCrossing(newX, newY, racingState.track.finishLine)
    let newLap = myCar.lap
    
    if (finishLineCrossed && myCar.lap > 0) { // Don't count first crossing as lap completion
      newLap += 1
      if (newLap >= racingState.maxLaps) {
        // Race finished!
        onMove({
          type: 'RACE_FINISHED',
          carId: myCarId,
          position: { x: newX, y: newY, angle: newAngle, speed: newSpeed },
          lap: newLap,
          finishTime: Date.now()
        })
        return
      }
    }

    // Send position update
    onMove({
      type: 'CAR_POSITION_UPDATE',
      carId: myCarId,
      position: { x: newX, y: newY, angle: newAngle, speed: newSpeed },
      lap: newLap
    })

    // Update local state
    setRacingState(prev => ({
      ...prev,
      cars: prev.cars.map(car => 
        car.id === myCarId 
          ? { ...car, x: newX, y: newY, angle: newAngle, speed: newSpeed, lap: newLap }
          : car
      )
    }))
  }, [racingState, myCarId, onMove])

  const startRace = () => {
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setRacingState(prev => ({ 
            ...prev, 
            raceStatus: 'racing', 
            startTime: Date.now() 
          }))
          onMove({ type: 'RACE_STARTED' })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    setRacingState(prev => ({ ...prev, raceStatus: 'countdown' }))
  }

  const renderGame = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw track
    drawTrack(ctx, racingState.track)

    // Draw cars
    racingState.cars.forEach(car => {
      drawCar(ctx, car)
    })

    // Draw UI
    drawUI(ctx, canvas)
  }

  const drawTrack = (ctx: CanvasRenderingContext2D, track: TrackData) => {
    // Draw track boundaries
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 4
    track.boundaries.forEach(boundary => {
      ctx.beginPath()
      ctx.moveTo(boundary.x1, boundary.y1)
      ctx.lineTo(boundary.x2, boundary.y2)
      ctx.stroke()
    })

    // Draw start/finish line
    ctx.strokeStyle = '#4ecdc4'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(track.finishLine.x, track.finishLine.y)
    ctx.lineTo(track.finishLine.x + track.finishLine.width, track.finishLine.y)
    ctx.stroke()

    // Draw checkpoints
    ctx.fillStyle = '#ffe66d'
    track.checkpoints.forEach(checkpoint => {
      ctx.beginPath()
      ctx.arc(checkpoint.x, checkpoint.y, 8, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const drawCar = (ctx: CanvasRenderingContext2D, car: CarPosition) => {
    ctx.save()
    ctx.translate(car.x, car.y)
    ctx.rotate((car.angle * Math.PI) / 180)
    
    // Draw car body
    ctx.fillStyle = car.color
    ctx.fillRect(-15, -8, 30, 16)
    
    // Draw car direction indicator
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(10, -3, 8, 6)
    
    ctx.restore()

    // Draw player name
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    const player = gameState.players.find(p => p.id === car.playerId)
    if (player) {
      ctx.fillText(player.displayName, car.x, car.y - 25)
    }
    
    // Draw lap count
    ctx.fillText(`Lap: ${car.lap}/${racingState.maxLaps}`, car.x, car.y + 35)
  }

  const drawUI = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Draw countdown
    if (racingState.raceStatus === 'countdown' && countdown > 0) {
      ctx.fillStyle = '#ff6b6b'
      ctx.font = 'bold 72px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2)
    }

    // Draw race status
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Status: ${racingState.raceStatus}`, 20, 40)

    // Draw leaderboard
    const sortedCars = [...racingState.cars].sort((a, b) => {
      if (a.lap !== b.lap) return b.lap - a.lap
      // If same lap, sort by distance to finish line (simplified)
      return 0
    })

    ctx.font = '16px Arial'
    sortedCars.forEach((car, index) => {
      const player = gameState.players.find(p => p.id === car.playerId)
      if (player) {
        ctx.fillText(`${index + 1}. ${player.displayName} (Lap ${car.lap})`, 20, 80 + (index * 25))
      }
    })
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-white">Car Racing</h2>
        {racingState.raceStatus === 'waiting' && (
          <button
            onClick={startRace}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
          >
            Start Race
          </button>
        )}
      </div>

      <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 rounded"
          tabIndex={0}
        />
      </div>

      <div className="text-center text-white">
        <p className="text-sm">Use WASD or Arrow Keys to control your car</p>
        <p className="text-xs text-gray-400">Complete {racingState.maxLaps} laps to win!</p>
      </div>
    </div>
  )
}

// Helper functions
function createDefaultTrack(): TrackData {
  return {
    width: 800,
    height: 600,
    checkpoints: [
      { x: 400, y: 150 },
      { x: 650, y: 300 },
      { x: 400, y: 450 },
      { x: 150, y: 300 }
    ],
    boundaries: [
      // Outer boundaries
      { x1: 50, y1: 50, x2: 750, y2: 50 },
      { x1: 750, y1: 50, x2: 750, y2: 550 },
      { x1: 750, y1: 550, x2: 50, y2: 550 },
      { x1: 50, y1: 550, x2: 50, y2: 50 },
      // Inner boundaries (creating a track)
      { x1: 150, y1: 150, x2: 650, y2: 150 },
      { x1: 650, y1: 150, x2: 650, y2: 450 },
      { x1: 650, y1: 450, x2: 150, y2: 450 },
      { x1: 150, y1: 450, x2: 150, y2: 150 }
    ],
    startLine: { x: 100, y: 280, width: 100 },
    finishLine: { x: 100, y: 280, width: 100 }
  }
}

function getPlayerColor(index: number): string {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f']
  return colors[index % colors.length]
}

function checkBoundaryCollision(x: number, y: number): boolean {
  // Simple boundary check - can be enhanced with proper line intersection
  return x < 60 || x > 740 || y < 60 || y > 540 ||
         (x > 140 && x < 660 && y > 140 && y < 460)
}

function checkFinishLineCrossing(
  newX: number, 
  newY: number, 
  finishLine: { x: number; y: number; width: number }
): boolean {
  // Simple line crossing detection
  const lineY = finishLine.y
  const lineX1 = finishLine.x
  const lineX2 = finishLine.x + finishLine.width
  
  return (newY >= lineY && newX >= lineX1 && newX <= lineX2)
}

export default CarRacingGame