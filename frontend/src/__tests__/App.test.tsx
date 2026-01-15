import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import App from '../App'

// Mock the page components
vi.mock('../pages/AuthPage', () => ({
  default: () => <div data-testid="auth-page">Auth Page</div>
}))

vi.mock('../pages/ProfileSetupPage', () => ({
  default: () => <div data-testid="profile-setup-page">Profile Setup Page</div>
}))

vi.mock('../pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}))

vi.mock('../components/common/LoadingSpinner', () => ({
  default: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  )
}))

vi.mock('../components/auth/ProtectedRoute', () => ({
  default: ({ children, requireProfile }: { children: React.ReactNode, requireProfile?: boolean }) => {
    // Import React hooks for the mock
    const { useSelector } = require('react-redux')
    const { Navigate } = require('react-router-dom')
    
    const { isAuthenticated } = useSelector((state: any) => state.auth || {})
    const { profile } = useSelector((state: any) => state.profile || {})
    
    // Redirect to auth if not authenticated
    if (!isAuthenticated) {
      return React.createElement(Navigate, { to: '/auth', replace: true })
    }
    
    // Redirect to profile setup if authenticated but no profile and profile is required
    if (requireProfile && !profile) {
      return React.createElement(Navigate, { to: '/profile-setup', replace: true })
    }
    
    return children
  }
}))

vi.mock('../components/auth/SessionManager', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

const createTestStore = (initialState: any) => {
  return configureStore({
    reducer: {
      auth: (state = initialState.auth || {}) => state,
      profile: (state = initialState.profile || {}) => state,
      room: (state = initialState.room || {}) => state,
      gameCoin: (state = initialState.gameCoin || {}) => state,
      compatibility: (state = initialState.compatibility || {}) => state,
    } as any,
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })
}

const renderWithProviders = (component: React.ReactElement, initialState: any = {}) => {
  const store = createTestStore(initialState)
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('App Component', () => {
  it('should show loading spinner when auth is loading', () => {
    const initialState = {
      auth: { isAuthenticated: false, isLoading: true },
      profile: { profile: null }
    }

    renderWithProviders(<App />, initialState)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'large')
  })

  it('should show auth page when not authenticated', () => {
    const initialState = {
      auth: { isAuthenticated: false, isLoading: false },
      profile: { profile: null }
    }

    renderWithProviders(<App />, initialState)

    expect(screen.getByTestId('auth-page')).toBeInTheDocument()
  })

  it('should show profile setup page when authenticated but no profile', () => {
    const initialState = {
      auth: { isAuthenticated: true, isLoading: false },
      profile: { profile: null }
    }

    renderWithProviders(<App />, initialState)

    expect(screen.getByTestId('profile-setup-page')).toBeInTheDocument()
  })

  it('should show dashboard when authenticated and has profile', () => {
    const initialState = {
      auth: { isAuthenticated: true, isLoading: false },
      profile: { 
        profile: { 
          id: '1', 
          displayName: 'Test User',
          avatar: 'avatar1',
          interests: ['gaming'],
          gameExperience: 'INTERMEDIATE',
          createdAt: '2024-01-01'
        } 
      }
    }

    renderWithProviders(<App />, initialState)

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })

  it('should redirect authenticated user with profile away from auth page', () => {
    const initialState = {
      auth: { isAuthenticated: true, isLoading: false },
      profile: { 
        profile: { 
          id: '1', 
          displayName: 'Test User',
          avatar: 'avatar1',
          interests: ['gaming'],
          gameExperience: 'INTERMEDIATE',
          createdAt: '2024-01-01'
        } 
      }
    }

    // Render with initial route to /auth
    render(
      <Provider store={createTestStore(initialState)}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    )

    // Should redirect to dashboard instead of showing auth page
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument()
  })

  it('should redirect authenticated user without profile away from dashboard', () => {
    const initialState = {
      auth: { isAuthenticated: true, isLoading: false },
      profile: { profile: null }
    }

    // Start at root path, should redirect to profile-setup
    renderWithProviders(<App />, initialState)

    // Should show profile setup for authenticated user without profile
    expect(screen.getByTestId('profile-setup-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
  })

  it('should redirect unauthenticated user away from protected routes', () => {
    const initialState = {
      auth: { isAuthenticated: false, isLoading: false },
      profile: { profile: null }
    }

    // Start at root path, should redirect to auth
    renderWithProviders(<App />, initialState)

    // Should show auth page for unauthenticated user
    expect(screen.getByTestId('auth-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
  })
})