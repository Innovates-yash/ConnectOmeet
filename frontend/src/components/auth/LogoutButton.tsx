import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { LogOut, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppDispatch } from '../../store/store'
import { logout } from '../../store/slices/authSlice'

interface LogoutButtonProps {
  variant?: 'button' | 'icon' | 'text'
  className?: string
  showConfirmation?: boolean
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = 'button',
  className = '',
  showConfirmation = true
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (showConfirmation) {
      const confirmed = window.confirm('Are you sure you want to logout?')
      if (!confirmed) return
    }

    try {
      setIsLoading(true)
      dispatch(logout())
      navigate('/auth')
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    } finally {
      setIsLoading(false)
    }
  }

  const baseClasses = 'transition-all duration-300 flex items-center justify-center'
  
  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`${baseClasses} p-2 rounded-lg border border-cyber-gray-700 text-cyber-gray-400 hover:text-red-400 hover:border-red-400 ${className}`}
        title="Logout"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
      </button>
    )
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`${baseClasses} text-cyber-gray-400 hover:text-red-400 text-sm ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
            Logging out...
          </>
        ) : (
          <>
            <LogOut className="w-3 h-3 mr-1" />
            Logout
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseClasses} px-4 py-2 bg-transparent border-2 border-red-500 text-red-500 font-cyber font-bold uppercase tracking-wider hover:bg-red-500 hover:text-cyber-dark hover:shadow-lg hover:shadow-red-500/50 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Logging out...
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </>
      )}
    </button>
  )
}

export default LogoutButton