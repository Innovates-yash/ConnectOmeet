import React, { useState, useEffect, useCallback } from 'react'
import { GameState } from '../../hooks/useGameState'

interface TruthOrDareGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface TruthDareQuestion {
  id: number
  questionType: 'TRUTH' | 'DARE'
  content: string
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD'
}

interface TruthOrDareGameState {
  currentPlayer: string
  currentQuestion: TruthDareQuestion | null
  gameStatus: 'waiting' | 'choosing' | 'answering' | 'finished'
  playerTurnOrder: string[]
  currentTurnIndex: number
  completedTurns: number
  maxTurns: number
  questions: TruthDareQuestion[]
}

// Mock questions database - in real implementation, this would come from backend
const mockQuestions: TruthDareQuestion[] = [
  // Truth questions
  { id: 1, questionType: 'TRUTH', content: 'What is your most embarrassing gaming moment?', difficultyLevel: 'EASY' },
  { id: 2, questionType: 'TRUTH', content: 'Who was your first video game crush?', difficultyLevel: 'EASY' },
  { id: 3, questionType: 'TRUTH', content: 'What is the longest you have played a game in one sitting?', difficultyLevel: 'MEDIUM' },
  { id: 4, questionType: 'TRUTH', content: 'Have you ever cheated in a multiplayer game?', difficultyLevel: 'MEDIUM' },
  { id: 5, questionType: 'TRUTH', content: 'What is your biggest fear in real life?', difficultyLevel: 'HARD' },
  { id: 6, questionType: 'TRUTH', content: 'What is something you have never told your best friend?', difficultyLevel: 'HARD' },
  { id: 7, questionType: 'TRUTH', content: 'What is your favorite childhood memory?', difficultyLevel: 'EASY' },
  { id: 8, questionType: 'TRUTH', content: 'If you could have any superpower, what would it be and why?', difficultyLevel: 'MEDIUM' },
  { id: 9, questionType: 'TRUTH', content: 'What is the weirdest dream you have ever had?', difficultyLevel: 'MEDIUM' },
  { id: 10, questionType: 'TRUTH', content: 'What is your most irrational fear?', difficultyLevel: 'HARD' },
  
  // Dare questions
  { id: 11, questionType: 'DARE', content: 'Do your best impression of your favorite video game character.', difficultyLevel: 'EASY' },
  { id: 12, questionType: 'DARE', content: 'Sing the theme song of your favorite game.', difficultyLevel: 'EASY' },
  { id: 13, questionType: 'DARE', content: 'Do 10 jumping jacks while saying "I am the gaming champion!"', difficultyLevel: 'MEDIUM' },
  { id: 14, questionType: 'DARE', content: 'Tell a joke in a funny voice.', difficultyLevel: 'MEDIUM' },
  { id: 15, questionType: 'DARE', content: 'Do a silly dance for 30 seconds.', difficultyLevel: 'MEDIUM' },
  { id: 16, questionType: 'DARE', content: 'Speak in an accent for the next 3 turns.', difficultyLevel: 'HARD' },
  { id: 17, questionType: 'DARE', content: 'Act out your favorite movie scene without speaking.', difficultyLevel: 'HARD' },
  { id: 18, questionType: 'DARE', content: 'Do your best animal impression.', difficultyLevel: 'EASY' },
  { id: 19, questionType: 'DARE', content: 'Compliment each player in the game.', difficultyLevel: 'MEDIUM' },
  { id: 20, questionType: 'DARE', content: 'Share an interesting fact about yourself.', difficultyLevel: 'EASY' }
]

const TruthOrDareGame: React.FC<TruthOrDareGameProps> = ({ gameState, onMove }) => {
  const [truthDareState, setTruthDareState] = useState<TruthOrDareGameState>({
    currentPlayer: gameState.players[0]?.id || '',
    currentQuestion: null,
    gameStatus: 'waiting',
    playerTurnOrder: [],
    currentTurnIndex: 0,
    completedTurns: 0,
    maxTurns: gameState.players.length * 3, // 3 rounds per player
    questions: mockQuestions
  })

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.truthDare) {
      setTruthDareState(prev => ({ ...prev, ...gameState.gameData.truthDare }))
    } else {
      // Initialize new game - randomize player order
      const shuffledPlayers = [...gameState.players].sort(() => Math.random() - 0.5)
      const playerTurnOrder = shuffledPlayers.map(p => p.id)
      
      setTruthDareState(prev => ({
        ...prev,
        playerTurnOrder,
        currentPlayer: playerTurnOrder[0],
        gameStatus: 'choosing'
      }))
    }
  }, [gameState.gameData, gameState.players])

  const getRandomQuestion = useCallback((type: 'TRUTH' | 'DARE'): TruthDareQuestion => {
    const questionsOfType = truthDareState.questions.filter(q => q.questionType === type)
    const randomIndex = Math.floor(Math.random() * questionsOfType.length)
    return questionsOfType[randomIndex]
  }, [truthDareState.questions])

  const handleChoice = useCallback((choice: 'TRUTH' | 'DARE') => {
    const question = getRandomQuestion(choice)
    
    const newState = {
      ...truthDareState,
      currentQuestion: question,
      gameStatus: 'answering' as const
    }
    
    setTruthDareState(newState)
    
    onMove({
      type: 'TRUTH_DARE_CHOICE',
      choice,
      question,
      gameState: newState
    })
  }, [truthDareState, getRandomQuestion, onMove])

  const handleTurnComplete = useCallback(() => {
    const nextTurnIndex = (truthDareState.currentTurnIndex + 1) % truthDareState.playerTurnOrder.length
    const completedTurns = truthDareState.completedTurns + 1
    const isGameFinished = completedTurns >= truthDareState.maxTurns
    
    const newState = {
      ...truthDareState,
      currentTurnIndex: nextTurnIndex,
      currentPlayer: truthDareState.playerTurnOrder[nextTurnIndex],
      completedTurns,
      currentQuestion: null,
      gameStatus: isGameFinished ? 'finished' as const : 'choosing' as const
    }
    
    setTruthDareState(newState)
    
    onMove({
      type: 'TRUTH_DARE_TURN_COMPLETE',
      nextPlayer: newState.currentPlayer,
      isGameFinished,
      gameState: newState
    })
  }, [truthDareState, onMove])

  const getCurrentPlayerName = () => {
    return gameState.players.find(p => p.id === truthDareState.currentPlayer)?.displayName || 'Unknown'
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-600/20 border-green-500/50 text-green-400'
      case 'MEDIUM': return 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400'
      case 'HARD': return 'bg-red-600/20 border-red-500/50 text-red-400'
      default: return 'bg-gray-600/20 border-gray-500/50 text-gray-400'
    }
  }

  const currentPlayerId = gameState.players.find(p => p.id === gameState.currentPlayer)?.id
  const isMyTurn = currentPlayerId === truthDareState.currentPlayer

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-white">Truth or Dare</h2>
        <div className="text-white">
          Status: <span className="capitalize text-yellow-400">{truthDareState.gameStatus}</span>
        </div>
      </div>

      {/* Game Progress */}
      <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4 w-full max-w-4xl">
        <div className="flex justify-between items-center text-white mb-4">
          <div>Current Turn: <span className="text-purple-300 font-bold">
            {getCurrentPlayerName()}
          </span></div>
          <div>Round: <span className="text-yellow-400">
            {Math.floor(truthDareState.completedTurns / gameState.players.length) + 1} / 3
          </span></div>
          <div>Progress: <span className="text-green-400">
            {truthDareState.completedTurns} / {truthDareState.maxTurns}
          </span></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(truthDareState.completedTurns / truthDareState.maxTurns) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Game Content */}
      <div className="w-full max-w-4xl">
        {truthDareState.gameStatus === 'waiting' && (
          <div className="bg-black/20 border border-purple-500/30 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">🎭 Get Ready to Play!</h3>
            <p className="text-gray-300">Waiting for all players to join...</p>
          </div>
        )}

        {truthDareState.gameStatus === 'choosing' && (
          <div className="bg-black/20 border border-purple-500/30 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-6">
              {isMyTurn ? "Your Turn!" : `${getCurrentPlayerName()}'s Turn`}
            </h3>
            
            {isMyTurn ? (
              <div className="space-y-6">
                <p className="text-gray-300 text-lg">Choose your challenge:</p>
                <div className="flex justify-center space-x-8">
                  <button
                    onClick={() => handleChoice('TRUTH')}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-all transform hover:scale-105"
                  >
                    <div className="text-white text-xl font-bold">🤔 TRUTH</div>
                    <div className="text-blue-200 text-sm">Answer honestly</div>
                  </button>
                  
                  <button
                    onClick={() => handleChoice('DARE')}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-all transform hover:scale-105"
                  >
                    <div className="text-white text-xl font-bold">😈 DARE</div>
                    <div className="text-red-200 text-sm">Take the challenge</div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-300">
                <p className="text-lg">Waiting for {getCurrentPlayerName()} to choose...</p>
                <div className="mt-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {truthDareState.gameStatus === 'answering' && truthDareState.currentQuestion && (
          <div className="bg-black/20 border border-purple-500/30 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className={`px-4 py-2 rounded-lg border ${
                  truthDareState.currentQuestion.questionType === 'TRUTH' 
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                    : 'bg-red-600/20 border-red-500/50 text-red-400'
                }`}>
                  {truthDareState.currentQuestion.questionType === 'TRUTH' ? '🤔 TRUTH' : '😈 DARE'}
                </div>
                <div className={`px-3 py-1 rounded-lg border text-sm ${getDifficultyBadge(truthDareState.currentQuestion.difficultyLevel)}`}>
                  {truthDareState.currentQuestion.difficultyLevel}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">
                {getCurrentPlayerName()}'s Challenge:
              </h3>
            </div>
            
            <div className="bg-black/30 border border-gray-600 rounded-lg p-6 mb-6">
              <p className="text-white text-lg text-center leading-relaxed">
                {truthDareState.currentQuestion.content}
              </p>
            </div>
            
            {isMyTurn ? (
              <div className="text-center">
                <p className="text-gray-300 mb-4">Complete your challenge, then click when done:</p>
                <button
                  onClick={handleTurnComplete}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg transition-all transform hover:scale-105 text-white font-bold"
                >
                  ✅ Challenge Complete!
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-300">
                <p>Waiting for {getCurrentPlayerName()} to complete their challenge...</p>
                <div className="mt-4 flex justify-center">
                  <div className="animate-pulse text-2xl">⏳</div>
                </div>
              </div>
            )}
          </div>
        )}

        {truthDareState.gameStatus === 'finished' && (
          <div className="bg-black/20 border border-green-500/30 rounded-lg p-8 text-center">
            <h3 className="text-3xl font-bold text-green-400 mb-4">🎉 Game Complete! 🎉</h3>
            <p className="text-white text-lg mb-4">
              Great job everyone! You completed all {truthDareState.maxTurns} challenges.
            </p>
            <p className="text-gray-300">
              Thanks for playing Truth or Dare! 🎭
            </p>
          </div>
        )}
      </div>

      {/* Player List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
        {gameState.players.map((player) => {
          const isCurrentPlayer = player.id === truthDareState.currentPlayer
          const turnIndex = truthDareState.playerTurnOrder.indexOf(player.id)
          const playerTurns = Math.floor(truthDareState.completedTurns / gameState.players.length)
          const hasCompletedCurrentRound = turnIndex < (truthDareState.completedTurns % gameState.players.length)
          
          return (
            <div key={player.id} className={`bg-black/20 border rounded-lg p-3 ${
              isCurrentPlayer ? 'border-purple-500 ring-2 ring-purple-400/50' : 'border-gray-500'
            }`}>
              <div className="text-white text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className={`w-4 h-4 rounded-full ${
                    isCurrentPlayer ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'
                  }`}></div>
                  <div className="font-semibold">{player.displayName}</div>
                </div>
                <div className="text-sm text-gray-300">
                  Turn Order: #{turnIndex + 1}
                </div>
                <div className="text-xs text-gray-400">
                  Completed: {playerTurns + (hasCompletedCurrentRound ? 1 : 0)}/3
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      {truthDareState.gameStatus === 'choosing' && isMyTurn && (
        <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4 text-center max-w-2xl">
          <div className="text-white">
            <h4 className="font-bold mb-2">How to Play:</h4>
            <p className="text-sm">
              Choose "Truth" to answer a question honestly, or "Dare" to complete a fun challenge. 
              Be respectful and have fun! 🎭
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TruthOrDareGame