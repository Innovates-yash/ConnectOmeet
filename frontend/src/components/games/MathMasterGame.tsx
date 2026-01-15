import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GameState } from '../../hooks/useGameState'

interface MathMasterGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface MathQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  difficulty: 'basic' | 'intermediate' | 'advanced'
  points: number
}

interface MathMasterGameState {
  questions: MathQuestion[]
  currentQuestionIndex: number
  score: number
  timeRemaining: number
  questionTimeRemaining: number
  gameActive: boolean
  gameEnded: boolean
  selectedAnswer: number | null
  showResult: boolean
  correctAnswers: number
  totalQuestions: number
  leaderboard: { daily: any[], weekly: any[], allTime: any[] }
}

const QUESTION_TIME_LIMIT = 10 // 10 seconds per question
const TOTAL_QUESTIONS = 15
const POINTS_BY_DIFFICULTY = {
  basic: 10,
  intermediate: 20,
  advanced: 30
}

const MathMasterGame: React.FC<MathMasterGameProps> = ({ gameState, onMove }) => {
  const questionTimerRef = useRef<NodeJS.Timeout>()
  const [gameState_internal, setGameState_internal] = useState<MathMasterGameState>({
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    timeRemaining: 0,
    questionTimeRemaining: QUESTION_TIME_LIMIT,
    gameActive: false,
    gameEnded: false,
    selectedAnswer: null,
    showResult: false,
    correctAnswers: 0,
    totalQuestions: TOTAL_QUESTIONS,
    leaderboard: {
      daily: [
        { name: 'MathGenius', score: 420 },
        { name: 'NumberCruncher', score: 380 },
        { name: 'AlgebraAce', score: 350 }
      ],
      weekly: [
        { name: 'WeeklyWiz', score: 480 },
        { name: 'MathMaster', score: 450 },
        { name: 'QuizKing', score: 420 }
      ],
      allTime: [
        { name: 'LegendaryMath', score: 600 },
        { name: 'UltimateBrain', score: 580 },
        { name: 'MathGod', score: 550 }
      ]
    }
  })

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.mathMaster) {
      setGameState_internal(prev => ({ ...prev, ...gameState.gameData.mathMaster }))
    }
  }, [gameState.gameData])

  // Generate math questions
  const generateQuestions = useCallback((): MathQuestion[] => {
    const questions: MathQuestion[] = []
    let id = 0

    // Generate basic arithmetic questions (40%)
    for (let i = 0; i < 6; i++) {
      const a = Math.floor(Math.random() * 50) + 1
      const b = Math.floor(Math.random() * 50) + 1
      const operations = ['+', '-', '*', '/']
      const op = operations[Math.floor(Math.random() * operations.length)]
      
      let question: string
      let correctAnswer: number
      let options: number[]

      switch (op) {
        case '+':
          question = `${a} + ${b} = ?`
          correctAnswer = a + b
          break
        case '-':
          question = `${a} - ${b} = ?`
          correctAnswer = a - b
          break
        case '*':
          question = `${a} * ${b} = ?`
          correctAnswer = a * b
          break
        case '/':
          const divisor = Math.floor(Math.random() * 10) + 1
          const dividend = divisor * (Math.floor(Math.random() * 20) + 1)
          question = `${dividend} / ${divisor} = ?`
          correctAnswer = dividend / divisor
          break
        default:
          question = `${a} + ${b} = ?`
          correctAnswer = a + b
      }

      // Generate wrong options
      options = [correctAnswer]
      while (options.length < 4) {
        const wrongAnswer = correctAnswer + (Math.floor(Math.random() * 20) - 10)
        if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer) && wrongAnswer > 0) {
          options.push(wrongAnswer)
        }
      }

      // Shuffle options
      options.sort(() => Math.random() - 0.5)
      const correctIndex = options.indexOf(correctAnswer)

      questions.push({
        id: id++,
        question,
        options: options.map(String),
        correctAnswer: correctIndex,
        difficulty: 'basic',
        points: POINTS_BY_DIFFICULTY.basic
      })
    }

    // Generate intermediate questions (40%)
    for (let i = 0; i < 6; i++) {
      const questionTypes = [
        // Percentages
        () => {
          const base = Math.floor(Math.random() * 200) + 50
          const percentage = [10, 15, 20, 25, 30, 50][Math.floor(Math.random() * 6)]
          const question = `What is ${percentage}% of ${base}?`
          const correctAnswer = (base * percentage) / 100
          return { question, correctAnswer }
        },
        // Square roots
        () => {
          const squares = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]
          const square = squares[Math.floor(Math.random() * squares.length)]
          const question = `What is √${square}?`
          const correctAnswer = Math.sqrt(square)
          return { question, correctAnswer }
        },
        // Powers
        () => {
          const base = Math.floor(Math.random() * 8) + 2
          const exponent = Math.floor(Math.random() * 3) + 2
          const question = `What is ${base}^${exponent}?`
          const correctAnswer = Math.pow(base, exponent)
          return { question, correctAnswer }
        }
      ]

      const questionGen = questionTypes[Math.floor(Math.random() * questionTypes.length)]
      const { question, correctAnswer } = questionGen()

      // Generate wrong options
      const options = [correctAnswer]
      while (options.length < 4) {
        const wrongAnswer = Math.floor(correctAnswer + (Math.random() * 20 - 10))
        if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer) && wrongAnswer > 0) {
          options.push(wrongAnswer)
        }
      }

      // Shuffle options
      options.sort(() => Math.random() - 0.5)
      const correctIndex = options.indexOf(correctAnswer)

      questions.push({
        id: id++,
        question,
        options: options.map(String),
        correctAnswer: correctIndex,
        difficulty: 'intermediate',
        points: POINTS_BY_DIFFICULTY.intermediate
      })
    }

    // Generate advanced questions (20%)
    for (let i = 0; i < 3; i++) {
      const questionTypes = [
        // Simple algebra
        () => {
          const a = Math.floor(Math.random() * 10) + 1
          const b = Math.floor(Math.random() * 20) + 1
          const c = a * Math.floor(Math.random() * 10) + b
          const question = `If ${a}x + ${b} = ${c}, what is x?`
          const correctAnswer = (c - b) / a
          return { question, correctAnswer }
        },
        // Quadratic basics
        () => {
          const solutions = [1, 2, 3, 4, 5]
          const x = solutions[Math.floor(Math.random() * solutions.length)]
          const result = x * x
          const question = `If x² = ${result}, what is x? (positive solution)`
          const correctAnswer = x
          return { question, correctAnswer }
        }
      ]

      const questionGen = questionTypes[Math.floor(Math.random() * questionTypes.length)]
      const { question, correctAnswer } = questionGen()

      // Generate wrong options
      const options = [correctAnswer]
      while (options.length < 4) {
        const wrongAnswer = Math.floor(correctAnswer + (Math.random() * 6 - 3))
        if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer) && wrongAnswer >= 0) {
          options.push(wrongAnswer)
        }
      }

      // Shuffle options
      options.sort(() => Math.random() - 0.5)
      const correctIndex = options.indexOf(correctAnswer)

      questions.push({
        id: id++,
        question,
        options: options.map(String),
        correctAnswer: correctIndex,
        difficulty: 'advanced',
        points: POINTS_BY_DIFFICULTY.advanced
      })
    }

    // Shuffle all questions
    return questions.sort(() => Math.random() - 0.5)
  }, [])

  // Start game
  const startGame = useCallback(() => {
    const questions = generateQuestions()
    const totalTime = questions.length * QUESTION_TIME_LIMIT

    setGameState_internal(prev => ({
      ...prev,
      questions,
      currentQuestionIndex: 0,
      score: 0,
      timeRemaining: totalTime,
      questionTimeRemaining: QUESTION_TIME_LIMIT,
      gameActive: true,
      gameEnded: false,
      selectedAnswer: null,
      showResult: false,
      correctAnswers: 0
    }))

    onMove({
      type: 'MATH_MASTER_START',
      gameState: {
        questions,
        currentQuestionIndex: 0,
        score: 0,
        timeRemaining: totalTime,
        gameActive: true
      }
    })

    startQuestionTimer()
  }, [generateQuestions, onMove])

  // Start question timer
  const startQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current)
    }

    questionTimerRef.current = setInterval(() => {
      setGameState_internal(prev => {
        const newTime = prev.questionTimeRemaining - 1
        const newTotalTime = prev.timeRemaining - 1

        if (newTime <= 0) {
          // Time's up for this question
          return {
            ...prev,
            questionTimeRemaining: 0,
            timeRemaining: newTotalTime,
            selectedAnswer: -1, // Mark as timeout
            showResult: true
          }
        }

        return {
          ...prev,
          questionTimeRemaining: newTime,
          timeRemaining: newTotalTime
        }
      })
    }, 1000)
  }, [])

  // Handle answer selection
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (gameState_internal.selectedAnswer !== null || gameState_internal.showResult) return

    setGameState_internal(prev => ({
      ...prev,
      selectedAnswer: answerIndex,
      showResult: true
    }))

    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current)
    }

    // Send move to server
    onMove({
      type: 'MATH_MASTER_ANSWER',
      questionIndex: gameState_internal.currentQuestionIndex,
      selectedAnswer: answerIndex,
      timeUsed: QUESTION_TIME_LIMIT - gameState_internal.questionTimeRemaining
    })
  }, [gameState_internal.selectedAnswer, gameState_internal.showResult, gameState_internal.currentQuestionIndex, gameState_internal.questionTimeRemaining, onMove])

  // Move to next question
  const nextQuestion = useCallback(() => {
    const currentQuestion = gameState_internal.questions[gameState_internal.currentQuestionIndex]
    const isCorrect = gameState_internal.selectedAnswer === currentQuestion.correctAnswer

    const newScore = isCorrect ? gameState_internal.score + currentQuestion.points : gameState_internal.score
    const newCorrectAnswers = isCorrect ? gameState_internal.correctAnswers + 1 : gameState_internal.correctAnswers
    const nextIndex = gameState_internal.currentQuestionIndex + 1

    if (nextIndex >= gameState_internal.questions.length) {
      // Game over
      setGameState_internal(prev => ({
        ...prev,
        score: newScore,
        correctAnswers: newCorrectAnswers,
        gameActive: false,
        gameEnded: true
      }))

      onMove({
        type: 'MATH_MASTER_END',
        finalScore: newScore,
        correctAnswers: newCorrectAnswers,
        totalQuestions: gameState_internal.questions.length
      })
    } else {
      // Next question
      setGameState_internal(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        score: newScore,
        correctAnswers: newCorrectAnswers,
        questionTimeRemaining: QUESTION_TIME_LIMIT,
        selectedAnswer: null,
        showResult: false
      }))

      startQuestionTimer()
    }
  }, [gameState_internal, onMove, startQuestionTimer])

  // Auto-advance after showing result
  useEffect(() => {
    if (gameState_internal.showResult && gameState_internal.gameActive) {
      const timer = setTimeout(() => {
        nextQuestion()
      }, 2000) // Show result for 2 seconds

      return () => clearTimeout(timer)
    }
  }, [gameState_internal.showResult, gameState_internal.gameActive, nextQuestion])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current)
      }
    }
  }, [])

  const currentQuestion = gameState_internal.questions[gameState_internal.currentQuestionIndex]
  const progress = ((gameState_internal.currentQuestionIndex + 1) / gameState_internal.totalQuestions) * 100

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-white">🧮 Math Master</h2>
        {gameState_internal.gameActive && (
          <div className="flex items-center space-x-6 text-white">
            <div>Score: <span className="text-yellow-400 font-bold text-xl">{gameState_internal.score}</span></div>
            <div>Question: <span className="text-blue-400 font-bold text-xl">{gameState_internal.currentQuestionIndex + 1}/{gameState_internal.totalQuestions}</span></div>
          </div>
        )}
      </div>

      {!gameState_internal.gameActive && !gameState_internal.gameEnded && (
        <div className="text-center">
          <div className="bg-black/20 border border-purple-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Ready for the Math Challenge?</h3>
            <p className="text-gray-300 mb-4">
              Answer {TOTAL_QUESTIONS} math questions as quickly as possible!<br/>
              You have {QUESTION_TIME_LIMIT} seconds per question.
            </p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>🟢 Basic Questions: {POINTS_BY_DIFFICULTY.basic} points</p>
              <p>🟡 Intermediate Questions: {POINTS_BY_DIFFICULTY.intermediate} points</p>
              <p>🔴 Advanced Questions: {POINTS_BY_DIFFICULTY.advanced} points</p>
            </div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-all transform hover:scale-105 text-white font-bold text-xl"
          >
            🚀 Start Quiz
          </button>
        </div>
      )}

      {gameState_internal.gameEnded && (
        <div className="text-center bg-black/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-4">🎉 Quiz Complete!</h3>
          <div className="space-y-2 mb-4">
            <p className="text-xl text-yellow-400">Final Score: {gameState_internal.score}</p>
            <p className="text-lg text-green-400">Correct Answers: {gameState_internal.correctAnswers}/{gameState_internal.totalQuestions}</p>
            <p className="text-lg text-blue-400">Accuracy: {Math.round((gameState_internal.correctAnswers / gameState_internal.totalQuestions) * 100)}%</p>
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg transition-all text-white font-bold"
          >
            Play Again
          </button>
        </div>
      )}

      {gameState_internal.gameActive && currentQuestion && (
        <div className="w-full max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Timer */}
          <div className="text-center mb-6">
            <div className={`text-4xl font-bold ${
              gameState_internal.questionTimeRemaining <= 3 ? 'text-red-400 animate-pulse' : 
              gameState_internal.questionTimeRemaining <= 5 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {gameState_internal.questionTimeRemaining}
            </div>
            <p className="text-gray-400">seconds remaining</p>
          </div>

          {/* Question */}
          <div className="bg-black/20 border border-purple-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                currentQuestion.difficulty === 'basic' ? 'bg-green-600 text-white' :
                currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-600 text-white' :
                'bg-red-600 text-white'
              }`}>
                {currentQuestion.difficulty.toUpperCase()} - {currentQuestion.points} pts
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-6">
              {currentQuestion.question}
            </h3>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                let buttonClass = "p-4 rounded-lg border-2 transition-all text-lg font-semibold "
                
                if (gameState_internal.showResult) {
                  if (index === currentQuestion.correctAnswer) {
                    buttonClass += "bg-green-600 border-green-500 text-white"
                  } else if (index === gameState_internal.selectedAnswer && index !== currentQuestion.correctAnswer) {
                    buttonClass += "bg-red-600 border-red-500 text-white"
                  } else {
                    buttonClass += "bg-gray-600 border-gray-500 text-gray-300"
                  }
                } else {
                  buttonClass += "bg-purple-600/20 border-purple-500 text-white hover:bg-purple-600/40 hover:scale-105 cursor-pointer"
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={gameState_internal.showResult}
                    className={buttonClass}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                )
              })}
            </div>

            {/* Result Display */}
            {gameState_internal.showResult && (
              <div className="mt-6 text-center">
                {gameState_internal.selectedAnswer === -1 ? (
                  <p className="text-red-400 text-xl font-bold">⏰ Time's Up!</p>
                ) : gameState_internal.selectedAnswer === currentQuestion.correctAnswer ? (
                  <p className="text-green-400 text-xl font-bold">✅ Correct! +{currentQuestion.points} points</p>
                ) : (
                  <p className="text-red-400 text-xl font-bold">❌ Incorrect!</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboards */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/20 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-lg font-bold text-yellow-400 mb-3 text-center">🏆 Daily Leaders</h4>
          {gameState_internal.leaderboard.daily.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-white mb-2">
              <span className="flex items-center">
                <span className="text-yellow-400 mr-2">#{index + 1}</span>
                {entry.name}
              </span>
              <span className="text-yellow-400 font-bold">{entry.score}</span>
            </div>
          ))}
        </div>

        <div className="bg-black/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-lg font-bold text-blue-400 mb-3 text-center">📅 Weekly Leaders</h4>
          {gameState_internal.leaderboard.weekly.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-white mb-2">
              <span className="flex items-center">
                <span className="text-blue-400 mr-2">#{index + 1}</span>
                {entry.name}
              </span>
              <span className="text-blue-400 font-bold">{entry.score}</span>
            </div>
          ))}
        </div>

        <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4">
          <h4 className="text-lg font-bold text-purple-400 mb-3 text-center">👑 All-Time Leaders</h4>
          {gameState_internal.leaderboard.allTime.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-white mb-2">
              <span className="flex items-center">
                <span className="text-purple-400 mr-2">#{index + 1}</span>
                {entry.name}
              </span>
              <span className="text-purple-400 font-bold">{entry.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4 text-center max-w-4xl">
        <div className="text-white">
          <h4 className="font-bold mb-2">How to Play Math Master:</h4>
          <div className="text-sm space-y-1">
            <p>🧮 <strong>Answer Questions:</strong> Solve math problems as quickly as possible</p>
            <p>⏱️ <strong>Beat the Clock:</strong> You have 10 seconds per question</p>
            <p>🎯 <strong>Earn Points:</strong> Basic (10pts), Intermediate (20pts), Advanced (30pts)</p>
            <p>🏆 <strong>Compete:</strong> Climb the daily, weekly, and all-time leaderboards!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MathMasterGame