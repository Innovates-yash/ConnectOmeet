import React, { useState, useEffect, useCallback } from 'react'
import { GameState } from '../../hooks/useGameState'

interface UnoGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface UnoCard {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild'
  value: string | number
  type: 'number' | 'action' | 'wild'
}

interface UnoGameState {
  deck: UnoCard[]
  discardPile: UnoCard[]
  playerHands: { [playerId: string]: UnoCard[] }
  currentPlayer: string
  direction: 1 | -1
  gameStatus: 'active' | 'finished'
  winner?: string
  drawCount: number
  currentColor?: 'red' | 'blue' | 'green' | 'yellow'
}

const UnoGame: React.FC<UnoGameProps> = ({ gameState, onMove }) => {
  const [unoState, setUnoState] = useState<UnoGameState>({
    deck: initializeDeck(),
    discardPile: [],
    playerHands: {},
    currentPlayer: gameState.players[0]?.id || '',
    direction: 1,
    gameStatus: 'active',
    drawCount: 0
  })

  const [selectedCard, setSelectedCard] = useState<UnoCard | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.uno) {
      setUnoState(prev => ({ ...prev, ...gameState.gameData.uno }))
    } else {
      // Initialize new game
      const deck = initializeDeck()
      const shuffledDeck = shuffleDeck([...deck])
      const playerHands: { [playerId: string]: UnoCard[] } = {}
      
      // Deal 7 cards to each player
      gameState.players.forEach(player => {
        playerHands[player.id] = shuffledDeck.splice(0, 7)
      })
      
      // Start discard pile
      const firstCard = shuffledDeck.pop()!
      const discardPile = [firstCard]
      
      setUnoState(prev => ({
        ...prev,
        deck: shuffledDeck,
        discardPile,
        playerHands,
        currentColor: firstCard.color !== 'wild' ? firstCard.color : 'red'
      }))
    }
  }, [gameState.gameData, gameState.players])

  const canPlayCard = useCallback((card: UnoCard): boolean => {
    const topCard = unoState.discardPile[unoState.discardPile.length - 1]
    if (!topCard) return false

    // Wild cards can always be played
    if (card.type === 'wild') return true

    // Match color or value
    return card.color === unoState.currentColor || 
           card.value === topCard.value ||
           (card.color === topCard.color && topCard.type !== 'wild')
  }, [unoState.discardPile, unoState.currentColor])

  const playCard = useCallback((card: UnoCard, chosenColor?: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!canPlayCard(card)) return

    const currentPlayerId = gameState.players.find(p => p.id === unoState.currentPlayer)?.id
    if (!currentPlayerId) return

    const newPlayerHands = { ...unoState.playerHands }
    const playerHand = [...newPlayerHands[currentPlayerId]]
    const cardIndex = playerHand.findIndex(c => c.color === card.color && c.value === card.value)
    
    if (cardIndex === -1) return

    // Remove card from hand
    playerHand.splice(cardIndex, 1)
    newPlayerHands[currentPlayerId] = playerHand

    // Add to discard pile
    const newDiscardPile = [...unoState.discardPile, card]
    
    let newDirection = unoState.direction
    let nextPlayerIndex = gameState.players.findIndex(p => p.id === unoState.currentPlayer)
    let drawCount = 0
    let newCurrentColor = card.color !== 'wild' ? card.color : (chosenColor || 'red')

    // Handle special cards
    if (card.type === 'action') {
      switch (card.value) {
        case 'skip':
          nextPlayerIndex += unoState.direction
          break
        case 'reverse':
          newDirection = unoState.direction * -1 as (1 | -1)
          if (gameState.players.length === 2) {
            nextPlayerIndex += newDirection
          }
          break
        case 'draw2':
          drawCount = 2
          nextPlayerIndex += unoState.direction
          break
      }
    } else if (card.type === 'wild') {
      if (card.value === 'draw4') {
        drawCount = 4
      }
      nextPlayerIndex += unoState.direction
    } else {
      nextPlayerIndex += unoState.direction
    }

    // Wrap around player index
    if (nextPlayerIndex >= gameState.players.length) {
      nextPlayerIndex = 0
    } else if (nextPlayerIndex < 0) {
      nextPlayerIndex = gameState.players.length - 1
    }

    const nextPlayer = gameState.players[nextPlayerIndex]?.id || unoState.currentPlayer

    // Check for winner
    let winner: string | undefined
    let gameStatus: 'active' | 'finished' = 'active'
    if (playerHand.length === 0) {
      winner = currentPlayerId
      gameStatus = 'finished'
    }

    const newUnoState = {
      ...unoState,
      playerHands: newPlayerHands,
      discardPile: newDiscardPile,
      currentPlayer: nextPlayer,
      direction: newDirection,
      drawCount,
      currentColor: newCurrentColor,
      winner,
      gameStatus
    }

    setUnoState(newUnoState)
    setSelectedCard(null)
    setShowColorPicker(false)

    // Send move to server
    onMove({
      type: 'UNO_PLAY_CARD',
      card,
      chosenColor,
      gameState: newUnoState
    })
  }, [unoState, gameState.players, canPlayCard, onMove])

  const drawCard = useCallback(() => {
    if (unoState.deck.length === 0) return

    const currentPlayerId = gameState.players.find(p => p.id === unoState.currentPlayer)?.id
    if (!currentPlayerId) return

    const newDeck = [...unoState.deck]
    const drawnCard = newDeck.pop()!
    
    const newPlayerHands = { ...unoState.playerHands }
    newPlayerHands[currentPlayerId] = [...newPlayerHands[currentPlayerId], drawnCard]

    // Move to next player
    let nextPlayerIndex = gameState.players.findIndex(p => p.id === unoState.currentPlayer)
    nextPlayerIndex += unoState.direction
    
    if (nextPlayerIndex >= gameState.players.length) {
      nextPlayerIndex = 0
    } else if (nextPlayerIndex < 0) {
      nextPlayerIndex = gameState.players.length - 1
    }

    const nextPlayer = gameState.players[nextPlayerIndex]?.id || unoState.currentPlayer

    const newUnoState = {
      ...unoState,
      deck: newDeck,
      playerHands: newPlayerHands,
      currentPlayer: nextPlayer
    }

    setUnoState(newUnoState)

    onMove({
      type: 'UNO_DRAW_CARD',
      gameState: newUnoState
    })
  }, [unoState, gameState.players, onMove])

  const handleCardClick = (card: UnoCard) => {
    if (card.type === 'wild') {
      setSelectedCard(card)
      setShowColorPicker(true)
    } else {
      playCard(card)
    }
  }

  const handleColorChoice = (color: 'red' | 'blue' | 'green' | 'yellow') => {
    if (selectedCard) {
      playCard(selectedCard, color)
    }
  }

  const getCardColor = (card: UnoCard): string => {
    const colors = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      wild: 'bg-gradient-to-r from-red-500 via-blue-500 to-green-500'
    }
    return colors[card.color]
  }

  const getCardSymbol = (card: UnoCard): string => {
    if (card.type === 'number') return card.value.toString()
    if (card.value === 'skip') return '⊘'
    if (card.value === 'reverse') return '↻'
    if (card.value === 'draw2') return '+2'
    if (card.value === 'wild') return '🌈'
    if (card.value === 'draw4') return '+4'
    return card.value.toString()
  }

  const currentPlayerId = gameState.players.find(p => p.id === gameState.currentPlayer)?.id
  const myHand = unoState.playerHands[currentPlayerId || ''] || []
  const topCard = unoState.discardPile[unoState.discardPile.length - 1]

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-white">UNO</h2>
        <div className="text-white">
          Status: <span className="capitalize text-yellow-400">{unoState.gameStatus}</span>
        </div>
      </div>

      {/* Game Status */}
      <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4 w-full max-w-4xl">
        <div className="flex justify-between items-center text-white">
          <div>Current Player: <span className="text-purple-300 font-bold">
            {gameState.players.find(p => p.id === unoState.currentPlayer)?.displayName}
          </span></div>
          <div>Direction: <span className="text-2xl">{unoState.direction === 1 ? '→' : '←'}</span></div>
          <div>Cards in Deck: <span className="text-green-400">{unoState.deck.length}</span></div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex items-center justify-center space-x-8">
        {/* Deck */}
        <div 
          className="w-24 h-36 bg-purple-800 border-2 border-purple-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
          onClick={drawCard}
        >
          <div className="text-white text-center">
            <div className="text-2xl">🎴</div>
            <div className="text-sm">Draw</div>
          </div>
        </div>

        {/* Current Card */}
        {topCard && (
          <div className={`w-24 h-36 ${getCardColor(topCard)} border-2 border-white rounded-lg flex items-center justify-center shadow-lg`}>
            <div className="text-white text-2xl font-bold">
              {getCardSymbol(topCard)}
            </div>
          </div>
        )}

        {/* Current Color Indicator */}
        {unoState.currentColor && (
          <div className="text-white text-center">
            <div>Current Color:</div>
            <div className={`w-8 h-8 rounded-full mx-auto mt-1 ${getCardColor({ color: unoState.currentColor, value: '', type: 'number' })}`}></div>
          </div>
        )}
      </div>

      {/* Player Hands Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
        {gameState.players.map(player => (
          <div key={player.id} className={`bg-black/20 border rounded-lg p-3 ${
            player.id === unoState.currentPlayer ? 'border-purple-500' : 'border-gray-500'
          }`}>
            <div className="text-white text-center">
              <div className="font-semibold">{player.displayName}</div>
              <div className="text-2xl text-yellow-400">
                {unoState.playerHands[player.id]?.length || 0}
              </div>
              <div className="text-sm text-gray-300">cards</div>
            </div>
          </div>
        ))}
      </div>

      {/* My Hand */}
      <div className="w-full max-w-4xl">
        <h3 className="text-white text-lg mb-3">Your Hand:</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {myHand.map((card, index) => (
            <div
              key={index}
              className={`w-16 h-24 ${getCardColor(card)} border-2 rounded-lg flex items-center justify-center cursor-pointer transform transition-all hover:scale-105 ${
                canPlayCard(card) ? 'border-green-400 hover:border-green-300' : 'border-gray-400 opacity-50'
              }`}
              onClick={() => canPlayCard(card) && handleCardClick(card)}
            >
              <div className="text-white text-lg font-bold">
                {getCardSymbol(card)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-purple-500 rounded-lg p-6">
            <h3 className="text-white text-xl mb-4 text-center">Choose Color</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['red', 'blue', 'green', 'yellow'] as const).map(color => (
                <button
                  key={color}
                  className={`w-16 h-16 rounded-lg ${getCardColor({ color, value: '', type: 'number' })} hover:scale-110 transition-transform`}
                  onClick={() => handleColorChoice(color)}
                >
                  <span className="text-white font-bold capitalize">{color}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Winner Display */}
      {unoState.gameStatus === 'finished' && unoState.winner && (
        <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 text-center">
          <h3 className="text-green-400 text-2xl font-bold">
            🎉 {gameState.players.find(p => p.id === unoState.winner)?.displayName} Wins! 🎉
          </h3>
        </div>
      )}
    </div>
  )
}

// Helper functions
function initializeDeck(): UnoCard[] {
  const deck: UnoCard[] = []
  const colors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow']
  
  // Number cards (0-9)
  colors.forEach(color => {
    // One 0 card per color
    deck.push({ color, value: 0, type: 'number' })
    
    // Two of each 1-9 per color
    for (let i = 1; i <= 9; i++) {
      deck.push({ color, value: i, type: 'number' })
      deck.push({ color, value: i, type: 'number' })
    }
    
    // Action cards (2 of each per color)
    deck.push({ color, value: 'skip', type: 'action' })
    deck.push({ color, value: 'skip', type: 'action' })
    deck.push({ color, value: 'reverse', type: 'action' })
    deck.push({ color, value: 'reverse', type: 'action' })
    deck.push({ color, value: 'draw2', type: 'action' })
    deck.push({ color, value: 'draw2', type: 'action' })
  })
  
  // Wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'wild', type: 'wild' })
    deck.push({ color: 'wild', value: 'draw4', type: 'wild' })
  }
  
  return deck
}

function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default UnoGame