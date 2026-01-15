import { describe, it, expect } from 'vitest'
import { store } from '../store'
import { logout } from '../slices/authSlice'
import { clearError as clearProfileError } from '../slices/profileSlice'
import { clearError as clearRoomError } from '../slices/roomSlice'
import { clearError as clearGameCoinError } from '../slices/gameCoinSlice'
import { clearError as clearCompatibilityError } from '../slices/compatibilitySlice'

describe('Redux Store Configuration', () => {
  it('should have the correct initial state structure', () => {
    const state = store.getState()
    
    // Check that all slices are present
    expect(state).toHaveProperty('auth')
    expect(state).toHaveProperty('profile')
    expect(state).toHaveProperty('room')
    expect(state).toHaveProperty('gameCoin')
    expect(state).toHaveProperty('compatibility')
  })

  it('should have correct initial auth state', () => {
    const { auth } = store.getState()
    
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.isLoading).toBe(false)
    expect(auth.phoneNumber).toBe(null)
    expect(auth.otpSent).toBe(false)
    expect(auth.otpLoading).toBe(false)
    expect(auth.error).toBe(null)
  })

  it('should have correct initial profile state', () => {
    const { profile } = store.getState()
    
    expect(profile.profile).toBe(null)
    expect(profile.isLoading).toBe(false)
    expect(profile.error).toBe(null)
    expect(profile.searchResults).toEqual([])
    expect(profile.searchLoading).toBe(false)
  })

  it('should have correct initial room state', () => {
    const { room } = store.getState()
    
    expect(room.currentRoom).toBe(null)
    expect(room.rooms).toEqual([])
    expect(room.participants).toEqual([])
    expect(room.messages).toEqual([])
    expect(room.isLoading).toBe(false)
    expect(room.error).toBe(null)
    expect(room.isConnected).toBe(false)
  })

  it('should have correct initial gameCoin state', () => {
    const { gameCoin } = store.getState()
    
    expect(gameCoin.balance).toBe(0)
    expect(gameCoin.transactions).toEqual([])
    expect(gameCoin.isLoading).toBe(false)
    expect(gameCoin.error).toBe(null)
    expect(gameCoin.dailyBonusAvailable).toBe(true)
    expect(gameCoin.lastBonusClaimedAt).toBe(null)
  })

  it('should have correct initial compatibility state', () => {
    const { compatibility } = store.getState()
    
    expect(compatibility.matches).toEqual([])
    expect(compatibility.currentMatch).toBe(null)
    expect(compatibility.isLoading).toBe(false)
    expect(compatibility.error).toBe(null)
    expect(compatibility.leaderboard).toEqual([])
    expect(compatibility.leaderboardLoading).toBe(false)
  })

  it('should handle actions correctly', () => {
    // Test auth logout action
    store.dispatch(logout())
    const authState = store.getState().auth
    expect(authState.isAuthenticated).toBe(false)
    expect(authState.token).toBe(null)
    expect(authState.refreshToken).toBe(null)

    // Test error clearing actions
    store.dispatch(clearProfileError())
    store.dispatch(clearRoomError())
    store.dispatch(clearGameCoinError())
    store.dispatch(clearCompatibilityError())
    
    const state = store.getState()
    expect(state.profile.error).toBe(null)
    expect(state.room.error).toBe(null)
    expect(state.gameCoin.error).toBe(null)
    expect(state.compatibility.error).toBe(null)
  })

  it('should maintain state immutability', () => {
    const initialState = store.getState()
    const stateCopy = { ...initialState }
    
    // Dispatch an action
    store.dispatch(logout())
    
    // Original state reference should not be mutated
    expect(initialState).toEqual(stateCopy)
  })
})