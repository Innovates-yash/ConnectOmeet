import config from '../config/environment'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel

  constructor() {
    this.level = this.getLogLevel(config.LOG_LEVEL)
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG
      case 'info': return LogLevel.INFO
      case 'warn': return LogLevel.WARN
      case 'error': return LogLevel.ERROR
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`
    return data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, data))
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, error))
      
      // In production, you might want to send errors to a monitoring service
      if (config.IS_PRODUCTION && config.ENABLE_ERROR_REPORTING) {
        this.reportError(message, error)
      }
    }
  }

  private reportError(message: string, error?: any): void {
    // Placeholder for error reporting service integration
    // e.g., Sentry, LogRocket, etc.
    console.log('Would report error to monitoring service:', { message, error })
  }
}

export const logger = new Logger()
export default logger