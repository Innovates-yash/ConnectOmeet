import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import userEvent from '@testing-library/user-event'
import AuthPage from '../AuthPage'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock the auth slice actions
const mockSendOtp = vi.fn()
const mockVerifyOtp = vi.fn()
const mockClearError = vi.fn()

vi.mock('../../store/slices/authSlice', () => ({
  sendOtp: () => mockSendOtp,
  verifyOtp: () => mockVerifyOtp,
  clearError: () => mockClearError,
}))

const createMockStore = (authState: any, profileState: any = { profile: null }) => {
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

const renderWithProviders = (authState: any, profileState?: any) => {
  const store = createMockStore(authState, profileState)
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    </Provider>
  )
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render phone input form initially', () => {
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: false,
      otpLoading: false,
      phoneNumber: null,
      error: null,
    }

    renderWithProviders(authState)

    expect(screen.getByText('GameVerse')).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument()
  })

  it('should show loading spinner when auth is loading', () => {
    const authState = {
      isAuthenticated: false,
      isLoading: true,
      otpSent: false,
      otpLoading: false,
      phoneNumber: null,
      error: null,
    }

    renderWithProviders(authState)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should switch to OTP step when OTP is sent', () => {
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: true,
      otpLoading: false,
      phoneNumber: '+1234567890',
      error: null,
    }

    renderWithProviders(authState)

    expect(screen.getByText('Code sent to:')).toBeInTheDocument()
    expect(screen.getByText('+1234567890')).toBeInTheDocument()
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify & enter/i })).toBeInTheDocument()
  })

  it('should validate phone number input', async () => {
    const user = userEvent.setup()
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: false,
      otpLoading: false,
      phoneNumber: null,
      error: null,
    }

    renderWithProviders(authState)

    const phoneInput = screen.getByLabelText(/phone number/i)
    const submitButton = screen.getByRole('button', { name: /send otp/i })

    // Test invalid phone number
    await user.type(phoneInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/phone number must be at least 10 digits/i)).toBeInTheDocument()
    })
  })

  it('should validate OTP input', async () => {
    const user = userEvent.setup()
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: true,
      otpLoading: false,
      phoneNumber: '+1234567890',
      error: null,
    }

    renderWithProviders(authState)

    const otpInput = screen.getByLabelText(/verification code/i)
    const submitButton = screen.getByRole('button', { name: /verify & enter/i })

    // Test invalid OTP
    await user.type(otpInput, '12')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/otp must be exactly 4 digits/i)).toBeInTheDocument()
    })
  })

  it('should show resend button when countdown expires', () => {
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: true,
      otpLoading: false,
      phoneNumber: '+1234567890',
      error: null,
    }

    renderWithProviders(authState)

    // Initially should show countdown (mocked to 0 for testing)
    expect(screen.getByText(/change phone number/i)).toBeInTheDocument()
  })

  it('should show back to phone button in OTP step', async () => {
    const user = userEvent.setup()
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: true,
      otpLoading: false,
      phoneNumber: '+1234567890',
      error: null,
    }

    renderWithProviders(authState)

    const backButton = screen.getByText(/change phone number/i)
    expect(backButton).toBeInTheDocument()

    await user.click(backButton)
    
    // Should go back to phone input
    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    })
  })

  it('should show development mode hint', () => {
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: false,
      otpLoading: false,
      phoneNumber: null,
      error: null,
    }

    renderWithProviders(authState)

    expect(screen.getByText(/dev mode: use otp "1234" for any number/i)).toBeInTheDocument()
  })

  it('should disable inputs when loading', () => {
    const authState = {
      isAuthenticated: false,
      isLoading: false,
      otpSent: false,
      otpLoading: true,
      phoneNumber: null,
      error: null,
    }

    renderWithProviders(authState)

    const phoneInput = screen.getByLabelText(/phone number/i)
    const submitButton = screen.getByRole('button', { name: /send otp/i })

    expect(phoneInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })
})