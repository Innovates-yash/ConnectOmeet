import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchRecommendations, likeProfile, passProfile } from '../store/slices/compatibilitySlice'

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { recommendations, isLoading, error } = useSelector((state: RootState) => state.compatibility)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showNoMore, setShowNoMore] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (recommendations.length === 0 && !isLoading && !error) {
      dispatch(fetchRecommendations())
    }
  }, [dispatch, recommendations.length, isLoading, error])

  useEffect(() => {
    if (currentIndex >= recommendations.length && recommendations.length > 0) {
      setShowNoMore(true)
    }
  }, [currentIndex, recommendations.length])

  const currentProfile = recommendations[currentIndex]

  const handleLike = async () => {
    if (!currentProfile) return
    
    try {
      await dispatch(likeProfile(currentProfile.id)).unwrap()
      setCurrentIndex(prev => prev + 1)
      setDragOffset(0)
    } catch (error) {
      console.error('Failed to like profile:', error)
    }
  }

  const handlePass = async () => {
    if (!currentProfile) return
    
    try {
      await dispatch(passProfile(currentProfile.id)).unwrap()
      setCurrentIndex(prev => prev + 1)
      setDragOffset(0)
    } catch (error) {
      console.error('Failed to pass profile:', error)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const startX = e.clientX
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - startX
      setDragOffset(deltaX)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      if (Math.abs(dragOffset) > 100) {
        if (dragOffset > 0) {
          handleLike()
        } else {
          handlePass()
        }
      } else {
        setDragOffset(0)
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const startX = e.touches[0].clientX
    
    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - startX
      setDragOffset(deltaX)
    }
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      
      if (Math.abs(dragOffset) > 100) {
        if (dragOffset > 0) {
          handleLike()
        } else {
          handlePass()
        }
      } else {
        setDragOffset(0)
      }
    }
    
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getCompatibilityBg = (score: number) => {
    if (score >= 80) return 'bg-green-400/20 border-green-400'
    if (score >= 60) return 'bg-yellow-400/20 border-yellow-400'
    if (score >= 40) return 'bg-orange-400/20 border-orange-400'
    return 'bg-red-400/20 border-red-400'
  }

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyber-primary mx-auto mb-4"></div>
          <p className="text-cyber-light">Finding compatible gamers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading profiles: {error}</p>
          <button 
            onClick={() => dispatch(fetchRecommendations())}
            className="btn-cyber-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (showNoMore || (recommendations.length === 0 && !isLoading)) {
    return (
      <div className="min-h-screen bg-cyber-dark">
        {/* Header */}
        <header className="border-b border-cyber-gray-700 bg-cyber-darker">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-cyber-primary hover:text-cyber-light transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-cyber text-gradient">Discover Gamers</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-2xl font-cyber text-cyber-light mb-4">
              No More Profiles
            </h2>
            <p className="text-cyber-gray-300 mb-6">
              You've seen all available gamers! Check back later for new profiles or adjust your preferences.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-cyber-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="border-b border-cyber-gray-700 bg-cyber-darker">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-cyber-primary hover:text-cyber-light transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-xl font-cyber text-gradient">Discover Gamers</h1>
            <div className="text-cyber-gray-400 text-sm">
              {currentIndex + 1} / {recommendations.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="relative h-[600px]">
          {/* Profile Card */}
          {currentProfile && (
            <div
              ref={cardRef}
              className={`
                absolute inset-0 card-cyber-glow cursor-grab active:cursor-grabbing
                transition-transform duration-300 ease-out
                ${isDragging ? 'scale-105' : 'scale-100'}
              `}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.1}deg)`,
                opacity: Math.max(0.7, 1 - Math.abs(dragOffset) / 300)
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Compatibility Score Badge */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border ${getCompatibilityBg(currentProfile.compatibilityScore)} z-10`}>
                <span className={`text-sm font-bold ${getCompatibilityColor(currentProfile.compatibilityScore)}`}>
                  {currentProfile.compatibilityScore}% Match
                </span>
              </div>

              {/* Swipe Indicators */}
              {dragOffset > 50 && (
                <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center z-10 rounded-xl">
                  <div className="text-6xl">💚</div>
                </div>
              )}
              {dragOffset < -50 && (
                <div className="absolute inset-0 bg-red-400/20 flex items-center justify-center z-10 rounded-xl">
                  <div className="text-6xl">❌</div>
                </div>
              )}

              {/* Profile Content */}
              <div className="p-6 h-full flex flex-col">
                {/* Avatar and Basic Info */}
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyber-primary to-cyber-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-cyber-dark font-bold text-2xl">
                      {currentProfile.displayName.charAt(0)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-cyber text-cyber-light mb-2">
                    {currentProfile.displayName}
                  </h2>
                  <p className="text-cyber-secondary text-sm">
                    {currentProfile.gameExperience} Gamer
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-mono text-cyber-primary">
                      {currentProfile.totalGamesPlayed}
                    </div>
                    <div className="text-xs text-cyber-gray-400">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-mono text-green-400">
                      {currentProfile.totalGamesPlayed > 0 
                        ? Math.round((currentProfile.totalGamesWon / currentProfile.totalGamesPlayed) * 100)
                        : 0}%
                    </div>
                    <div className="text-xs text-cyber-gray-400">Win Rate</div>
                  </div>
                </div>

                {/* Interest Tags */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-cyber-light mb-3 uppercase tracking-wider">
                    🎯 Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interestTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-cyber-primary bg-opacity-20 border border-cyber-primary text-cyber-primary text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                {currentProfile.bio && (
                  <div className="mb-6 flex-1">
                    <h3 className="text-sm font-medium text-cyber-light mb-2 uppercase tracking-wider">
                      📝 About
                    </h3>
                    <p className="text-cyber-gray-300 text-sm leading-relaxed">
                      {currentProfile.bio}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-auto">
                  <button
                    onClick={handlePass}
                    className="flex-1 py-3 bg-red-500/20 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                  >
                    Pass
                  </button>
                  <button
                    onClick={handleLike}
                    className="flex-1 py-3 bg-green-500/20 border border-green-500 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                  >
                    Like
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Next Card Preview */}
          {recommendations[currentIndex + 1] && (
            <div className="absolute inset-0 card-cyber opacity-50 scale-95 -z-10">
              <div className="p-6 h-full flex flex-col">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyber-primary to-cyber-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-cyber-dark font-bold">
                      {recommendations[currentIndex + 1].displayName.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-cyber text-cyber-light">
                    {recommendations[currentIndex + 1].displayName}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-cyber-gray-400 text-sm">
            Swipe right to like • Swipe left to pass
          </p>
        </div>
      </main>
    </div>
  )
}

export default DiscoverPage