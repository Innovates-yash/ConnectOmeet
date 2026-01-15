import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { roomApi } from '../../services/api'

export interface ChatMessage {
  id: string
  content: string
  senderDisplayName: string
  timestamp: string
  messageType: 'CHAT' | 'SYSTEM'
}

export interface RoomParticipant {
  userId: string
  displayName: string
  avatar: string
  joinedAt: string
  isActive: boolean
}

export interface Room {
  id: string
  name: string
  description?: string
  createdBy: string
  createdAt: string
  isActive: boolean
  participantCount: number
  maxCapacity: number
}

export interface RoomState {
  currentRoom: Room | null
  rooms: Room[]
  participants: RoomParticipant[]
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
}

const initialState: RoomState = {
  currentRoom: null,
  rooms: [],
  participants: [],
  messages: [],
  isLoading: false,
  error: null,
  isConnected: false,
}

// Async thunks
export const fetchRooms = createAsyncThunk(
  'room/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roomApi.getRooms()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms')
    }
  }
)

export const createRoom = createAsyncThunk(
  'room/create',
  async (roomData: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      const response = await roomApi.createRoom(roomData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room')
    }
  }
)

export const joinRoom = createAsyncThunk(
  'room/join',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await roomApi.joinRoom(roomId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join room')
    }
  }
)

export const leaveRoom = createAsyncThunk(
  'room/leave',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await roomApi.leaveRoom(roomId)
      return roomId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave room')
    }
  }
)

export const fetchMessages = createAsyncThunk(
  'room/fetchMessages',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await roomApi.getMessages(roomId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages')
    }
  }
)

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<Room | null>) => {
      state.currentRoom = action.payload
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
    },
    updateParticipants: (state, action: PayloadAction<RoomParticipant[]>) => {
      state.participants = action.payload
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Rooms
      .addCase(fetchRooms.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.isLoading = false
        state.rooms = action.payload
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Create Room
      .addCase(createRoom.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.isLoading = false
        state.rooms.push(action.payload)
        state.currentRoom = action.payload
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Join Room
      .addCase(joinRoom.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentRoom = action.payload
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Leave Room
      .addCase(leaveRoom.fulfilled, (state) => {
        state.currentRoom = null
        state.participants = []
        state.messages = []
        state.isConnected = false
      })
      
      // Fetch Messages
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload
      })
  },
})

export const {
  setCurrentRoom,
  addMessage,
  updateParticipants,
  setConnected,
  clearMessages,
  clearError,
} = roomSlice.actions

export default roomSlice.reducer