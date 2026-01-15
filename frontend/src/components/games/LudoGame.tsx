import React, { useState, useEffect, useCallback } from 'react'
import { GameState } from '../../hooks/useGameState'

interface LudoGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface LudoPiece {
  id: string
  playerId: string
  color: 'red' | 'blue' | 'green' | 'yellow'
  position: number // -1 = home, 0-51 = board, 52-57 = home stretch, 58 = finished
  isInSafeZone: boolean
}

interface LudoGameState {
  pieces: LudoPiece[]
  currentPlayer: string
  diceValue: number | null
  gameStatus: 'active' | 'finished'
  winner?: string
  playerColors: { [playerId: string]: 'red' | 'blue' | 'green' | 'yellow' }
  canRollDice: boolean
  consecutiveSixes: number
}

const LudoGame: React.FC<LudoGameProps> = ({ gameState, onMove }) => {
  const [ludoState, setLudoState] = useState<LudoGameState>({
    pieces: [],
    currentPlayer: gameState.players[0]?.id || '',
    diceValue: null,
    gameStatus: 'active',
    playerColors: {},
    canRollDice: true,
    consecutiveSixes: 0
  })

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null)

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.ludo) {
      setLudoState(prev => ({ ...prev, ...gameState.gameData.ludo }))
    } else {
      // Initialize new game
      const colors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow']
      const pieces: LudoPiece[] = []
      const playerColors: { [playerId: string]: 'red' | 'blue' | 'green' | 'yellow' } = {}
      
      gameState.players.forEach((player, index) => {
        const color = colors[index % 4]
        playerColors[player.id] = color
        
        // Create 4 pieces per player
        for (let i = 0; i < 4; i++) {
          pieces.push({
            id: `${player.id}-${i}`,
            playerId: player.id,
            color,
            position: -1, // Start at home
            isInSafeZone: true
          })
        }
      })
      
      setLudoState(prev => ({
        ...prev,
        pieces,
        playerColors
      }))
    }
  }, [gameState.gameData, gameState.players])

  const rollDice = useCallback(() => {
    if (!ludoState.canRollDice) return

    const diceValue = Math.floor(Math.random() * 6) + 1
    const newConsecutiveSixes = diceValue === 6 ? ludoState.consecutiveSixes + 1 : 0
    
    // If 3 consecutive sixes, forfeit turn
    const shouldForfeit = newConsecutiveSixes >= 3
    
    const newLudoState = {
      ...ludoState,
      diceValue,
      canRollDice: false,
      consecutiveSixes: shouldForfeit ? 0 : newConsecutiveSixes
    }

    if (shouldForfeit) {
      // Move to next player
      const nextPlayer = getNextPlayer()
      newLudoState.currentPlayer = nextPlayer
      newLudoState.canRollDice = true
      newLudoState.diceValue = null as any
    }

    setLudoState(newLudoState)

    onMove({
      type: 'LUDO_ROLL_DICE',
      diceValue,
      shouldForfeit,
      gameState: newLudoState
    })
  }, [ludoState, gameState.players])

  const getNextPlayer = useCallback(() => {
    const currentIndex = gameState.players.findIndex(p => p.id === ludoState.currentPlayer)
    const nextIndex = (currentIndex + 1) % gameState.players.length
    return gameState.players[nextIndex].id
  }, [gameState.players, ludoState.currentPlayer])

  const canMovePiece = useCallback((piece: LudoPiece): boolean => {
    if (!ludoState.diceValue) return false
    
    // Can always move out of home with 6
    if (piece.position === -1) {
      return ludoState.diceValue === 6
    }
    
    // Check if move would exceed finish
    const newPosition = piece.position + ludoState.diceValue
    const startPosition = getStartPosition(piece.color)
    
    // If in home stretch
    if (piece.position >= 52) {
      return newPosition <= 58
    }
    
    // Normal board movement
    return newPosition <= 51 || (newPosition > 51 && piece.position >= startPosition - 6)
  }, [ludoState.diceValue])

  const getStartPosition = (color: 'red' | 'blue' | 'green' | 'yellow'): number => {
    const startPositions = { red: 1, blue: 14, green: 27, yellow: 40 }
    return startPositions[color]
  }

  const getSafePositions = (): number[] => {
    return [1, 9, 14, 22, 27, 35, 40, 48] // Safe squares on the board
  }

  const movePiece = useCallback((pieceId: string) => {
    const piece = ludoState.pieces.find(p => p.id === pieceId)
    if (!piece || !canMovePiece(piece)) return

    const newPieces = [...ludoState.pieces]
    const pieceIndex = newPieces.findIndex(p => p.id === pieceId)
    const updatedPiece = { ...newPieces[pieceIndex] }
    
    // Calculate new position
    if (updatedPiece.position === -1) {
      // Moving out of home
      updatedPiece.position = getStartPosition(updatedPiece.color)
    } else {
    const newPosition = updatedPiece.position + ludoState.diceValue!
      
      // Handle home stretch entry
      const startPos = getStartPosition(updatedPiece.color)
      if (newPosition > 51 && updatedPiece.position < startPos + 45) {
        updatedPiece.position = 52 + (newPosition - 52)
      } else if (newPosition > 51) {
        updatedPiece.position = newPosition - 52
      } else {
        updatedPiece.position = newPosition
      }
      
      // Check if finished
      if (updatedPiece.position >= 58) {
        updatedPiece.position = 58
      }
    }
    
    // Update safe zone status
    updatedPiece.isInSafeZone = getSafePositions().includes(updatedPiece.position) || 
                                updatedPiece.position >= 52 || 
                                updatedPiece.position === -1

    // Check for captures
    if (!updatedPiece.isInSafeZone && updatedPiece.position >= 0 && updatedPiece.position <= 51) {
      newPieces.forEach((otherPiece, index) => {
        if (otherPiece.id !== pieceId && 
            otherPiece.position === updatedPiece.position && 
            otherPiece.playerId !== updatedPiece.playerId &&
            !otherPiece.isInSafeZone) {
          // Capture: send opponent piece home
          newPieces[index] = { ...otherPiece, position: -1, isInSafeZone: true }
        }
      })
    }
    
    newPieces[pieceIndex] = updatedPiece
    
    // Check for winner
    const playerPieces = newPieces.filter(p => p.playerId === updatedPiece.playerId)
    const allFinished = playerPieces.every(p => p.position === 58)
    
    let winner: string | undefined
    let gameStatus: 'active' | 'finished' = 'active'
    if (allFinished) {
      winner = updatedPiece.playerId
      gameStatus = 'finished'
    }
    
    // Determine next turn
    let nextPlayer = ludoState.currentPlayer
    let canRollDice = true
    
    // If rolled 6 or captured, get another turn
    const rolledSix = ludoState.diceValue === 6
    const captured = newPieces.some((p, i) => 
      i !== pieceIndex && 
      ludoState.pieces[i].position !== p.position && 
      p.position === -1
    )
    
    if (!rolledSix && !captured) {
      nextPlayer = getNextPlayer()
    }

    const newLudoState = {
      ...ludoState,
      pieces: newPieces,
      currentPlayer: nextPlayer,
      diceValue: null,
      canRollDice,
      winner,
      gameStatus
    }

    setLudoState(newLudoState)
    setSelectedPiece(null)

    onMove({
      type: 'LUDO_MOVE_PIECE',
      pieceId,
      newPosition: updatedPiece.position,
      captured,
      gameState: newLudoState
    })
  }, [ludoState, canMovePiece, getNextPlayer, getStartPosition])

  const getBoardPosition = (position: number): { x: number; y: number } => {
    // Ludo board is 15x15 grid, with cross-shaped path
    const cellSize = 30
    
    if (position < 0 || position > 51) {
      return { x: 0, y: 0 } // Home or finished positions handled separately
    }
    
    // Define the path around the board
    const path: { x: number; y: number }[] = []
    
    // Bottom row (left to right)
    for (let i = 0; i < 6; i++) path.push({ x: i, y: 8 })
    // Right column (bottom to top)
    for (let i = 7; i >= 0; i--) path.push({ x: 6, y: i })
    // Top row (left to right)
    for (let i = 7; i < 15; i++) path.push({ x: i, y: 0 })
    // Right column (top to bottom)
    for (let i = 1; i < 8; i++) path.push({ x: 14, y: i })
    // Top row (right to left)
    for (let i = 13; i >= 8; i--) path.push({ x: i, y: 8 })
    // Left column (top to bottom)
    for (let i = 9; i < 15; i++) path.push({ x: 8, y: i })
    // Bottom row (right to left)
    for (let i = 7; i >= 0; i--) path.push({ x: i, y: 14 })
    // Left column (bottom to top)
    for (let i = 13; i >= 9; i--) path.push({ x: 0, y: i })
    
    const pos = path[position] || { x: 7, y: 7 }
    return { x: pos.x * cellSize, y: pos.y * cellSize }
  }

  const getHomePosition = (color: 'red' | 'blue' | 'green' | 'yellow', pieceIndex: number): { x: number; y: number } => {
    const homeAreas = {
      red: { x: 30, y: 330, cols: 2 },
      blue: { x: 330, y: 30, cols: 2 },
      green: { x: 330, y: 330, cols: 2 },
      yellow: { x: 30, y: 30, cols: 2 }
    }
    
    const area = homeAreas[color]
    const row = Math.floor(pieceIndex / area.cols)
    const col = pieceIndex % area.cols
    
    return {
      x: area.x + col * 40,
      y: area.y + row * 40
    }
  }

  const getPieceColor = (color: 'red' | 'blue' | 'green' | 'yellow'): string => {
    const colors = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500'
    }
    return colors[color]
  }

  const currentPlayerId = gameState.players.find(p => p.id === gameState.currentPlayer)?.id
  const myPieces = ludoState.pieces.filter(p => p.playerId === currentPlayerId)
  const movablePieces = myPieces.filter(p => canMovePiece(p))

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-white">Ludo</h2>
        <div className="text-white">
          Status: <span className="capitalize text-yellow-400">{ludoState.gameStatus}</span>
        </div>
      </div>

      {/* Game Status */}
      <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4 w-full max-w-4xl">
        <div className="flex justify-between items-center text-white">
          <div>Current Player: <span className="text-purple-300 font-bold">
            {gameState.players.find(p => p.id === ludoState.currentPlayer)?.displayName}
          </span></div>
          {ludoState.diceValue && (
            <div>Last Roll: <span className="text-yellow-400 text-2xl">🎲 {ludoState.diceValue}</span></div>
          )}
          <div>Consecutive 6s: <span className="text-red-400">{ludoState.consecutiveSixes}</span></div>
        </div>
      </div>

      {/* Dice and Controls */}
      <div className="flex items-center space-x-6">
        <button
          className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center text-3xl transition-all ${
            ludoState.canRollDice 
              ? 'bg-purple-600 hover:bg-purple-700 border-purple-400 cursor-pointer transform hover:scale-105' 
              : 'bg-gray-600 border-gray-500 cursor-not-allowed opacity-50'
          }`}
          onClick={rollDice}
          disabled={!ludoState.canRollDice}
        >
          🎲
        </button>
        
        {ludoState.diceValue && (
          <div className="text-white text-center">
            <div className="text-4xl mb-2">🎲</div>
            <div className="text-2xl font-bold text-yellow-400">{ludoState.diceValue}</div>
          </div>
        )}
      </div>

      {/* Ludo Board */}
      <div className="relative bg-amber-100 border-4 border-amber-800 rounded-lg" style={{ width: '450px', height: '450px' }}>
        {/* Board Grid */}
        <svg width="450" height="450" className="absolute inset-0">
          {/* Draw board squares */}
          {Array.from({ length: 15 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => {
              const isPath = (row >= 6 && row <= 8) || (col >= 6 && col <= 8)
              const isSafe = (row === 6 && col === 1) || (row === 1 && col === 8) || 
                           (row === 8 && col === 13) || (row === 13 && col === 6)
              
              return (
                <rect
                  key={`${row}-${col}`}
                  x={col * 30}
                  y={row * 30}
                  width="30"
                  height="30"
                  fill={isSafe ? '#10b981' : isPath ? '#f3f4f6' : '#e5e7eb'}
                  stroke="#6b7280"
                  strokeWidth="1"
                />
              )
            })
          )}
          
          {/* Home areas */}
          <rect x="30" y="30" width="120" height="120" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <rect x="300" y="30" width="120" height="120" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <rect x="300" y="300" width="120" height="120" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <rect x="30" y="300" width="120" height="120" fill="#fecaca" stroke="#dc2626" strokeWidth="2" />
          
          {/* Center finish area */}
          <rect x="180" y="180" width="90" height="90" fill="#fbbf24" stroke="#d97706" strokeWidth="3" />
        </svg>

        {/* Pieces */}
        {ludoState.pieces.map((piece, index) => {
          let position: { x: number; y: number }
          
          if (piece.position === -1) {
            // Home position
            const homeIndex = ludoState.pieces.filter(p => 
              p.playerId === piece.playerId && p.position === -1
            ).indexOf(piece)
            position = getHomePosition(piece.color, homeIndex)
          } else if (piece.position === 58) {
            // Finished position
            position = { x: 210 + (index % 3) * 20, y: 210 + Math.floor(index / 3) * 20 }
          } else {
            // Board position
            position = getBoardPosition(piece.position)
          }
          
          const isSelected = selectedPiece === piece.id
          const isMovable = movablePieces.some(p => p.id === piece.id)
          
          return (
            <div
              key={piece.id}
              className={`absolute w-6 h-6 rounded-full border-2 border-white cursor-pointer transform transition-all ${
                getPieceColor(piece.color)
              } ${isSelected ? 'ring-4 ring-purple-400 scale-125' : ''} ${
                isMovable ? 'hover:scale-110 shadow-lg' : 'opacity-70'
              }`}
              style={{
                left: `${position.x + 12}px`,
                top: `${position.y + 12}px`,
                zIndex: isSelected ? 20 : 10
              }}
              onClick={() => {
                if (isMovable) {
                  if (selectedPiece === piece.id) {
                    movePiece(piece.id)
                  } else {
                    setSelectedPiece(piece.id)
                  }
                }
              }}
            />
          )
        })}
      </div>

      {/* Player Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
        {gameState.players.map(player => {
          const playerPieces = ludoState.pieces.filter(p => p.playerId === player.id)
          const homePieces = playerPieces.filter(p => p.position === -1).length
          const finishedPieces = playerPieces.filter(p => p.position === 58).length
          const color = ludoState.playerColors[player.id]
          
          return (
            <div key={player.id} className={`bg-black/20 border rounded-lg p-3 ${
              player.id === ludoState.currentPlayer ? 'border-purple-500' : 'border-gray-500'
            }`}>
              <div className="text-white text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className={`w-4 h-4 rounded-full ${getPieceColor(color || 'red')}`}></div>
                  <div className="font-semibold">{player.displayName}</div>
                </div>
                <div className="text-sm text-gray-300">
                  Home: {homePieces} | Finished: {finishedPieces}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      {ludoState.diceValue && movablePieces.length > 0 && (
        <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4 text-center">
          <div className="text-white">
            Click a highlighted piece to move it {ludoState.diceValue} spaces
          </div>
        </div>
      )}

      {/* Winner Display */}
      {ludoState.gameStatus === 'finished' && ludoState.winner && (
        <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 text-center">
          <h3 className="text-green-400 text-2xl font-bold">
            🎉 {gameState.players.find(p => p.id === ludoState.winner)?.displayName} Wins! 🎉
          </h3>
        </div>
      )}
    </div>
  )
}

export default LudoGame