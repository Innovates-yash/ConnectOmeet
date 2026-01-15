import React, { useState, useEffect, useCallback } from 'react'
import { GameState } from '../../hooks/useGameState'

interface ChessGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface ChessPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
  color: 'white' | 'black'
  hasMoved?: boolean
}

interface ChessMove {
  from: { row: number; col: number }
  to: { row: number; col: number }
  piece: ChessPiece
  capturedPiece?: ChessPiece
  isEnPassant?: boolean
  isCastling?: boolean
  promotionPiece?: ChessPiece['type']
}

interface ChessGameState {
  board: (ChessPiece | null)[][]
  currentPlayer: 'white' | 'black'
  moveHistory: ChessMove[]
  gameStatus: 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw'
  timeRemaining: { white: number; black: number }
  selectedSquare: { row: number; col: number } | null
  possibleMoves: { row: number; col: number }[]
  lastMove?: ChessMove
}

const ChessGame: React.FC<ChessGameProps> = ({ gameState, onMove }) => {
  const [chessState, setChessState] = useState<ChessGameState>({
    board: initializeBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    gameStatus: 'active',
    timeRemaining: { white: 600, black: 600 }, // 10 minutes each
    selectedSquare: null,
    possibleMoves: [],
  })

  // Initialize chess state from game state
  useEffect(() => {
    if (gameState.gameData?.chess) {
      setChessState(prev => ({ ...prev, ...gameState.gameData.chess }))
    }
  }, [gameState.gameData])

  // Game timer
  useEffect(() => {
    if (chessState.gameStatus === 'active') {
      const timer = setInterval(() => {
        setChessState(prev => {
          const newTimeRemaining = { ...prev.timeRemaining }
          newTimeRemaining[prev.currentPlayer] -= 1
          
          // Check for time forfeit
          if (newTimeRemaining[prev.currentPlayer] <= 0) {
            const winner = prev.currentPlayer === 'white' ? 'black' : 'white'
            onMove({
              type: 'TIME_FORFEIT',
              winner,
              reason: 'Time expired'
            })
            return {
              ...prev,
              gameStatus: 'checkmate',
              timeRemaining: newTimeRemaining
            }
          }
          
          return { ...prev, timeRemaining: newTimeRemaining }
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [chessState.gameStatus, chessState.currentPlayer, onMove])

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (chessState.gameStatus !== 'active') return

    const piece = chessState.board[row][col]
    
    // If no square is selected
    if (!chessState.selectedSquare) {
      if (piece && piece.color === chessState.currentPlayer) {
        const moves = calculatePossibleMoves(chessState.board, row, col, chessState)
        setChessState(prev => ({
          ...prev,
          selectedSquare: { row, col },
          possibleMoves: moves
        }))
      }
      return
    }

    // If clicking the same square, deselect
    if (chessState.selectedSquare.row === row && chessState.selectedSquare.col === col) {
      setChessState(prev => ({
        ...prev,
        selectedSquare: null,
        possibleMoves: []
      }))
      return
    }

    // If clicking another piece of the same color, select it
    if (piece && piece.color === chessState.currentPlayer) {
      const moves = calculatePossibleMoves(chessState.board, row, col, chessState)
      setChessState(prev => ({
        ...prev,
        selectedSquare: { row, col },
        possibleMoves: moves
      }))
      return
    }

    // Try to make a move
    const isValidMove = chessState.possibleMoves.some(
      move => move.row === row && move.col === col
    )

    if (isValidMove) {
      makeMove(chessState.selectedSquare, { row, col })
    }

    // Clear selection
    setChessState(prev => ({
      ...prev,
      selectedSquare: null,
      possibleMoves: []
    }))
  }, [chessState])

  const makeMove = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    const piece = chessState.board[from.row][from.col]
    if (!piece) return

    const capturedPiece = chessState.board[to.row][to.col]
    
    // Create new board
    const newBoard = chessState.board.map(row => [...row])
    newBoard[to.row][to.col] = { ...piece, hasMoved: true }
    newBoard[from.row][from.col] = null

    // Handle special moves
    let isEnPassant = false
    let isCastling = false
    let promotionPiece: ChessPiece['type'] | undefined

    // En passant
    if (piece.type === 'pawn' && !capturedPiece && from.col !== to.col) {
      isEnPassant = true
      newBoard[from.row][to.col] = null // Remove captured pawn
    }

    // Castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      isCastling = true
      const rookFromCol = to.col > from.col ? 7 : 0
      const rookToCol = to.col > from.col ? 5 : 3
      const rook = newBoard[from.row][rookFromCol]
      if (rook) {
        newBoard[from.row][rookToCol] = { ...rook, hasMoved: true }
        newBoard[from.row][rookFromCol] = null
      }
    }

    // Pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      promotionPiece = 'queen' // Auto-promote to queen for simplicity
      newBoard[to.row][to.col] = { ...piece, type: 'queen', hasMoved: true }
    }

    const move: ChessMove = {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
      isEnPassant,
      isCastling,
      promotionPiece
    }

    // Check for game end conditions
    const nextPlayer: 'white' | 'black' = chessState.currentPlayer === 'white' ? 'black' : 'white'
    const isInCheck = isKingInCheck(newBoard, nextPlayer)
    const hasValidMoves = hasAnyValidMoves(newBoard, nextPlayer, { ...chessState, board: newBoard })

    let newGameStatus: ChessGameState['gameStatus'] = 'active'
    if (isInCheck && !hasValidMoves) {
      newGameStatus = 'checkmate'
    } else if (!isInCheck && !hasValidMoves) {
      newGameStatus = 'stalemate'
    } else if (isInCheck) {
      newGameStatus = 'check'
    }

    const newChessState = {
      ...chessState,
      board: newBoard,
      currentPlayer: nextPlayer,
      moveHistory: [...chessState.moveHistory, move],
      gameStatus: newGameStatus,
      lastMove: move
    }

    setChessState(newChessState)

    // Send move to server
    onMove({
      type: 'CHESS_MOVE',
      move,
      gameState: newChessState
    })
  }, [chessState, onMove])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPieceSymbol = (piece: ChessPiece): string => {
    const symbols = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    }
    return symbols[piece.color][piece.type]
  }

  const isSquareSelected = (row: number, col: number): boolean => {
    return chessState.selectedSquare?.row === row && chessState.selectedSquare?.col === col
  }

  const isSquarePossibleMove = (row: number, col: number): boolean => {
    return chessState.possibleMoves.some(move => move.row === row && move.col === col)
  }

  const isSquareLastMove = (row: number, col: number): boolean => {
    if (!chessState.lastMove) return false
    return (chessState.lastMove.from.row === row && chessState.lastMove.from.col === col) ||
           (chessState.lastMove.to.row === row && chessState.lastMove.to.col === col)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center justify-between w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-white">Chess</h2>
        <div className="text-white">
          Status: <span className="capitalize text-yellow-400">{chessState.gameStatus}</span>
        </div>
      </div>

      {/* Player timers */}
      <div className="flex justify-between w-full max-w-2xl">
        <div className={`p-3 rounded-lg ${chessState.currentPlayer === 'black' ? 'bg-purple-600' : 'bg-gray-600'}`}>
          <div className="text-white font-semibold">Black</div>
          <div className="text-xl font-mono text-white">
            {formatTime(chessState.timeRemaining.black)}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${chessState.currentPlayer === 'white' ? 'bg-purple-600' : 'bg-gray-600'}`}>
          <div className="text-white font-semibold">White</div>
          <div className="text-xl font-mono text-white">
            {formatTime(chessState.timeRemaining.white)}
          </div>
        </div>
      </div>

      {/* Chess board */}
      <div className="bg-amber-100 p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-8 gap-0 border-2 border-amber-800">
          {chessState.board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0
              const isSelected = isSquareSelected(rowIndex, colIndex)
              const isPossibleMove = isSquarePossibleMove(rowIndex, colIndex)
              const isLastMove = isSquareLastMove(rowIndex, colIndex)
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-12 h-12 flex items-center justify-center text-2xl cursor-pointer relative
                    ${isLight ? 'bg-amber-200' : 'bg-amber-600'}
                    ${isSelected ? 'ring-4 ring-blue-400' : ''}
                    ${isLastMove ? 'ring-2 ring-green-400' : ''}
                    hover:brightness-110 transition-all
                  `}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {piece && getPieceSymbol(piece)}
                  {isPossibleMove && (
                    <div className="absolute inset-0 bg-green-400 opacity-30 rounded-full m-1"></div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Current player indicator */}
      <div className="text-center text-white">
        <p className="text-lg">
          Current turn: <span className="font-bold capitalize text-purple-300">
            {chessState.currentPlayer}
          </span>
        </p>
        {chessState.gameStatus === 'check' && (
          <p className="text-red-400 font-bold">Check!</p>
        )}
        {chessState.gameStatus === 'checkmate' && (
          <p className="text-red-400 font-bold text-xl">
            Checkmate! {chessState.currentPlayer === 'white' ? 'Black' : 'White'} wins!
          </p>
        )}
        {chessState.gameStatus === 'stalemate' && (
          <p className="text-yellow-400 font-bold text-xl">Stalemate! It's a draw!</p>
        )}
      </div>

      {/* Move history */}
      <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4 max-w-2xl w-full">
        <h3 className="text-white font-semibold mb-2">Move History</h3>
        <div className="max-h-32 overflow-y-auto text-sm text-gray-300">
          {chessState.moveHistory.length === 0 ? (
            <p>No moves yet</p>
          ) : (
            chessState.moveHistory.map((move, index) => (
              <div key={index} className="flex justify-between">
                <span>{index + 1}.</span>
                <span>
                  {getPieceSymbol(move.piece)} {String.fromCharCode(97 + move.from.col)}{8 - move.from.row} → {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                  {move.capturedPiece && ` x${getPieceSymbol(move.capturedPiece)}`}
                  {move.isCastling && ' (Castling)'}
                  {move.isEnPassant && ' (En Passant)'}
                  {move.promotionPiece && ` =${getPieceSymbol({ type: move.promotionPiece, color: move.piece.color })}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function initializeBoard(): (ChessPiece | null)[][] {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null))
  
  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' }
    board[6][col] = { type: 'pawn', color: 'white' }
  }
  
  // Place other pieces
  const pieceOrder: ChessPiece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: pieceOrder[col], color: 'black' }
    board[7][col] = { type: pieceOrder[col], color: 'white' }
  }
  
  return board
}

function calculatePossibleMoves(
  board: (ChessPiece | null)[][],
  row: number,
  col: number,
  gameState: ChessGameState
): { row: number; col: number }[] {
  const piece = board[row][col]
  if (!piece) return []

  const moves: { row: number; col: number }[] = []

  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(board, row, col, piece.color, gameState))
      break
    case 'rook':
      moves.push(...getRookMoves(board, row, col, piece.color))
      break
    case 'knight':
      moves.push(...getKnightMoves(board, row, col, piece.color))
      break
    case 'bishop':
      moves.push(...getBishopMoves(board, row, col, piece.color))
      break
    case 'queen':
      moves.push(...getQueenMoves(board, row, col, piece.color))
      break
    case 'king':
      moves.push(...getKingMoves(board, row, col, piece.color, gameState))
      break
  }

  // Filter out moves that would put own king in check
  return moves.filter(move => {
    const testBoard = makeTestMove(board, { row, col }, move)
    return !isKingInCheck(testBoard, piece.color)
  })
}

function getPawnMoves(
  board: (ChessPiece | null)[][],
  row: number,
  col: number,
  color: 'white' | 'black',
  gameState: ChessGameState
): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = []
  const direction = color === 'white' ? -1 : 1
  const startRow = color === 'white' ? 6 : 1

  // Forward move
  if (isValidSquare(row + direction, col) && !board[row + direction][col]) {
    moves.push({ row: row + direction, col })
    
    // Double move from starting position
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col })
    }
  }

  // Captures
  for (const deltaCol of [-1, 1]) {
    const newRow = row + direction
    const newCol = col + deltaCol
    
    if (isValidSquare(newRow, newCol)) {
      const targetPiece = board[newRow][newCol]
      if (targetPiece && targetPiece.color !== color) {
        moves.push({ row: newRow, col: newCol })
      }
      
      // En passant
      const lastMove = gameState.lastMove
      if (lastMove && 
          lastMove.piece.type === 'pawn' &&
          Math.abs(lastMove.to.row - lastMove.from.row) === 2 &&
          lastMove.to.row === row &&
          lastMove.to.col === newCol) {
        moves.push({ row: newRow, col: newCol })
      }
    }
  }

  return moves
}

function getRookMoves(board: (ChessPiece | null)[][], row: number, col: number, color: 'white' | 'black'): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = []
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]

  for (const [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow
      const newCol = col + i * dCol
      
      if (!isValidSquare(newRow, newCol)) break
      
      const targetPiece = board[newRow][newCol]
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol })
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol })
        }
        break
      }
    }
  }

  return moves
}

function getKnightMoves(board: (ChessPiece | null)[][], row: number, col: number, color: 'white' | 'black'): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = []
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ]

  for (const [dRow, dCol] of knightMoves) {
    const newRow = row + dRow
    const newCol = col + dCol
    
    if (isValidSquare(newRow, newCol)) {
      const targetPiece = board[newRow][newCol]
      if (!targetPiece || targetPiece.color !== color) {
        moves.push({ row: newRow, col: newCol })
      }
    }
  }

  return moves
}

function getBishopMoves(board: (ChessPiece | null)[][], row: number, col: number, color: 'white' | 'black'): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = []
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]

  for (const [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow
      const newCol = col + i * dCol
      
      if (!isValidSquare(newRow, newCol)) break
      
      const targetPiece = board[newRow][newCol]
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol })
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol })
        }
        break
      }
    }
  }

  return moves
}

function getQueenMoves(board: (ChessPiece | null)[][], row: number, col: number, color: 'white' | 'black'): { row: number; col: number }[] {
  return [
    ...getRookMoves(board, row, col, color),
    ...getBishopMoves(board, row, col, color)
  ]
}

function getKingMoves(
  board: (ChessPiece | null)[][],
  row: number,
  col: number,
  color: 'white' | 'black',
  _chessGameState: ChessGameState
): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = []
  
  // Regular king moves
  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) continue
      
      const newRow = row + dRow
      const newCol = col + dCol
      
      if (isValidSquare(newRow, newCol)) {
        const targetPiece = board[newRow][newCol]
        if (!targetPiece || targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol })
        }
      }
    }
  }

  // Castling
  const king = board[row][col]
  if (king && !king.hasMoved && !isKingInCheck(board, color)) {
    // Kingside castling
    const kingsideRook = board[row][7]
    if (kingsideRook && !kingsideRook.hasMoved && 
        !board[row][5] && !board[row][6] &&
        !isSquareUnderAttack(board, row, 5, color) &&
        !isSquareUnderAttack(board, row, 6, color)) {
      moves.push({ row, col: 6 })
    }
    
    // Queenside castling
    const queensideRook = board[row][0]
    if (queensideRook && !queensideRook.hasMoved &&
        !board[row][1] && !board[row][2] && !board[row][3] &&
        !isSquareUnderAttack(board, row, 2, color) &&
        !isSquareUnderAttack(board, row, 3, color)) {
      moves.push({ row, col: 2 })
    }
  }

  return moves
}

function isValidSquare(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

function isKingInCheck(board: (ChessPiece | null)[][], color: 'white' | 'black'): boolean {
  // Find the king
  let kingRow = -1, kingCol = -1
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.type === 'king' && piece.color === color) {
        kingRow = row
        kingCol = col
        break
      }
    }
    if (kingRow !== -1) break
  }

  if (kingRow === -1) return false // King not found

  return isSquareUnderAttack(board, kingRow, kingCol, color)
}

function isSquareUnderAttack(board: (ChessPiece | null)[][], row: number, col: number, defendingColor: 'white' | 'black'): boolean {
  const attackingColor = defendingColor === 'white' ? 'black' : 'white'

  // Check all enemy pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === attackingColor) {
        if (canPieceAttackSquare(board, r, c, row, col)) {
          return true
        }
      }
    }
  }

  return false
}

function canPieceAttackSquare(board: (ChessPiece | null)[][], fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  const piece = board[fromRow][fromCol]
  if (!piece) return false

  const dRow = toRow - fromRow
  const dCol = toCol - fromCol

  switch (piece.type) {
    case 'pawn':
      const direction = piece.color === 'white' ? -1 : 1
      return dRow === direction && Math.abs(dCol) === 1
    
    case 'rook':
      return (dRow === 0 || dCol === 0) && isPathClear(board, fromRow, fromCol, toRow, toCol)
    
    case 'knight':
      return (Math.abs(dRow) === 2 && Math.abs(dCol) === 1) || (Math.abs(dRow) === 1 && Math.abs(dCol) === 2)
    
    case 'bishop':
      return Math.abs(dRow) === Math.abs(dCol) && isPathClear(board, fromRow, fromCol, toRow, toCol)
    
    case 'queen':
      return (dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol)) && isPathClear(board, fromRow, fromCol, toRow, toCol)
    
    case 'king':
      return Math.abs(dRow) <= 1 && Math.abs(dCol) <= 1
    
    default:
      return false
  }
}

function isPathClear(board: (ChessPiece | null)[][], fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
  const dRow = Math.sign(toRow - fromRow)
  const dCol = Math.sign(toCol - fromCol)
  
  let currentRow = fromRow + dRow
  let currentCol = fromCol + dCol
  
  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol]) return false
    currentRow += dRow
    currentCol += dCol
  }
  
  return true
}

function makeTestMove(board: (ChessPiece | null)[][], from: { row: number; col: number }, to: { row: number; col: number }): (ChessPiece | null)[][] {
  const testBoard = board.map(row => [...row])
  testBoard[to.row][to.col] = testBoard[from.row][from.col]
  testBoard[from.row][from.col] = null
  return testBoard
}

function hasAnyValidMoves(board: (ChessPiece | null)[][], color: 'white' | 'black', chessGameState: ChessGameState): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = calculatePossibleMoves(board, row, col, chessGameState)
        if (moves.length > 0) return true
      }
    }
  }
  return false
}

export default ChessGame