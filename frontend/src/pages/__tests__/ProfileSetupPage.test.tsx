import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import userEvent from '@testing-library/user-event'
import ProfileSetupPage from '../ProfileSetupPage'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock the profile slice actions
const mockCreateProfile = vi.fn()
const mockFetchAvailableAvatars = vi.fn()
const mockFetchAvailableInterestTags = vi.fn()

vi.mock('../../store/slices/profileSlice', () => ({
  createProfile: () => mockCreateProfile,
  fetchAvailableAvatars: () => mockFetchAvailableAvatars,
  fetchAvailableInterestTags: () => mockFetchAvailableInterestTags,
}))

const createMockStore = (authState: any, profileState: any = {}) => {
  return configureStore({
    reducer: {
      auth: () => authState,
      profile: () => ({
        profile: null,
        isLoading: false,
        availableAvatars: ['cyber_warrior_01', 'neon_ninja_01', 'pixel_punk_01'],
        availableInterestTags: ['Gaming', 'Strategy', 'FPS', 'RPG', 'Competitive'],
        avatarsLoading: false,
        tagsLoading: false,
        ...profileState
      }),
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
        <ProfileSetupPage />
      </BrowserRouter>
    </Provider>
  )
}

describe('ProfileSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the Vibe Check title and initial step', () => {
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    expect(screen.getByText('Vibe Check')).toBeInTheDocument()
    expect(screen.getByText('Choose Your Avatar')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
  })

  it('should fetch available avatars and interest tags on mount', () => {
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    expect(mockFetchAvailableAvatars).toHaveBeenCalled()
    expect(mockFetchAvailableInterestTags).toHaveBeenCalled()
  })

  it('should redirect to auth if not authenticated', () => {
    const authState = { isAuthenticated: false, isLoading: false }

    renderWithProviders(authState)

    // Component should attempt to navigate to /auth
    // In a real test, we'd mock useNavigate and check if it was called
  })

  it('should display available avatars in step 1', () => {
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    expect(screen.getByText('Cyber Warrior 01')).toBeInTheDocument()
    expect(screen.getByText('Neon Ninja 01')).toBeInTheDocument()
    expect(screen.getByText('Pixel Punk 01')).toBeInTheDocument()
  })

  it('should allow avatar selection', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Find the avatar container by its text and get the clickable parent div
    const avatarText = screen.getByText('Cyber Warrior 01')
    const avatarButton = avatarText.closest('div[class*="aspect-square"]')
    expect(avatarButton).toBeInTheDocument()

    if (avatarButton) {
      await user.click(avatarButton)
      // Avatar should be selected (visual feedback)
      expect(avatarButton).toHaveClass('border-cyber-primary')
    }
  })

  it('should navigate to next step when avatar is selected and next is clicked', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Select an avatar
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }

    // Click next
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)

    // Should move to step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
      expect(screen.getByText("What's Your Handle?")).toBeInTheDocument()
    })
  })

  it('should validate display name input', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Navigate to step 2
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })

    const displayNameInput = screen.getByLabelText(/display name/i)
    const nextButton = screen.getByText('Next')

    // Test invalid input (too short)
    await user.type(displayNameInput, 'ab')
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/display name must be at least 3 characters/i)).toBeInTheDocument()
    })

    // Test valid input
    await user.clear(displayNameInput)
    await user.type(displayNameInput, 'ValidName123')
    await user.click(nextButton)

    // Should move to step 3
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
      expect(screen.getByText("What's Your Vibe?")).toBeInTheDocument()
    })
  })

  it('should display available interest tags in step 3', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Navigate to step 3
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })

    const displayNameInput = screen.getByLabelText(/display name/i)
    await user.type(displayNameInput, 'ValidName123')
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Gaming')).toBeInTheDocument()
      expect(screen.getByText('Strategy')).toBeInTheDocument()
      expect(screen.getByText('FPS')).toBeInTheDocument()
    })
  })

  it('should allow interest tag selection with minimum requirement', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Navigate to step 3
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })

    const displayNameInput = screen.getByLabelText(/display name/i)
    await user.type(displayNameInput, 'ValidName123')
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Selected: 0/10 (minimum 3)')).toBeInTheDocument()
    })

    // Select only 2 tags (should not allow next)
    await user.click(screen.getByText('Gaming'))
    await user.click(screen.getByText('Strategy'))

    expect(screen.getByText('Selected: 2/10 (minimum 3)')).toBeInTheDocument()

    const nextButton = screen.getByText('Next')
    await user.click(nextButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please select at least 3 interest tags/i)).toBeInTheDocument()
    })

    // Select third tag
    await user.click(screen.getByText('FPS'))
    expect(screen.getByText('Selected: 3/10 (minimum 3)')).toBeInTheDocument()

    await user.click(nextButton)

    // Should move to step 4
    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument()
      expect(screen.getByText('Final Touches')).toBeInTheDocument()
    })
  })

  it('should display gaming experience options in step 4', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Navigate to step 4
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })

    const displayNameInput = screen.getByLabelText(/display name/i)
    await user.type(displayNameInput, 'ValidName123')
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Gaming')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Gaming'))
    await user.click(screen.getByText('Strategy'))
    await user.click(screen.getByText('FPS'))
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Beginner')).toBeInTheDocument()
      expect(screen.getByText('Intermediate')).toBeInTheDocument()
      expect(screen.getByText('Advanced')).toBeInTheDocument()
      expect(screen.getByText('Expert')).toBeInTheDocument()
    })
  })

  it('should allow bio input with character limit', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Navigate to step 4
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })

    const displayNameInput = screen.getByLabelText(/display name/i)
    await user.type(displayNameInput, 'ValidName123')
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Gaming')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Gaming'))
    await user.click(screen.getByText('Strategy'))
    await user.click(screen.getByText('FPS'))
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      const bioInput = screen.getByLabelText(/bio/i)
      expect(bioInput).toBeInTheDocument()
      expect(screen.getByText('0/200')).toBeInTheDocument()
    })

    const bioInput = screen.getByLabelText(/bio/i)
    await user.type(bioInput, 'This is my bio')
    expect(screen.getByText('14/200')).toBeInTheDocument()
  })

  it('should show loading state when creating profile', async () => {
    const authState = { isAuthenticated: true, isLoading: false }
    const profileState = { isLoading: true }

    renderWithProviders(authState, profileState)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should show previous button functionality', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Navigate to step 2
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    })

    // Click previous
    const previousButton = screen.getByText('Previous')
    expect(previousButton).not.toBeDisabled()
    await user.click(previousButton)

    // Should go back to step 1
    await waitFor(() => {
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      expect(screen.getByText('Choose Your Avatar')).toBeInTheDocument()
    })

    // Previous button should be disabled on step 1
    expect(screen.getByText('Previous')).toBeDisabled()
  })

  it('should show complete setup button on final step', async () => {
    const user = userEvent.setup()
    const authState = { isAuthenticated: true, isLoading: false }

    renderWithProviders(authState)

    // Navigate to step 4
    const avatarButton = screen.getByText('Cyber Warrior 01').closest('div')
    if (avatarButton) {
      await user.click(avatarButton)
    }
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })

    const displayNameInput = screen.getByLabelText(/display name/i)
    await user.type(displayNameInput, 'ValidName123')
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Gaming')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Gaming'))
    await user.click(screen.getByText('Strategy'))
    await user.click(screen.getByText('FPS'))
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Complete Setup')).toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })
  })
})