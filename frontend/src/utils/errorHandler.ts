import { logger } from './logger'
import { toast } from 'react-hot-toast'

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export class GameVerseError extends Error {
  public code: string
  public details?: any
  public timestamp: Date

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'GameVerseError'
    this.code = code
    this.details = details
    this.timestamp = new Date()
  }
}

export const ErrorCodes = {
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Authentication Errors
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Game Errors
  GAME_SESSION_NOT_FOUND: 'GAME_SESSION_NOT_FOUND',
  GAME_FULL: 'GAME_FULL',
  INVALID_MOVE: 'INVALID_MOVE',
  GAME_ENDED: 'GAME_ENDED',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Generic Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export class ErrorHandler {
  static handle(error: unknown, context?: string): void {
    let appError: AppError

    if (error instanceof GameVerseError) {
      appError = {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp
      }
    } else if (error instanceof Error) {
      appError = {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: error.message,
        details: { stack: error.stack },
        timestamp: new Date()
      }
    } else {
      appError = {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
        details: error,
        timestamp: new Date()
      }
    }

    // Log the error
    logger.error(`Error in ${context || 'unknown context'}`, appError)

    // Show user-friendly message
    this.showUserMessage(appError)
  }

  private static showUserMessage(error: AppError): void {
    const userMessage = this.getUserFriendlyMessage(error.code)
    
    if (this.isCriticalError(error.code)) {
      toast.error(userMessage, { duration: 6000 })
    } else {
      toast.error(userMessage)
    }
  }

  private static getUserFriendlyMessage(code: string): string {
    switch (code) {
      case ErrorCodes.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection.'
      case ErrorCodes.CONNECTION_TIMEOUT:
        return 'Connection timed out. Please try again.'
      case ErrorCodes.SERVER_ERROR:
        return 'Server error occurred. Please try again later.'
      case ErrorCodes.AUTH_FAILED:
        return 'Authentication failed. Please log in again.'
      case ErrorCodes.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.'
      case ErrorCodes.UNAUTHORIZED:
        return 'You are not authorized to perform this action.'
      case ErrorCodes.GAME_SESSION_NOT_FOUND:
        return 'Game session not found or has expired.'
      case ErrorCodes.GAME_FULL:
        return 'This game is full. Please try another game.'
      case ErrorCodes.INVALID_MOVE:
        return 'Invalid move. Please try again.'
      case ErrorCodes.GAME_ENDED:
        return 'This game has already ended.'
      case ErrorCodes.VALIDATION_ERROR:
        return 'Please check your input and try again.'
      case ErrorCodes.INVALID_INPUT:
        return 'Invalid input provided.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  private static isCriticalError(code: string): boolean {
    return [
      ErrorCodes.SERVER_ERROR,
      ErrorCodes.AUTH_FAILED,
      ErrorCodes.TOKEN_EXPIRED
    ].includes(code as any)
  }

  static createNetworkError(message: string, details?: any): GameVerseError {
    return new GameVerseError(ErrorCodes.NETWORK_ERROR, message, details)
  }

  static createAuthError(message: string, details?: any): GameVerseError {
    return new GameVerseError(ErrorCodes.AUTH_FAILED, message, details)
  }

  static createGameError(code: string, message: string, details?: any): GameVerseError {
    return new GameVerseError(code, message, details)
  }
}

export default ErrorHandler