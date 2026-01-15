import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { RootState } from './store/store'
import TestPage from './pages/TestPage'
import SimpleLandingPage from './pages/SimpleLandingPage'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import DashboardPage from './pages/DashboardPage'
import DiscoverPage from './pages/DiscoverPage'
import PrivateLobbyPage from './pages/PrivateLobbyPage'
import MatchmakingPage from './pages/MatchmakingPage'
import GameEngine from './components/GameEngine'
import ProtectedRoute from './components/auth/ProtectedRoute'
import SessionManager from './components/auth/SessionManager'
import LoadingSpinner from './components/common/LoadingSpinner'
import DebugInfo from './components/DebugInfo'

function App(): JSX.Element {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const { profile } = useSelector((state: RootState) => state.profile)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <SessionManager>
      <div className="min-h-screen bg-cyber-dark">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SimpleLandingPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/landing" element={<LandingPage />} />
          
          <Route 
            path="/auth" 
            element={
              !isAuthenticated ? (
                <AuthPage />
              ) : (
                <Navigate to={profile ? "/dashboard" : "/profile-setup"} replace />
              )
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/profile-setup" 
            element={
              <ProtectedRoute>
                {!profile ? (
                  <ProfileSetupPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireProfile>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/discover" 
            element={
              <ProtectedRoute requireProfile>
                <DiscoverPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/private-lobby" 
            element={
              <ProtectedRoute requireProfile>
                <PrivateLobbyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/matchmaking" 
            element={
              <ProtectedRoute requireProfile>
                <MatchmakingPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/game/:gameType/:sessionId" 
            element={
              <ProtectedRoute requireProfile>
                <GameEngine />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DebugInfo />
      </div>
    </SessionManager>
  )
}

export default App