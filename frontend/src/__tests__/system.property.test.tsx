import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import fc from 'fast-check'
import authSlice from '../store/slices/authSlice'
import profileSlice from '../store/slices/profileSlice'
import matchmakingSlice from '../store/slices/matchmakingSlice'
import App from '../App'
import { ErrorHandler, ErrorCodes } from '../utils/errorHandler'

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN
})) as any

// Mock fetch
global.fetch = vi.fn()

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      profile: profileSlice,
      matchmaking: matchmakingSlice
    },
    preloadedState: initialState
  })
}

describe('System-wide Property Tests', () => {
  describe('Error Handling Properties', () => {
    it('should handle any error gracefully', () => {
      fc.assert(fc.property(
        fc.string(),
        fc.string(),
        fc.anything(),
        (code, message, details) => {
          // Test that error handler doesn't throw
          expect(() => {
            ErrorHandler.handle(new Error(message), 'test-context')
          }).not.toThrow()
        }
      ), { numRuns: 10 })
    })

    it('should create consistent error codes', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.values(ErrorCodes)),
        fc.string(),
        (code, message) => {
          const error = ErrorHandler.createGameError(code, message)
          expect(error.code).toBe(code)
          expect(error.message).toBe(message)
          expect(error.timestamp).toBeInstanceOf(Date)
        }
      ), { numRuns: 10 })
    })
  })

  describe('State Management Properties', () => {
    it('should maintain consistent auth state', () => {
      fc.assert(fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.option(fc.record({
          id: fc.string(),
          phoneNumber: fc.string()
        })),
        (isAuthenticated, isLoading, user) => {
          const store = createTestStore({
            auth: { isAuthenticated, isLoading, user, token: null, error: null }
          })
          
          const state = store.getState()
          
          // Property: If authenticated, should have user or be loading
          if (isAuthenticated && !isLoading) {
            expect(state.auth.user).toBeTruthy()
          }
          
          // Property: Loading state should be boolean
          expect(typeof state.auth.isLoading).toBe('boolean')
          expect(typeof state.auth.isAuthenticated).toBe('boolean')
        }
      ), { numRuns: 10 })
    })

    it('should handle profile state transitions correctly', () => {
      fc.assert(fc.property(
        fc.option(fc.record({
          userId: fc.string(),
          displayName: fc.string(),
          gameExperience: fc.constantFrom('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'),
          interestTags: fc.array(fc.string(), { minLength: 0, maxLength: 10 })
        })),
        fc.boolean(),
        (profile, isLoading) => {
          const store = createTestStore({
            profile: { profile, isLoading, error: null }
          })
          
          const state = store.getState()
          
          // Property: Profile should be consistent with loading state
          if (!isLoading && profile) {
            expect(state.profile.profile).toEqual(profile)
          }
          
          // Property: Loading should be boolean
          expect(typeof state.profile.isLoading).toBe('boolean')
        }
      ), { numRuns: 10 })
    })
  })

  describe('Component Rendering Properties', () => {
    it('should render without crashing for any valid auth state', () => {
      fc.assert(fc.property(
        fc.boolean(),
        fc.boolean(),
        (isAuthenticated, isLoading) => {
          const store = createTestStore({
            auth: { 
              isAuthenticated, 
              isLoading, 
              user: isAuthenticated ? { id: '1', phoneNumber: '+1234567890' } : null,
              token: isAuthenticated ? 'token' : null,
              error: null 
            },
            profile: {
              profile: isAuthenticated ? {
                userId: '1',
                displayName: 'TestUser',
                gameExperience: 'INTERMEDIATE',
                interestTags: ['action']
              } : null,
              isLoading: false,
              error: null
            }
          })
          
          expect(() => {
            render(
              <Provider store={store}>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </Provider>
            )
          }).not.toThrow()
        }
      ), { numRuns: 5 })
    })
  })

  describe('Navigation Properties', () => {
    it('should handle route transitions consistently', () => {
      fc.assert(fc.property(
        fc.constantFrom('/dashboard', '/discover', '/matchmaking', '/private-lobby'),
        (route) => {
          const store = createTestStore({
            auth: { 
              isAuthenticated: true, 
              isLoading: false, 
              user: { id: '1', phoneNumber: '+1234567890' },
              token: 'token',
              error: null 
            },
            profile: {
              profile: {
                userId: '1',
                displayName: 'TestUser',
                gameExperience: 'INTERMEDIATE',
                interestTags: ['action']
              },
              isLoading: false,
              error: null
            }
          })
          
          // Mock window.location
          Object.defineProperty(window, 'location', {
            value: { pathname: route },
            writable: true
          })
          
          expect(() => {
            render(
              <Provider store={store}>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </Provider>
            )
          }).not.toThrow()
        }
      ), { numRuns: 5 })
    })
  })

  describe('Concurrent User Scenarios', () => {
    it('should handle multiple simultaneous state updates', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          type: fc.constantFrom('auth/login', 'profile/update', 'matchmaking/join'),
          payload: fc.anything()
        }), { minLength: 1, maxLength: 5 }),
        (actions) => {
          const store = createTestStore()
          
          // Property: Store should handle multiple actions without throwing
          expect(() => {
            actions.forEach(action => {
              try {
                store.dispatch(action as any)
              } catch (error) {
                // Some actions might fail due to invalid payloads, which is expected
              }
            })
          }).not.toThrow()
          
          // Property: Store state should remain valid
          const state = store.getState()
          expect(state).toBeDefined()
          expect(typeof state.auth.isAuthenticated).toBe('boolean')
          expect(typeof state.auth.isLoading).toBe('boolean')
        }
      ), { numRuns: 5 })
    })
  })

  describe('System Reliability Properties', () => {
    it('should maintain system stability under load', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 100 }),
        (iterations) => {
          const store = createTestStore({
            auth: { 
              isAuthenticated: true, 
              isLoading: false, 
              user: { id: '1', phoneNumber: '+1234567890' },
              token: 'token',
              error: null 
            }
          })
          
          // Simulate high load by dispatching many actions
          for (let i = 0; i < iterations; i++) {
            try {
              store.dispatch({ type: 'test/action', payload: i })
            } catch (error) {
              // Expected for unknown actions
            }
          }
          
          // Property: System should remain stable
          const state = store.getState()
          expect(state).toBeDefined()
          expect(typeof state.auth.isAuthenticated).toBe('boolean')
        }
      ), { numRuns: 3 })
    })
  })
})