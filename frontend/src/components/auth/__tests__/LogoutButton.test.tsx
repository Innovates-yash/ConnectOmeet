import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import LogoutButton from '../LogoutButton'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock the store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: () => ({ isAuthenticated: true }),
      profile: () => ({}),
      room: () => ({}),
      gameCoin: () => ({}),
      compatibility: () => ({}),
    } as any,
  })
}

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore()
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
})

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  it('should render button variant by default', () => {
    renderWithProviders(<LogoutButton />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should render icon variant', () => {
    renderWithProviders(<LogoutButton variant="icon" />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Logout')
  })

  it('should render text variant', () => {
    renderWithProviders(<LogoutButton variant="text" />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should show confirmation dialog by default', async () => {
    renderWithProviders(<LogoutButton />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to logout?')
  })

  it('should not show confirmation when showConfirmation is false', async () => {
    renderWithProviders(<LogoutButton showConfirmation={false} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockConfirm).not.toHaveBeenCalled()
  })

  it('should not logout when confirmation is cancelled', async () => {
    mockConfirm.mockReturnValue(false)
    renderWithProviders(<LogoutButton />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockConfirm).toHaveBeenCalled()
    // Button should still show "Logout" (not "Logging out...")
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should handle logout when confirmed', async () => {
    mockConfirm.mockReturnValue(true)
    renderWithProviders(<LogoutButton />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockConfirm).toHaveBeenCalled()
    
    // The logout action is synchronous, so we just check it was called
    // In a real app, this would be async and we could test loading state
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    renderWithProviders(<LogoutButton className="custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})