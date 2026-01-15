import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock SockJS for tests
vi.mock('sockjs-client', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      close: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  }
})