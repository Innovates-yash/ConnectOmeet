import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ProtectedRoute from '../ProtectedRoute'

// Mock the store slices
const createMockStore = (authState: any, profileState: any) => {
  return configureStore({
    reducer: {
      auth: () => authState,
      profile: () => profileState,
      room: () => ({}),
      gameCoin: () => ({}),
      compatibility: () => ({}),
    } as any,
  })
}

const renderWithProviders = (
  component: React.ReactElement,
  authState: any,
  profileState: any = { profile: null }
) => {
  const store = createMockStore(authState, profileState)
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('ProtectedRoute', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

  it('should show loading spinner when auth is loading', () => {
    const authState = { isAuthenticated: false, isLoading: true }
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      authState
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should render children when authenticated', () => {
    const authState = { isAuthenticated: true, isLoading: false }
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      authState
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should render children when authenticated and profile not required', () => {
    const authState = { isAuthenticated: true, isLoading: false }
    const profileState = { profile: null }
    
    renderWithProviders(
      <ProtectedRoute requireProfile={false}>
        <TestComponent />
      </ProtectedRoute>,
      authState,
      profileState
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should render children when authenticated and has profile', () => {
    const authState = { isAuthenticated: true, isLoading: false }
    const profileState = { 
      profile: { 
        id: '1', 
        displayName: 'Test User',
        avatar: 'avatar1',
        interests: ['gaming'],
        gameExperience: 'INTERMEDIATE',
        createdAt: '2024-01-01'
      } 
    }
    
    renderWithProviders(
      <ProtectedRoute requireProfile={true}>
        <TestComponent />
      </ProtectedRoute>,
      authState,
      profileState
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
})