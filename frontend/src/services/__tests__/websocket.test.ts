import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Client } from '@stomp/stompjs'

// Mock the store
vi.mock('../../store/store', () => ({
  store: {
    getState: vi.fn(() => ({
      auth: { token: 'mock-token' }
    })),
    dispatch: vi.fn()
  }
}))

// Mock SockJS
vi.mock('sockjs-client', () => ({
  default: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}))

// Mock STOMP Client
vi.mock('@stomp/stompjs', () => {
  const mockClient = {
    activate: vi.fn(),
    deactivate: vi.fn(),
    connected: false,
    active: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    publish: vi.fn(),
    connectHeaders: {},
    onConnect: null as any,
    onDisconnect: null as any,
    onStompError: null as any,
  }
  
  return {
    Client: vi.fn().mockImplementation(() => mockClient)
  }
})

describe('WebSocket Service', () => {
  let mockClient: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mock client instance
    const ClientConstructor = Client as any
    mockClient = new ClientConstructor()
    mockClient.connected = false
    mockClient.active = false
    mockClient.activate.mockClear()
    mockClient.deactivate.mockClear()
    mockClient.subscribe.mockClear()
    mockClient.unsubscribe.mockClear()
    mockClient.publish.mockClear()
    
    // Re-import the service to get a fresh instance
    const { webSocketService } = await import('../websocket')
    // Store reference for cleanup
    ;(globalThis as any).testWebSocketService = webSocketService
  })

  afterEach(() => {
    const webSocketService = (globalThis as any).testWebSocketService
    if (webSocketService) {
      webSocketService.disconnect()
    }
  })

  it('should initialize WebSocket service', async () => {
    const { webSocketService } = await import('../websocket')
    
    expect(webSocketService).toBeDefined()
    expect(typeof webSocketService.connect).toBe('function')
    expect(typeof webSocketService.disconnect).toBe('function')
    expect(typeof webSocketService.joinRoom).toBe('function')
    expect(typeof webSocketService.leaveRoom).toBe('function')
    expect(typeof webSocketService.sendMessage).toBe('function')
  })

  it('should connect to WebSocket', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = true
    
    // Simulate successful connection
    const connectPromise = webSocketService.connect()
    
    // Trigger the onConnect callback
    if (mockClient.onConnect) {
      mockClient.onConnect()
    }
    
    await expect(connectPromise).resolves.toBeUndefined()
    expect(mockClient.activate).toHaveBeenCalled()
  })

  it('should handle connection errors', async () => {
    const { webSocketService } = await import('../websocket')
    const errorFrame = { headers: { message: 'Connection failed' } }
    
    // Simulate connection error
    const connectPromise = webSocketService.connect()
    
    // Trigger the onStompError callback
    if (mockClient.onStompError) {
      mockClient.onStompError(errorFrame)
    }
    
    await expect(connectPromise).rejects.toThrow('WebSocket connection failed: Connection failed')
  })

  it('should disconnect from WebSocket', async () => {
    const { webSocketService } = await import('../websocket')
    
    // First connect to set up the client
    mockClient.connected = true
    mockClient.active = true
    const connectPromise = webSocketService.connect()
    if (mockClient.onConnect) {
      mockClient.onConnect()
    }
    await connectPromise
    
    // Now disconnect
    webSocketService.disconnect()
    
    expect(mockClient.deactivate).toHaveBeenCalled()
  })

  it('should join a room when connected', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = true
    const roomId = 'test-room-123'
    
    webSocketService.joinRoom(roomId)
    
    expect(mockClient.subscribe).toHaveBeenCalledWith(
      `/topic/room/${roomId}/messages`,
      expect.any(Function)
    )
    expect(mockClient.subscribe).toHaveBeenCalledWith(
      `/topic/room/${roomId}/participants`,
      expect.any(Function)
    )
    expect(mockClient.publish).toHaveBeenCalledWith({
      destination: `/app/room/${roomId}/join`,
      body: JSON.stringify({})
    })
  })

  it('should not join room when not connected', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = false
    const roomId = 'test-room-123'
    
    webSocketService.joinRoom(roomId)
    
    expect(mockClient.subscribe).not.toHaveBeenCalled()
    expect(mockClient.publish).not.toHaveBeenCalled()
  })

  it('should leave a room', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = true
    const roomId = 'test-room-123'
    
    // First join the room
    webSocketService.joinRoom(roomId)
    
    // Then leave the room
    webSocketService.leaveRoom()
    
    expect(mockClient.publish).toHaveBeenCalledWith({
      destination: `/app/room/${roomId}/leave`,
      body: JSON.stringify({})
    })
    expect(mockClient.unsubscribe).toHaveBeenCalledWith(`/topic/room/${roomId}/messages`)
    expect(mockClient.unsubscribe).toHaveBeenCalledWith(`/topic/room/${roomId}/participants`)
  })

  it('should send messages when connected and in a room', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = true
    const roomId = 'test-room-123'
    const message = 'Hello, world!'
    
    // Join room first
    webSocketService.joinRoom(roomId)
    
    // Send message
    webSocketService.sendMessage(message)
    
    expect(mockClient.publish).toHaveBeenCalledWith({
      destination: `/app/room/${roomId}/send`,
      body: JSON.stringify({ content: message })
    })
  })

  it('should not send messages when not connected', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = false
    const message = 'Hello, world!'
    
    webSocketService.sendMessage(message)
    
    expect(mockClient.publish).not.toHaveBeenCalled()
  })

  it('should send heartbeat when connected and in a room', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = true
    const roomId = 'test-room-123'
    
    // Join room first
    webSocketService.joinRoom(roomId)
    
    // Send heartbeat
    webSocketService.sendHeartbeat()
    
    expect(mockClient.publish).toHaveBeenCalledWith({
      destination: `/app/room/${roomId}/heartbeat`,
      body: JSON.stringify({})
    })
  })

  it('should return connection status', async () => {
    const { webSocketService } = await import('../websocket')
    mockClient.connected = false
    expect(webSocketService.isConnected()).toBe(false)
    
    mockClient.connected = true
    expect(webSocketService.isConnected()).toBe(true)
  })

  it('should return current room ID', async () => {
    const { webSocketService } = await import('../websocket')
    expect(webSocketService.getCurrentRoomId()).toBe(null)
    
    mockClient.connected = true
    const roomId = 'test-room-123'
    webSocketService.joinRoom(roomId)
    
    expect(webSocketService.getCurrentRoomId()).toBe(roomId)
  })
})