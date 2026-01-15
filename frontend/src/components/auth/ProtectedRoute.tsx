import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import LoadingSpinner from '../common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireProfile?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireProfile = false 
}) => {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const { profile } = useSelector((state: RootState) => state.profile)

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // Redirect to profile setup if authenticated but no profile and profile is required
  if (requireProfile && !profile) {
    return <Navigate to="/profile-setup" replace />
  }

  // Render children if all checks pass
  return <>{children}</>
}

export default ProtectedRoute