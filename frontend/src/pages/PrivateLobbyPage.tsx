import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { 
  createPrivateLobby, 
  joinLobbyByCode, 
  leaveLobby, 
  startGame, 
  clearError,
  clearLobby,
  LobbyParticipant 
} from '../store/slices/lobbySlice'

const PrivateLobbyPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { 
    currentLobby, 
    isLoading, 
    error, 
    joinLoading, 
    createLoading 
  } = useSelector((state: RootState) => state.lobby)
  const { profile } = useSelector((state: RootState) => state.profile)

  const [inviteCode, setInviteCode] = useState('')
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [gameType, setGameType] = useState('')

  useEffect(() => {
    // Clear any existing lobby when component mounts
    return () => {
      dispatch(clearLobby())
    }
  }, [dispatch])

  useEffect(() => {
    // Clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleCreateLobby = async () => {
    try {
      await dispatch(createPrivateLobby(gameType || undefined)).unwrap()
    } catch (error) {
      console.error('Failed to create lobby:', error)
    }
  }

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    try {
      await dispatch(joinLobbyByCode(inviteCode.toUpperCase())).unwrap()
      setInviteCode('')
      setShowJoinForm(false)
    } catch (error) {
      console.error('Failed to join lobby:', error)
    }
  }

  const handleLeaveLobby = async () => {
    try {
      await dispatch(leaveLobby()).unwrap()
    } catch (error) {
      console.error('Failed to leave lobby:', error)
    }
  }

  const handleStartGame = async () => {
    try {
      const result = await dispatch(startGame()).unwrap()
      // Navigate to game session
      navigate(`/game/${result.gameSessionId}`)
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  const copyInviteCode = () => {
    if (currentLobby?.inviteCode) {
      navigator.clipboard.writeText(currentLobby.inviteCode)
      // You could add a toast notification here
    }
  }

  const isCreator = currentLobby?.participants.find((p: LobbyParticipant) => p.id === profile?.id)?.isCreator || false
  const timeUntilExpiry = currentLobby ? 
    Math.max(0, new Date(currentLobby.expiresAt).getTime() - Date.now()) : 0
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60))
  const minutesUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60))

  const gameTypes = [
    { value: '', label: 'Any Game' },
    { value: 'chess', label: 'Chess (2 players)' },
    { value: 'racing', label: 'Car Racing (up to 4 players)' },
    { value: 'uno', label: 'Uno (up to 8 players)' },
    { value: 'rummy', label: 'Rummy (2-6 players)' },
    { value: 'ludo', label: 'Ludo (up to 4 players)' },
    { value: 'truth-or-dare', label: 'Truth or Dare (up to 8 players)' },
    { value: 'fighting', label: 'Fighting Game (2 players)' },
    { value: 'bubble-blast', label: 'Bubble Blast (up to 8 players)' },
    { value: 'math-master', label: 'Math Master (up to 8 players)' }
  ]

  if (currentLobby) {
    return (
      <div className="min-h-screen bg-cyber-dark">
        <header className="border-b border-cyber-gray-700 bg-cyber-darker">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-cyber-primary hover:text-cyber-light transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-cyber text-gradient">Private Lobby</h1>
              <button
                onClick={handleLeaveLobby}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Leave Lobby
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Lobby Info */}
          <div className="card-cyber-glow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-cyber text-cyber-light mb-2">
                  {currentLobby.gameType ? 
                    gameTypes.find(g => g.value === currentLobby.gameType)?.label || 'Game Lobby' :
                    'Private Lobby'
                  }
                </h2>
                <p className="text-cyber-gray-400">
                  Expires in {hoursUntilExpiry}h {minutesUntilExpiry}m
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono text-cyber-primary mb-2">
                  {currentLobby.inviteCode}
                </div>
                <button
                  onClick={copyInviteCode}
                  className="text-sm text-cyber-secondary hover:text-cyber-light transition-colors"
                >
                  📋 Copy Code
                </button>
              </div>
            </div>

            {/* Capacity */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyber-light">Players</span>
                <span className="text-cyber-gray-400">
                  {currentLobby.participants.length} / {currentLobby.maxCapacity}
                </span>
              </div>
              <div className="w-full bg-cyber-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyber-primary to-cyber-secondary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(currentLobby.participants.length / currentLobby.maxCapacity) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentLobby.participants.map((participant: LobbyParticipant) => (
                <div 
                  key={participant.id}
                  className="flex items-center space-x-3 p-3 bg-cyber-gray-800/50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-cyber-primary to-cyber-secondary rounded-full flex items-center justify-center">
                    <span className="text-cyber-dark font-bold text-sm">
                      {participant.displayName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-cyber-light font-medium">
                        {participant.displayName}
                      </span>
                      {participant.isCreator && (
                        <span className="text-xs bg-cyber-primary/20 text-cyber-primary px-2 py-1 rounded-full">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            {isCreator && (
              <div className="flex space-x-4">
                <button
                  onClick={handleStartGame}
                  disabled={currentLobby.participants.length < 2 || isLoading}
                  className="flex-1 py-3 bg-green-500/20 border border-green-500 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Starting...' : 'Start Game'}
                </button>
              </div>
            )}

            {!isCreator && (
              <div className="text-center text-cyber-gray-400">
                Waiting for host to start the game...
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cyber-dark">
      <header className="border-b border-cyber-gray-700 bg-cyber-darker">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-cyber-primary hover:text-cyber-light transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-xl font-cyber text-gradient">Private Lobby</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-cyber text-gradient mb-4">
            Play with Friends
          </h2>
          <p className="text-cyber-gray-400">
            Create a private lobby or join one with an invite code
          </p>
        </div>

        <div className="space-y-6">
          {/* Create Lobby */}
          <div className="card-cyber-glow p-6">
            <h3 className="text-xl font-cyber text-cyber-light mb-4">
              Create New Lobby
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-cyber-light mb-2">
                Game Type (Optional)
              </label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="w-full px-4 py-3 bg-cyber-gray-800 border border-cyber-gray-600 rounded-lg text-cyber-light focus:outline-none focus:border-cyber-primary transition-colors"
              >
                {gameTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateLobby}
              disabled={createLoading}
              className="w-full py-3 bg-cyber-primary hover:bg-cyber-primary/80 text-cyber-dark font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLoading ? 'Creating...' : 'Create Lobby'}
            </button>
          </div>

          {/* Join Lobby */}
          <div className="card-cyber-glow p-6">
            <h3 className="text-xl font-cyber text-cyber-light mb-4">
              Join Existing Lobby
            </h3>
            
            {!showJoinForm ? (
              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full py-3 bg-cyber-secondary/20 border border-cyber-secondary text-cyber-secondary rounded-lg hover:bg-cyber-secondary/30 transition-colors font-medium"
              >
                Enter Invite Code
              </button>
            ) : (
              <form onSubmit={handleJoinLobby} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cyber-light mb-2">
                    6-Character Invite Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-cyber-gray-800 border border-cyber-gray-600 rounded-lg text-cyber-light placeholder-cyber-gray-500 focus:outline-none focus:border-cyber-primary transition-colors font-mono text-center text-lg tracking-widest"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false)
                      setInviteCode('')
                    }}
                    className="flex-1 py-3 bg-cyber-gray-700 text-cyber-gray-300 rounded-lg hover:bg-cyber-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteCode.length !== 6 || joinLoading}
                    className="flex-1 py-3 bg-cyber-secondary hover:bg-cyber-secondary/80 text-cyber-dark font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joinLoading ? 'Joining...' : 'Join Lobby'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="text-center text-cyber-gray-400 text-sm">
            <p>Invite codes expire after 24 hours</p>
            <p>Share your code with friends to play together</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PrivateLobbyPage