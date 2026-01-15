import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const DebugInfo: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth)
  const profile = useSelector((state: RootState) => state.profile)

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Auth: {auth.isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {auth.isLoading ? '⏳' : '✅'}</div>
        <div>Token: {auth.token ? '✅' : '❌'}</div>
        <div>Profile: {profile.profile ? '✅' : '❌'}</div>
        <div>Route: {window.location.pathname}</div>
      </div>
    </div>
  )
}

export default DebugInfo