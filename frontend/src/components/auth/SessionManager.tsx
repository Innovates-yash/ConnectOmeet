import React, { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { RootState, AppDispatch } from '../../store/store'
import { logout, refreshAuthToken, setLoading } from '../../store/slices/authSlice'
import { fetchProfile } from '../../store/slices/profileSlice'

const SessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isAuthenticated, token, refreshToken } = useSelector((state: RootState) => state.auth)
  const { profile } = useSelector((state: RootState) => state.profile)

  // Handle session initialization
  const initializeSession = useCallback(async () => {
    if (!isAuthenticated || !token) return

    try {
      dispatch(setLoading(true))
      
      // Fetch user profile if authenticated but no profile loaded
      if (!profile) {
        await dispatch(fetchProfile()).unwrap()
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
      // Don't logout on profile fetch failure - user might not have a profile yet
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch, isAuthenticated, token, profile])

  // Handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    if (!refreshToken) {
      dispatch(logout())
      navigate('/auth')
      return
    }

    try {
      await dispatch(refreshAuthToken()).unwrap()
    } catch (error) {
      console.error('Token refresh failed:', error)
      dispatch(logout())
      navigate('/auth')
      toast.error('Session expired. Please login again.')
    }
  }, [dispatch, refreshToken, navigate])

  // Initialize session on mount
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  // Set up token refresh interval (refresh 5 minutes before expiry)
  useEffect(() => {
    if (!isAuthenticated || !token) return

    // JWT tokens typically expire in 24 hours, refresh every 23 hours
    const refreshInterval = setInterval(() => {
      handleTokenRefresh()
    }, 23 * 60 * 60 * 1000) // 23 hours

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, token, handleTokenRefresh])

  // Handle browser tab visibility change (refresh token when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Check if token needs refresh (simple check - in production you'd decode JWT)
        const lastRefresh = localStorage.getItem('lastTokenRefresh')
        const now = Date.now()
        const oneHour = 60 * 60 * 1000

        if (!lastRefresh || now - parseInt(lastRefresh) > oneHour) {
          handleTokenRefresh()
          localStorage.setItem('lastTokenRefresh', now.toString())
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated, handleTokenRefresh])

  // Handle storage events (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue && isAuthenticated) {
        // Token was removed in another tab, logout this tab too
        dispatch(logout())
        navigate('/auth')
        toast('Logged out from another tab', { icon: 'ℹ️' })
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [dispatch, navigate, isAuthenticated])

  return <>{children}</>
}

export default SessionManager