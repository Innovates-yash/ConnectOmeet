import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Client } from '@stomp/stompjs'
import { AppDispatch } from '../store/store'
import {
  setMatchFound,
  updateQueuePosition,
  updateEstimatedWaitTime,
  setAlternativeGames
} from '../store/slices/matchmakingSlice'

export const useMatchmakingWebSocket = (userId: string | null) => {
  const dispatch = useDispatch<AppDispatch>()
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!userId) return

    // Create WebSocket client
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      debug: (str) => {
        console.log('WebSocket Debug:', str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.onConnect = () => {
      console.log('Matchmaking WebSocket connected')

      // Subscribe to matchmaking status updates
      client.subscribe(`/queue/matchmaking/user/${userId}/status`, (message) => {
        try {
          const status = JSON.parse(message.body)
          dispatch(updateQueuePosition(status.queuePosition))
          dispatch(updateEstimatedWaitTime(status.estimatedWaitTime))
        } catch (error) {
          console.error('Error parsing status update:', error)
        }
      })

      // Subscribe to match found notifications
      client.subscribe(`/queue/matchmaking/user/${userId}/match-found`, (message) => {
        try {
          const matchResult = JSON.parse(message.body)
          dispatch(setMatchFound({
            sessionId: matchResult.sessionId,
            opponents: matchResult.players.filter((p: any) => p.id !== userId),
            gameType: matchResult.gameType
          }))
        } catch (error) {
          console.error('Error parsing match found:', error)
        }
      })

      // Subscribe to timeout notifications
      client.subscribe(`/queue/matchmaking/user/${userId}/timeout`, (message) => {
        try {
          const timeoutData = JSON.parse(message.body)
          dispatch(setAlternativeGames(timeoutData.alternatives || []))
        } catch (error) {
          console.error('Error parsing timeout notification:', error)
        }
      })

      // Subscribe to general matchmaking updates
      client.subscribe('/topic/matchmaking/updates', (message) => {
        try {
          const update = JSON.parse(message.body)
          // Handle general matchmaking updates (queue sizes, popular games, etc.)
          if (update.type === 'queue_update') {
            // Update queue information
          } else if (update.type === 'popular_games') {
            dispatch(setAlternativeGames(update.games))
          }
        } catch (error) {
          console.error('Error parsing matchmaking update:', error)
        }
      })
    }

    client.onStompError = (frame) => {
      console.error('WebSocket STOMP error:', frame.headers['message'])
      console.error('Additional details:', frame.body)
    }

    client.onWebSocketError = (error) => {
      console.error('WebSocket connection error:', error)
    }

    client.onDisconnect = () => {
      console.log('Matchmaking WebSocket disconnected')
    }

    // Activate the client
    client.activate()
    clientRef.current = client

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
        clientRef.current = null
      }
    }
  }, [userId, dispatch])

  // Function to send matchmaking messages
  const sendMatchmakingMessage = (destination: string, body: any) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body)
      })
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  return {
    sendMatchmakingMessage,
    isConnected: clientRef.current?.connected || false
  }
}