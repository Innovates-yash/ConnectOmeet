import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameState } from '../hooks/useGameState'
import { useGameWebSocket } from '../hooks/useGameWebSocket'
import CarRacingGame from './games/CarRacingGame'
import ChessGame from './games/ChessGame'
import UnoGame from './games/UnoGame'
import RummyGame from './games/RummyGame'
import LudoGame from './games/LudoGame'
import TruthOrDareGame from './games/TruthOrDareGame'
import MemeBattleGame from './games/MemeBattleGame'
import BubbleBlastGame from './games/BubbleBlastGame'
import FightingGame from './games/FightingGame'
import MathMasterGame from './games/MathMasterGame'

interface GameEngineProps {
  gameType?: string
  sessionId?: string
}

const GameEngine: React.FC<GameEngineProps> = ({ gameType: propGameType, sessionId: propSessionId }) => {
  const { gameType: paramGameType, sessionId: paramSessionId } = useParams()
  const navigate = useNavigate()
  
  const gameType = propGameType || paramGameType
  const sessionId = propSessionId || paramSessionId
  
  // Use custom hooks for game state and WebSocket
  const {
    gameState,
    error: gameError,
    updateGameState,
    addMove,
    addPlayer,
    removePlayer,
    setError
  } = useGameState(sessionId || '', gameType || '')

  const { isConnected, sendMove, leaveGame } = useGameWebSocket(
    sessionId || '',
    {
      onGameStateUpdate: (updates) => updateGameState(updates),
      onPlayerJoined: (player) => addPlayer(player),
      onPlayerLeft: (playerId) => removePlayer(playerId),
      onMoveReceived: (move) => addMove(move),
      onGameEnded: (result) => {
        updateGameState({ status: 'finished' })
        console.log('Game ended:', result)
      },
      onError: (error) => setError(error)
    }
  )
  
  const [timer, setTimer] = useState<number>(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize loading state
  useEffect(() => {
    if (gameState.status && gameState.status !== 'waiting') {
      setIsLoading(false)
    }
  }, [gameState.status])

  // Timer hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => {
          if (timer <= 1) {
            setIsTimerActive(false)
            handleTimerExpired()
            return 0
          }
          return timer - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerActive, timer])

  const handleTimerExpired = () => {
    // Handle timer expiration based on game type
    console.log('Timer expired for game:', gameType)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderGameContent = () => {
    switch (gameType) {
      case 'CHESS':
        return <ChessGame gameState={gameState} onMove={handleMove} />
      case 'CAR_RACING':
        return <CarRacingGame gameState={gameState} onMove={handleMove} />
      case 'UNO':
        return <UnoGame gameState={gameState} onMove={handleMove} />
      case 'RUMMY':
        return <RummyGame gameState={gameState} onMove={handleMove} />
      case 'LUDO':
        return <LudoGame gameState={gameState} onMove={handleMove} />
      case 'TRUTH_DARE':
        return <TruthOrDareGame gameState={gameState} onMove={handleMove} />
      case 'MEME_BATTLE':
        return <MemeBattleGame gameState={gameState} onMove={handleMove} />
      case 'FIGHTING':
        return <FightingGame gameState={gameState} onMove={handleMove} />
      case 'BUBBLE_BLAST':
        return <BubbleBlastGame gameState={gameState} onMove={handleMove} />
      case 'MATH_MASTER':
        return <MathMasterGame gameState={gameState} onMove={handleMove} />
      default:
        return <div className="text-center text-red-400">Unknown game type: {gameType}</div>
    }
  }

  const handleMove = (moveData: any) => {
    // Send move via WebSocket
    sendMove(moveData)
    
    // Add move to local state
    addMove({
      playerId: gameState.currentPlayer,
      moveType: moveData.type || 'unknown',
      moveData
    })
  }

  const handleLeaveGame = () => {
    leaveGame()
    navigate('/dashboard')
  }

  if (!gameType || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-black/20 backdrop-blur-sm border border-red-500/50 rounded-lg p-8">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Game Session</h2>
          <p className="text-gray-300 mb-6">
            The game session could not be found or has expired.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="block w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 border border-purple-500 rounded-lg transition-colors text-white font-semibold"
            >
              Return to Dashboard
            </button>
            <button 
              onClick={() => navigate('/matchmaking')}
              className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-colors text-white font-semibold"
            >
              Find New Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Game Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLeaveGame}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg transition-colors text-red-400"
            >
              Leave Game
            </button>
            <h1 className="text-2xl font-bold text-white">
              {getGameDisplayName(gameType)}
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Timer */}
            {timer > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400 font-mono text-lg">
                  {formatTime(timer)}
                </span>
              </div>
            )}
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            {/* Game Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                gameState.status === 'active' ? 'bg-green-400' :
                gameState.status === 'waiting' ? 'bg-yellow-400' :
                gameState.status === 'paused' ? 'bg-orange-400' :
                'bg-red-400'
              }`}></div>
              <span className="text-white capitalize">{gameState.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <h3 className="text-lg font-semibold text-white">Players:</h3>
            <div className="flex space-x-4">
              {gameState.players.map((player) => (
                <div key={player.id} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    player.isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-white">{player.displayName}</span>
                  {gameState.scores && (
                    <span className="text-purple-300">({gameState.scores[player.id] || 0})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-white mb-2">Loading Game...</h3>
                <p className="text-gray-300">Preparing your {getGameDisplayName(gameType)} experience</p>
              </div>
            </div>
          )}
          
          {gameError && (
            <div className="mb-4 p-4 bg-red-600/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-red-400 text-xl">⚠️</div>
                <div>
                  <h3 className="text-red-400 font-semibold">Game Error</h3>
                  <p className="text-red-300">{gameError}</p>
                </div>
              </div>
            </div>
          )}
          
          {!isLoading && !gameError && renderGameContent()}
        </div>
      </div>
    </div>
  )
}

// Placeholder game components

const getGameDisplayName = (gameType: string): string => {
  const gameNames: Record<string, string> = {
    'CAR_RACING': 'Car Racing',
    'CHESS': 'Chess',
    'UNO': 'Uno',
    'RUMMY': 'Rummy',
    'LUDO': 'Ludo',
    'TRUTH_DARE': 'Truth or Dare',
    'MEME_BATTLE': 'Meme Battle',
    'FIGHTING': 'Fighting',
    'BUBBLE_BLAST': 'Bubble Blast',
    'MATH_MASTER': 'Math Master'
  }
  return gameNames[gameType] || gameType
}

export default GameEngine