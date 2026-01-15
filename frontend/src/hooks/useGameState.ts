import { useState, useCallback } from 'react'

export interface GameState {
  sessionId: string
  gameType: string
  players: Player[]
  currentPlayer: string
  gameData: any
  status: 'waiting' | 'active' | 'paused' | 'finished'
  timer?: number
  scores?: Record<string, number>
  moves: GameMove[]
}

export interface Player {
  id: string
  displayName: string
  avatarId: string
  isConnected: boolean
}

export interface GameMove {
  id: string
  playerId: string
  moveType: string
  moveData: any
  timestamp: number
}

export const useGameState = (sessionId: string, gameType: string) => {
  const [gameState, setGameState] = useState<GameState>({
    sessionId,
    gameType,
    players: [],
    currentPlayer: '',
    gameData: {},
    status: 'waiting',
    moves: []
  })

  const [error, setError] = useState<string | null>(null)

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }))
  }, [])

  const addMove = useCallback((move: Omit<GameMove, 'id' | 'timestamp'>) => {
    const newMove: GameMove = {
      ...move,
      id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    
    setGameState(prev => ({
      ...prev,
      moves: [...prev.moves, newMove]
    }))
    
    return newMove
  }, [])

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => 
        player.id === playerId ? { ...player, ...updates } : player
      )
    }))
  }, [])

  const addPlayer = useCallback((player: Player) => {
    setGameState(prev => ({
      ...prev,
      players: [...prev.players.filter(p => p.id !== player.id), player]
    }))
  }, [])

  const removePlayer = useCallback((playerId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }))
  }, [])

  const updateScore = useCallback((playerId: string, score: number) => {
    setGameState(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [playerId]: score
      }
    }))
  }, [])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameData: {},
      status: 'waiting',
      moves: [],
      scores: {}
    }))
  }, [])

  return {
    gameState,
    error,
    updateGameState,
    addMove,
    updatePlayer,
    addPlayer,
    removePlayer,
    updateScore,
    resetGame,
    setError
  }
}