import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { store } from '../store/store'
import { addMessage, updateParticipants, setConnected } from '../store/slices/roomSlice'
import { ChatMessage, RoomParticipant } from '../store/slices/roomSlice'

class WebSocketService {
  private client: Client | null = null
  private currentRoomId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {},
      debug: (str) => {
        if (import.meta.env.MODE === 'development') {
          console.log('WebSocket Debug:', str)
        }
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    this.client.onConnect = this.onConnect.bind(this)
    this.client.onDisconnect = this.onDisconnect.bind(this)
    this.client.onStompError = this.onError.bind(this)
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('WebSocket client not initialized'))
        return
      }

      // Add auth token to headers
      const token = store.getState().auth.token
      if (token) {
        this.client.connectHeaders = {
          Authorization: `Bearer ${token}`,
        }
      }

      this.client.onConnect = () => {
        this.onConnect()
        resolve()
      }

      this.client.onStompError = (frame) => {
        this.onError(frame)
        reject(new Error(`WebSocket connection failed: ${frame.headers.message}`))
      }

      this.client.activate()
    })
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate()
    }
    this.currentRoomId = null
    store.dispatch(setConnected(false))
  }

  private onConnect(): void {
    console.log('WebSocket connected')
    this.reconnectAttempts = 0
    store.dispatch(setConnected(true))
  }

  private onDisconnect(): void {
    console.log('WebSocket disconnected')
    store.dispatch(setConnected(false))
    
    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect().catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private onError(frame: any): void {
    console.error('WebSocket error:', frame)
    store.dispatch(setConnected(false))
  }

  joinRoom(roomId: string): void {
    if (!this.client?.connected) {
      console.error('WebSocket not connected')
      return
    }

    // Leave current room if any
    if (this.currentRoomId) {
      this.leaveRoom()
    }

    this.currentRoomId = roomId

    // Subscribe to room messages
    this.client.subscribe(`/topic/room/${roomId}/messages`, (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body)
        store.dispatch(addMessage(chatMessage))
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })

    // Subscribe to participant updates
    this.client.subscribe(`/topic/room/${roomId}/participants`, (message: IMessage) => {
      try {
        const participants: RoomParticipant[] = JSON.parse(message.body)
        store.dispatch(updateParticipants(participants))
      } catch (error) {
        console.error('Error parsing participants:', error)
      }
    })

    // Send join message
    this.client.publish({
      destination: `/app/room/${roomId}/join`,
      body: JSON.stringify({}),
    })

    console.log(`Joined room: ${roomId}`)
  }

  leaveRoom(): void {
    if (!this.client?.connected || !this.currentRoomId) {
      return
    }

    // Send leave message
    this.client.publish({
      destination: `/app/room/${this.currentRoomId}/leave`,
      body: JSON.stringify({}),
    })

    // Unsubscribe from room topics
    this.client.unsubscribe(`/topic/room/${this.currentRoomId}/messages`)
    this.client.unsubscribe(`/topic/room/${this.currentRoomId}/participants`)

    console.log(`Left room: ${this.currentRoomId}`)
    this.currentRoomId = null
  }

  sendMessage(content: string): void {
    if (!this.client?.connected || !this.currentRoomId) {
      console.error('Cannot send message: WebSocket not connected or no room joined')
      return
    }

    this.client.publish({
      destination: `/app/room/${this.currentRoomId}/send`,
      body: JSON.stringify({ content }),
    })
  }

  sendHeartbeat(): void {
    if (!this.client?.connected || !this.currentRoomId) {
      return
    }

    this.client.publish({
      destination: `/app/room/${this.currentRoomId}/heartbeat`,
      body: JSON.stringify({}),
    })
  }

  isConnected(): boolean {
    return this.client?.connected || false
  }

  getCurrentRoomId(): string | null {
    return this.currentRoomId
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService()
export default webSocketService