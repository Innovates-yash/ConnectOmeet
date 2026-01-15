import React, { useState, useEffect, useCallback } from 'react'
import { GameState } from '../../hooks/useGameState'

interface MemeBattleGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface MemePost {
  id: number
  userId: string
  title: string
  imageUrl: string
  description?: string
  likesCount: number
  competitionWeek: string
  isWinner: boolean
  createdAt: string
  userDisplayName: string
  hasUserLiked: boolean
}

interface MemeBattleGameState {
  currentWeek: string
  weekStartDate: Date
  weekEndDate: Date
  timeRemaining: string
  phase: 'submission' | 'voting' | 'results'
  userSubmission?: MemePost
  allSubmissions: MemePost[]
  winner?: MemePost
  canSubmit: boolean
  canVote: boolean
  entryFee: number
  prizePool: number
}

// Mock data for demonstration
const mockSubmissions: MemePost[] = [
  {
    id: 1,
    userId: 'user1',
    title: 'When you finally beat that boss',
    imageUrl: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Victory+Meme',
    description: 'That feeling when you defeat the final boss after 50 attempts',
    likesCount: 15,
    competitionWeek: '2024-01-08',
    isWinner: false,
    createdAt: '2024-01-08T10:00:00Z',
    userDisplayName: 'GamerPro',
    hasUserLiked: false
  },
  {
    id: 2,
    userId: 'user2',
    title: 'Multiplayer lag be like',
    imageUrl: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Lag+Meme',
    description: 'When your internet decides to take a break during ranked matches',
    likesCount: 23,
    competitionWeek: '2024-01-08',
    isWinner: false,
    createdAt: '2024-01-08T14:30:00Z',
    userDisplayName: 'LagMaster',
    hasUserLiked: true
  },
  {
    id: 3,
    userId: 'user3',
    title: 'Gaming setup evolution',
    imageUrl: 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Setup+Meme',
    description: 'From potato PC to RGB everything',
    likesCount: 31,
    competitionWeek: '2024-01-08',
    isWinner: true,
    createdAt: '2024-01-08T16:45:00Z',
    userDisplayName: 'RGBKing',
    hasUserLiked: false
  }
]

const MemeBattleGame: React.FC<MemeBattleGameProps> = ({ gameState, onMove }) => {
  const [memeBattleState, setMemeBattleState] = useState<MemeBattleGameState>({
    currentWeek: '2024-01-08',
    weekStartDate: new Date('2024-01-08'),
    weekEndDate: new Date('2024-01-15'),
    timeRemaining: '',
    phase: 'voting',
    allSubmissions: mockSubmissions,
    canSubmit: true,
    canVote: true,
    entryFee: 25,
    prizePool: 200
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: ''
  })
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Calculate time remaining and phase
  useEffect(() => {
    const updateTimeAndPhase = () => {
      const now = new Date()
      const weekEnd = memeBattleState.weekEndDate
      const timeLeft = weekEnd.getTime() - now.getTime()
      
      if (timeLeft <= 0) {
        setMemeBattleState(prev => ({
          ...prev,
          phase: 'results',
          timeRemaining: 'Competition Ended',
          canSubmit: false,
          canVote: false
        }))
      } else {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
        
        setMemeBattleState(prev => ({
          ...prev,
          timeRemaining: `${days}d ${hours}h ${minutes}m`,
          phase: days > 5 ? 'submission' : 'voting'
        }))
      }
    }

    updateTimeAndPhase()
    const interval = setInterval(updateTimeAndPhase, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [memeBattleState.weekEndDate])

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.memeBattle) {
      setMemeBattleState(prev => ({ ...prev, ...gameState.gameData.memeBattle }))
    }
  }, [gameState.gameData])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or GIF)')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
    }
  }, [])

  const handleSubmitMeme = useCallback(() => {
    if (!selectedFile || !uploadForm.title.trim()) {
      alert('Please provide a title and select an image')
      return
    }

    // In a real implementation, this would upload to a server
    const newMeme: MemePost = {
      id: Date.now(),
      userId: gameState.currentPlayer,
      title: uploadForm.title,
      imageUrl: URL.createObjectURL(selectedFile),
      description: uploadForm.description,
      likesCount: 0,
      competitionWeek: memeBattleState.currentWeek,
      isWinner: false,
      createdAt: new Date().toISOString(),
      userDisplayName: gameState.players.find(p => p.id === gameState.currentPlayer)?.displayName || 'You',
      hasUserLiked: false
    }

    const newState = {
      ...memeBattleState,
      userSubmission: newMeme,
      allSubmissions: [...memeBattleState.allSubmissions, newMeme],
      canSubmit: false
    }

    setMemeBattleState(newState)
    setShowUploadModal(false)
    setSelectedFile(null)
    setUploadForm({ title: '', description: '' })

    onMove({
      type: 'MEME_BATTLE_SUBMIT',
      meme: newMeme,
      gameState: newState
    })
  }, [selectedFile, uploadForm, gameState, memeBattleState, onMove])

  const handleLikeMeme = useCallback((memeId: number) => {
    const updatedSubmissions = memeBattleState.allSubmissions.map(meme => {
      if (meme.id === memeId) {
        const hasLiked = meme.hasUserLiked
        return {
          ...meme,
          likesCount: hasLiked ? meme.likesCount - 1 : meme.likesCount + 1,
          hasUserLiked: !hasLiked
        }
      }
      return meme
    })

    const newState = {
      ...memeBattleState,
      allSubmissions: updatedSubmissions
    }

    setMemeBattleState(newState)

    onMove({
      type: 'MEME_BATTLE_LIKE',
      memeId,
      gameState: newState
    })
  }, [memeBattleState, onMove])

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'submission': return 'text-blue-400'
      case 'voting': return 'text-yellow-400'
      case 'results': return 'text-green-400'
      default: return 'text-white'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'submission': return '📤'
      case 'voting': return '🗳️'
      case 'results': return '🏆'
      default: return '🎭'
    }
  }

  const sortedSubmissions = [...memeBattleState.allSubmissions].sort((a, b) => b.likesCount - a.likesCount)
  const currentUserSubmission = memeBattleState.allSubmissions.find(m => m.userId === gameState.currentPlayer)

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-6xl">
        <h2 className="text-3xl font-bold text-white">Meme Battle</h2>
        <div className="text-white">
          Phase: <span className={`capitalize font-bold ${getPhaseColor(memeBattleState.phase)}`}>
            {getPhaseIcon(memeBattleState.phase)} {memeBattleState.phase}
          </span>
        </div>
      </div>

      {/* Competition Info */}
      <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4 w-full max-w-6xl">
        <div className="flex justify-between items-center text-white mb-4">
          <div>Week: <span className="text-purple-300 font-bold">
            {memeBattleState.currentWeek}
          </span></div>
          <div>Time Remaining: <span className="text-yellow-400">
            {memeBattleState.timeRemaining}
          </span></div>
          <div>Prize Pool: <span className="text-green-400">
            {memeBattleState.prizePool} GameCoins
          </span></div>
          <div>Entry Fee: <span className="text-red-400">
            {memeBattleState.entryFee} GameCoins
          </span></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${memeBattleState.phase === 'results' ? 100 : memeBattleState.phase === 'voting' ? 70 : 30}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {memeBattleState.canSubmit && !currentUserSubmission && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-all transform hover:scale-105 text-white font-bold"
          >
            📤 Submit Meme
          </button>
        )}
        
        {currentUserSubmission && (
          <div className="px-6 py-3 bg-green-600/20 border border-green-500 rounded-lg text-green-400 font-bold">
            ✅ Meme Submitted
          </div>
        )}
      </div>

      {/* Meme Gallery */}
      <div className="w-full max-w-6xl">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          {memeBattleState.phase === 'results' ? '🏆 Final Results' : '🎭 Community Submissions'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSubmissions.map((meme, index) => (
            <div key={meme.id} className={`bg-black/20 border rounded-lg overflow-hidden transition-all hover:scale-105 ${
              meme.isWinner ? 'border-yellow-500 ring-2 ring-yellow-400/50' : 'border-gray-500'
            }`}>
              {/* Winner Badge */}
              {meme.isWinner && (
                <div className="bg-yellow-500 text-black text-center py-2 font-bold">
                  🏆 WINNER 🏆
                </div>
              )}
              
              {/* Ranking Badge */}
              {!meme.isWinner && memeBattleState.phase === 'results' && index < 3 && (
                <div className={`text-center py-2 font-bold ${
                  index === 0 ? 'bg-yellow-600/20 text-yellow-400' :
                  index === 1 ? 'bg-gray-600/20 text-gray-300' :
                  'bg-orange-600/20 text-orange-400'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #{index + 1}
                </div>
              )}
              
              {/* Meme Image */}
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                <img 
                  src={meme.imageUrl} 
                  alt={meme.title}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Image+Not+Found'
                  }}
                />
              </div>
              
              {/* Meme Info */}
              <div className="p-4">
                <h4 className="text-white font-bold text-lg mb-2">{meme.title}</h4>
                <p className="text-gray-300 text-sm mb-3">{meme.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="text-gray-400 text-sm">
                    by {meme.userDisplayName}
                  </div>
                  
                  {memeBattleState.canVote && meme.userId !== gameState.currentPlayer && (
                    <button
                      onClick={() => handleLikeMeme(meme.id)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all ${
                        meme.hasUserLiked 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <span>{meme.hasUserLiked ? '❤️' : '🤍'}</span>
                      <span>{meme.likesCount}</span>
                    </button>
                  )}
                  
                  {(!memeBattleState.canVote || meme.userId === gameState.currentPlayer) && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <span>❤️</span>
                      <span>{meme.likesCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {sortedSubmissions.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="text-6xl mb-4">🎭</div>
            <p className="text-xl">No memes submitted yet!</p>
            <p>Be the first to share your creativity!</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-500 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-4">Submit Your Meme</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter meme title..."
                  maxLength={200}
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 h-20 resize-none"
                  placeholder="Describe your meme..."
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Image * (JPEG, PNG, GIF - Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              {selectedFile && (
                <div className="text-green-400 text-sm">
                  ✅ Selected: {selectedFile.name}
                </div>
              )}
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleSubmitMeme}
                disabled={!selectedFile || !uploadForm.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed border border-blue-500 disabled:border-gray-500 rounded-lg text-white font-bold transition-all"
              >
                Submit Meme
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                  setUploadForm({ title: '', description: '' })
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 border border-gray-500 rounded-lg text-white font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4 text-center max-w-4xl">
        <div className="text-white">
          <h4 className="font-bold mb-2">How Meme Battle Works:</h4>
          <div className="text-sm space-y-1">
            <p>📤 <strong>Submission Phase:</strong> Upload your best gaming memes (first 5 days)</p>
            <p>🗳️ <strong>Voting Phase:</strong> Community votes on all submissions (last 2 days)</p>
            <p>🏆 <strong>Results:</strong> Winner gets {memeBattleState.prizePool} GameCoins and bragging rights!</p>
            <p>💰 Entry fee: {memeBattleState.entryFee} GameCoins per submission</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemeBattleGame