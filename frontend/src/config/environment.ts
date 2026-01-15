// Environment configuration
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws',
  
  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  
  // Game Configuration
  DEFAULT_GAME_TIMEOUT: 300000, // 5 minutes
  RECONNECTION_ATTEMPTS: 3,
  RECONNECTION_DELAY: 1000,
  
  // UI Configuration
  TOAST_DURATION: 4000,
  LOADING_TIMEOUT: 30000,
  
  // Development
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  
  // Logging
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || (import.meta.env.DEV ? 'debug' : 'error')
}

// Validate required environment variables
const requiredEnvVars: string[] = []

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    console.warn(`Missing required environment variable: ${envVar}`)
  }
}

export default config