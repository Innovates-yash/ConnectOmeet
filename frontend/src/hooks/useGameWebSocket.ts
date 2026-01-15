import { useEffect, useRef, useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { GameState, GameMove } from './useGameState'

interface GameWebSocketHook {
  isConnected: boolean
  sendMove: (move: any) => void
  sendMessage: (message: any) => void
  joinGame: (sessionId: string) => void
  leaveGame: () => void
}

interface GameWebSocketCallbacks {
  onGameStateUpdate?: (gameState: Partial<GameState>) => void
  onPlayerJoined?: (player: any) => void
  onPlayerLeft?: (playerId: string) => void
  onMoveReceived?: (move: GameMove) => void
  onGameEnded?: (result: any) => void
  onError?: (error: string) => void
}

export const useGameWebSocket = (
  sessionId: string,
  callbacks: GameWebSocketCallbacks = {}
): GameWebSocketHook => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectedRef = useRef(false)
  
  const { token } = useAppSelector(state => state.auth)
  
  const {
    onGameStateUpdate,
    onPlayerJoined,
    onPlayerLeft,
    onMoveReceived,
    onGameEnded,
    onError
  } = callbacks

  const connect = useCallback(() => {
    if (!token || !sessionId) return

    try {
      const wsUrl = `ws://localhost:8080/ws/game?token=${token}&sessionId=${sessionId}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('Game WebSocket connected')
        isConnectedRef.current = true
        
        // Join the game session
        wsRef.current?.send(JSON.stringify({
          type: 'JOIN_GAME',
          sessionId
        }))
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch (message.type) {
            case 'GAME_STATE_UPDATE':
              onGameStateUpdate?.(message.gameState)
              break
              
            case 'PLAYER_JOINED':
              onPlayerJoined?.(message.player)
              break
              
            case 'PLAYER_LEFT':
              onPlayerLeft?.(message.playerId)
              break
              
            case 'MOVE_RECEIVED':
              onMoveReceived?.(message.move)
              break
              
            case 'GAME_ENDED':
              onGameEnded?.(message.result)
              break
              
            case 'ERROR':
              onError?.(message.message)
              break
              
            default:
              console.log('Unknown message type:', message.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          onError?.('Failed to parse server message')
        }
      }

      wsRef.current.onclose = () => {
        console.log('Game WebSocket disconnected')
        isConnectedRef.current = false
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current.onerror = (error) => {
        console.error('Game WebSocket error:', error)
        onError?.('WebSocket connection error')
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      onError?.('Failed to connect to game server')
    }
  }, [token, sessionId, onGameStateUpdate, onPlayerJoined, onPlayerLeft, onMoveReceived, onGameEnded, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    isConnectedRef.current = false
  }, [])

  const sendMove = useCallback((move: any) => {
    if (wsRef.current && isConnectedRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'MAKE_MOVE',
        sessionId,
        move
      }))
    }
  }, [sessionId])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && isConnectedRef.current) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const joinGame = useCallback((gameSessionId: string) => {
    if (wsRef.current && isConnectedRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'JOIN_GAME',
        sessionId: gameSessionId
      }))
    }
  }, [])

  const leaveGame = useCallback(() => {
    if (wsRef.current && isConnectedRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'LEAVE_GAME',
        sessionId
      }))
    }
  }, [sessionId])

  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  return {
    isConnected: isConnectedRef.current,
    sendMove,
    sendMessage,
    joinGame,
    leaveGame
  }
}