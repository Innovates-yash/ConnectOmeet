import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center bg-black/20 backdrop-blur-sm border border-red-500/50 rounded-lg p-8 max-w-md">
            <div className="text-red-400 text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="block w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 border border-purple-500 rounded-lg transition-colors text-white font-semibold"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-colors text-white font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs text-gray-500 bg-black/30 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary