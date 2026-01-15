import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import {
  joinQueue,
  leaveQueue,
  getQueueStatus,
  resetMatchmaking,
  clearError,
  updateQueueTime
} from '../store/slices/matchmakingSlice'
import { useMatchmakingWebSocket } from '../hooks/useMatchmakingWebSocket'

const MatchmakingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { profile } = useSelector((state: RootState) => state.profile)
  const {
    isInQueue,
    queueStartTime,
    estimatedWaitTime,
    gameType,
    status,
    matchFound,
    matchDetails,
    error,
    queuePosition,
    alternativeGames
  } = useSelector((state: RootState) => state.matchmaking)

  const [selectedGameType, setSelectedGameType] = useState<string>('')
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  // Initialize WebSocket connection
  const { isConnected } = useMatchmakingWebSocket(profile?.userId?.toString() || null)

  const gameTypes = [
    { id: 'CAR_RACING', name: 'Car Racing', icon: '🏎️', players: '2-8 players' },
    { id: 'CHESS', name: 'Chess', icon: '♟️', players: '2 players' },
    { id: 'UNO', name: 'Uno', icon: '🃏', players: '2-4 players' },
    { id: 'RUMMY', name: 'Rummy', icon: '🎴', players: '2-6 players' },
    { id: 'LUDO', name: 'Ludo', icon: '🎲', players: '2-4 players' },
    { id: 'FIGHTING', name: 'Fighting', icon: '🥊', players: '2 players' },
    { id: 'BUBBLE_BLAST', name: 'Bubble Blast', icon: '🫧', players: '1-4 players' },
    { id: 'MATH_MASTER', name: 'Math Master', icon: '🧮', players: '2-8 players' }
  ]

  // Timer effect for queue time
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInQueue && queueStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - queueStartTime) / 1000)
        setElapsedTime(elapsed)
        
        // Update queue time in store (for timeout logic)
        dispatch(updateQueueTime())
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isInQueue, queueStartTime, dispatch])

  // Check queue status on component mount
  useEffect(() => {
    dispatch(getQueueStatus())
  }, [dispatch])

  // Handle match found
  useEffect(() => {
    if (matchFound && matchDetails) {
      // Navigate to game session
      navigate(`/game/${matchDetails.sessionId}`)
    }
  }, [matchFound, matchDetails, navigate])

  const handleJoinQueue = async () => {
    if (!selectedGameType) return
    
    dispatch(clearError())
    await dispatch(joinQueue({
      gameType: selectedGameType,
      skillLevel: profile?.gameExperience || 'BEGINNER'
    }))
  }

  const handleLeaveQueue = async () => {
    await dispatch(leaveQueue())
    setElapsedTime(0)
  }

  const handleGoBack = () => {
    if (isInQueue) {
      handleLeaveQueue()
    }
    dispatch(resetMatchmaking())
    navigate('/dashboard')
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="border-b border-cyber-gray-700 bg-cyber-darker">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="text-cyber-primary hover:text-cyber-secondary transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-cyber text-gradient">
                Matchmaking Queue
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="text-cyber-primary font-mono">
                {profile?.displayName || 'Player'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!isInQueue ? (
          // Game Selection Screen
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-cyber text-gradient mb-4">
                Choose Your Battle
              </h2>
              <p className="text-cyber-gray-300 text-lg">
                Select a game type and we'll find you worthy opponents
              </p>
            </div>

            {error && (
              <div className="card-cyber border-red-500 bg-red-500/10">
                <div className="flex items-center space-x-3">
                  <span className="text-red-400 text-xl">⚠️</span>
                  <div>
                    <p className="text-red-400 font-medium">Error</p>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => dispatch(clearError())}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameTypes.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGameType(game.id)}
                  className={`
                    card-cyber cursor-pointer transition-all duration-300 hover:scale-105
                    ${selectedGameType === game.id 
                      ? 'border-cyber-primary bg-cyber-primary/10 shadow-cyber-primary' 
                      : 'hover:border-cyber-secondary'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">{game.icon}</div>
                    <h3 className="text-lg font-cyber text-cyber-light mb-2">
                      {game.name}
                    </h3>
                    <p className="text-cyber-gray-400 text-sm mb-4">
                      {game.players}
                    </p>
                    {selectedGameType === game.id && (
                      <div className="text-cyber-primary text-sm font-medium">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleJoinQueue}
                disabled={!selectedGameType || status === 'searching'}
                className={`
                  px-8 py-4 rounded-lg font-cyber text-lg transition-all duration-300
                  ${selectedGameType && status !== 'searching'
                    ? 'bg-cyber-primary text-cyber-dark hover:bg-cyber-secondary hover:scale-105 shadow-cyber-primary'
                    : 'bg-cyber-gray-600 text-cyber-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {status === 'searching' ? 'Joining Queue...' : 'Enter Matchmaking'}
              </button>
            </div>
          </div>
        ) : (
          // Queue Status Screen
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-cyber text-gradient mb-4">
                Searching for Opponents
              </h2>
              <p className="text-cyber-gray-300 text-lg">
                Game: <span className="text-cyber-primary font-medium">
                  {gameTypes.find(g => g.id === gameType)?.name || gameType}
                </span>
              </p>
            </div>

            {/* Queue Status Card */}
            <div className="card-cyber-glow max-w-2xl mx-auto">
              <div className="text-center space-y-6">
                {/* Animated searching indicator */}
                <div className="relative">
                  <div className="w-32 h-32 mx-auto border-4 border-cyber-primary/30 rounded-full">
                    <div className="w-full h-full border-4 border-transparent border-t-cyber-primary rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">
                      {gameTypes.find(g => g.id === gameType)?.icon || '🎮'}
                    </span>
                  </div>
                </div>

                {/* Queue Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-cyber-gray-400 text-sm uppercase tracking-wider mb-2">
                      Time Elapsed
                    </p>
                    <p className="text-2xl font-mono text-cyber-primary">
                      {formatTime(elapsedTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-cyber-gray-400 text-sm uppercase tracking-wider mb-2">
                      Queue Position
                    </p>
                    <p className="text-2xl font-mono text-cyber-secondary">
                      {queuePosition ? `#${queuePosition}` : '---'}
                    </p>
                  </div>
                  <div>
                    <p className="text-cyber-gray-400 text-sm uppercase tracking-wider mb-2">
                      Est. Wait Time
                    </p>
                    <p className="text-2xl font-mono text-green-400">
                      {formatTime(estimatedWaitTime)}
                    </p>
                  </div>
                </div>

                {/* Status Messages */}
                <div className="space-y-3">
                  {status === 'searching' && (
                    <p className="text-cyber-gray-300">
                      🔍 Scanning the cybernet for compatible opponents...
                    </p>
                  )}
                  
                  {elapsedTime > 30 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-400 text-sm">
                        ⏱️ Taking longer than expected. Expanding search criteria...
                      </p>
                    </div>
                  )}

                  {elapsedTime > 60 && alternativeGames.length > 0 && (
                    <div className="bg-cyber-secondary/10 border border-cyber-secondary/30 rounded-lg p-4">
                      <p className="text-cyber-secondary text-sm mb-2">
                        💡 Try these popular games with shorter wait times:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {alternativeGames.map((altGame) => (
                          <button
                            key={altGame}
                            onClick={() => {
                              handleLeaveQueue()
                              setSelectedGameType(altGame)
                            }}
                            className="px-3 py-1 bg-cyber-secondary/20 border border-cyber-secondary text-cyber-secondary text-xs rounded-full hover:bg-cyber-secondary/30 transition-colors"
                          >
                            {gameTypes.find(g => g.id === altGame)?.name || altGame}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cancel Button */}
                <button
                  onClick={handleLeaveQueue}
                  className="px-6 py-3 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/10 transition-all duration-300"
                >
                  Cancel Search
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default MatchmakingPage