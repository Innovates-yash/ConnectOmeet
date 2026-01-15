import React, { useState, useEffect, useCallback } from 'react'
import { GameState } from '../../hooks/useGameState'

interface RummyGameProps {
  gameState: GameState
  onMove: (move: any) => void
}

interface RummyCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
  value: number
}

interface RummyMeld {
  type: 'set' | 'run'
  cards: RummyCard[]
}

interface RummyGameState {
  deck: RummyCard[]
  discardPile: RummyCard[]
  playerHands: { [playerId: string]: RummyCard[] }
  playerMelds: { [playerId: string]: RummyMeld[] }
  currentPlayer: string
  gameStatus: 'active' | 'finished'
  winner?: string
  scores: { [playerId: string]: number }
  gameCoins: { [playerId: string]: number }
  entryFee: number
}

const RummyGame: React.FC<RummyGameProps> = ({ gameState, onMove }) => {
  const [rummyState, setRummyState] = useState<RummyGameState>({
    deck: initializeRummyDeck(),
    discardPile: [],
    playerHands: {},
    playerMelds: {},
    currentPlayer: gameState.players[0]?.id || '',
    gameStatus: 'active',
    scores: {},
    gameCoins: {},
    entryFee: 10
  })

  const [selectedCards, setSelectedCards] = useState<RummyCard[]>([])
  // const [showMeldOptions, setShowMeldOptions] = useState(false) // Removed unused state

  // Initialize game state
  useEffect(() => {
    if (gameState.gameData?.rummy) {
      setRummyState(prev => ({ ...prev, ...gameState.gameData.rummy }))
    } else {
      // Initialize new game
      const deck = shuffleRummyDeck(initializeRummyDeck())
      const playerHands: { [playerId: string]: RummyCard[] } = {}
      const playerMelds: { [playerId: string]: RummyMeld[] } = {}
      const scores: { [playerId: string]: number } = {}
      const gameCoins: { [playerId: string]: number } = {}
      
      // Deal 10 cards to each player
      gameState.players.forEach(player => {
        playerHands[player.id] = deck.splice(0, 10)
        playerMelds[player.id] = []
        scores[player.id] = 0
        gameCoins[player.id] = 100 // Starting GameCoins
      })
      
      // Start discard pile
      const firstCard = deck.pop()!
      const discardPile = [firstCard]
      
      setRummyState(prev => ({
        ...prev,
        deck,
        discardPile,
        playerHands,
        playerMelds,
        scores,
        gameCoins
      }))
    }
  }, [gameState.gameData, gameState.players])

  const isValidSet = useCallback((cards: RummyCard[]): boolean => {
    if (cards.length < 3) return false
    
    // All cards must have same rank but different suits
    const rank = cards[0].rank
    const suits = new Set(cards.map(c => c.suit))
    
    return cards.every(c => c.rank === rank) && suits.size === cards.length
  }, [])

  const isValidRun = useCallback((cards: RummyCard[]): boolean => {
    if (cards.length < 3) return false
    
    // All cards must be same suit and consecutive ranks
    const suit = cards[0].suit
    if (!cards.every(c => c.suit === suit)) return false
    
    const sortedCards = [...cards].sort((a, b) => a.value - b.value)
    for (let i = 1; i < sortedCards.length; i++) {
      if (sortedCards[i].value !== sortedCards[i-1].value + 1) {
        return false
      }
    }
    
    return true
  }, [])

  const canFormMeld = useCallback((cards: RummyCard[]): 'set' | 'run' | null => {
    if (isValidSet(cards)) return 'set'
    if (isValidRun(cards)) return 'run'
    return null
  }, [isValidSet, isValidRun])

  const drawFromDeck = useCallback(() => {
    if (rummyState.deck.length === 0) return

    const currentPlayerId = gameState.players.find(p => p.id === rummyState.currentPlayer)?.id
    if (!currentPlayerId) return

    const newDeck = [...rummyState.deck]
    const drawnCard = newDeck.pop()!
    
    const newPlayerHands = { ...rummyState.playerHands }
    newPlayerHands[currentPlayerId] = [...newPlayerHands[currentPlayerId], drawnCard]

    const newRummyState = {
      ...rummyState,
      deck: newDeck,
      playerHands: newPlayerHands
    }

    setRummyState(newRummyState)

    onMove({
      type: 'RUMMY_DRAW_DECK',
      gameState: newRummyState
    })
  }, [rummyState, gameState.players, onMove])

  const drawFromDiscard = useCallback(() => {
    if (rummyState.discardPile.length === 0) return

    const currentPlayerId = gameState.players.find(p => p.id === rummyState.currentPlayer)?.id
    if (!currentPlayerId) return

    const newDiscardPile = [...rummyState.discardPile]
    const drawnCard = newDiscardPile.pop()!
    
    const newPlayerHands = { ...rummyState.playerHands }
    newPlayerHands[currentPlayerId] = [...newPlayerHands[currentPlayerId], drawnCard]

    const newRummyState = {
      ...rummyState,
      discardPile: newDiscardPile,
      playerHands: newPlayerHands
    }

    setRummyState(newRummyState)

    onMove({
      type: 'RUMMY_DRAW_DISCARD',
      gameState: newRummyState
    })
  }, [rummyState, gameState.players, onMove])

  const discardCard = useCallback((card: RummyCard) => {
    const currentPlayerId = gameState.players.find(p => p.id === rummyState.currentPlayer)?.id
    if (!currentPlayerId) return

    const newPlayerHands = { ...rummyState.playerHands }
    const playerHand = [...newPlayerHands[currentPlayerId]]
    const cardIndex = playerHand.findIndex(c => c.suit === card.suit && c.rank === card.rank)
    
    if (cardIndex === -1) return

    // Remove card from hand
    playerHand.splice(cardIndex, 1)
    newPlayerHands[currentPlayerId] = playerHand

    // Add to discard pile
    const newDiscardPile = [...rummyState.discardPile, card]
    
    // Move to next player
    let nextPlayerIndex = gameState.players.findIndex(p => p.id === rummyState.currentPlayer)
    nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length
    const nextPlayer = gameState.players[nextPlayerIndex]?.id || rummyState.currentPlayer

    // Check for winner (empty hand)
    let winner: string | undefined
    let gameStatus: 'active' | 'finished' = 'active'
    if (playerHand.length === 0) {
      winner = currentPlayerId
      gameStatus = 'finished'
    }

    const newRummyState = {
      ...rummyState,
      playerHands: newPlayerHands,
      discardPile: newDiscardPile,
      currentPlayer: nextPlayer,
      winner,
      gameStatus
    }

    setRummyState(newRummyState)

    onMove({
      type: 'RUMMY_DISCARD',
      card,
      gameState: newRummyState
    })
  }, [rummyState, gameState.players, onMove])

  const createMeld = useCallback((meldType: 'set' | 'run') => {
    const currentPlayerId = gameState.players.find(p => p.id === rummyState.currentPlayer)?.id
    if (!currentPlayerId || selectedCards.length < 3) return

    const meldValid = meldType === 'set' ? isValidSet(selectedCards) : isValidRun(selectedCards)
    if (!meldValid) return

    const newPlayerHands = { ...rummyState.playerHands }
    const newPlayerMelds = { ...rummyState.playerMelds }
    
    // Remove cards from hand
    const playerHand = [...newPlayerHands[currentPlayerId]]
    selectedCards.forEach(selectedCard => {
      const cardIndex = playerHand.findIndex(c => c.suit === selectedCard.suit && c.rank === selectedCard.rank)
      if (cardIndex !== -1) {
        playerHand.splice(cardIndex, 1)
      }
    })
    
    newPlayerHands[currentPlayerId] = playerHand
    
    // Add meld
    const newMeld: RummyMeld = { type: meldType, cards: selectedCards }
    newPlayerMelds[currentPlayerId] = [...newPlayerMelds[currentPlayerId], newMeld]

    const newRummyState = {
      ...rummyState,
      playerHands: newPlayerHands,
      playerMelds: newPlayerMelds
    }

    setRummyState(newRummyState)
    setSelectedCards([])
    // setShowMeldOptions(false) // Removed unused state

    onMove({
      type: 'RUMMY_CREATE_MELD',
      meld: newMeld,
      gameState: newRummyState
    })
  }, [rummyState, gameState.players, selectedCards, isValidSet, isValidRun, onMove])

  const toggleCardSelection = (card: RummyCard) => {
    const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank)
    
    if (isSelected) {
      setSelectedCards(prev => prev.filter(c => !(c.suit === card.suit && c.rank === card.rank)))
    } else {
      setSelectedCards(prev => [...prev, card])
    }
  }

  const getCardColor = (card: RummyCard): string => {
    return card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'
  }

  const getSuitSymbol = (suit: string): string => {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    }
    return symbols[suit as keyof typeof symbols] || suit
  }

  const calculateScore = (playerId: string): number => {
    const hand = rummyState.playerHands[playerId] || []
    return hand.reduce((sum, card) => sum + Math.min(card.value, 10), 0)
  }

  const currentPlayerId = gameState.players.find(p => p.id === gameState.currentPlayer)?.id
  const myHand = rummyState.playerHands[currentPlayerId || ''] || []
  const myMelds = rummyState.playerMelds[currentPlayerId || ''] || []
  const topDiscardCard = rummyState.discardPile[rummyState.discardPile.length - 1]
  const possibleMeld = selectedCards.length >= 3 ? canFormMeld(selectedCards) : null

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center justify-between w-full max-w-6xl">
        <h2 className="text-3xl font-bold text-white">Rummy</h2>
        <div className="text-white">
          Status: <span className="capitalize text-yellow-400">{rummyState.gameStatus}</span>
        </div>
      </div>

      {/* Game Status */}
      <div className="bg-black/20 border border-purple-500/30 rounded-lg p-4 w-full max-w-6xl">
        <div className="flex justify-between items-center text-white">
          <div>Current Player: <span className="text-purple-300 font-bold">
            {gameState.players.find(p => p.id === rummyState.currentPlayer)?.displayName}
          </span></div>
          <div>Entry Fee: <span className="text-yellow-400">{rummyState.entryFee} GameCoins</span></div>
          <div>Cards in Deck: <span className="text-green-400">{rummyState.deck.length}</span></div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex items-center justify-center space-x-8">
        {/* Deck */}
        <div 
          className="w-24 h-36 bg-blue-800 border-2 border-blue-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
          onClick={drawFromDeck}
        >
          <div className="text-white text-center">
            <div className="text-2xl">🎴</div>
            <div className="text-sm">Draw</div>
          </div>
        </div>

        {/* Discard Pile */}
        {topDiscardCard && (
          <div 
            className="w-24 h-36 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={drawFromDiscard}
          >
            <div className={`text-2xl ${getCardColor(topDiscardCard)}`}>
              {getSuitSymbol(topDiscardCard.suit)}
            </div>
            <div className="text-black font-bold">
              {topDiscardCard.rank}
            </div>
          </div>
        )}
      </div>

      {/* Player Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl">
        {gameState.players.map(player => (
          <div key={player.id} className={`bg-black/20 border rounded-lg p-3 ${
            player.id === rummyState.currentPlayer ? 'border-purple-500' : 'border-gray-500'
          }`}>
            <div className="text-white text-center">
              <div className="font-semibold">{player.displayName}</div>
              <div className="text-lg text-yellow-400">
                Score: {calculateScore(player.id)}
              </div>
              <div className="text-sm text-gray-300">
                Cards: {rummyState.playerHands[player.id]?.length || 0}
              </div>
              <div className="text-sm text-green-400">
                Melds: {rummyState.playerMelds[player.id]?.length || 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Melds */}
      {myMelds.length > 0 && (
        <div className="w-full max-w-6xl">
          <h3 className="text-white text-lg mb-3">Your Melds:</h3>
          <div className="space-y-2">
            {myMelds.map((meld, meldIndex) => (
              <div key={meldIndex} className="bg-green-600/20 border border-green-500 rounded-lg p-3">
                <div className="text-green-400 text-sm mb-2 capitalize">{meld.type}</div>
                <div className="flex space-x-2">
                  {meld.cards.map((card, cardIndex) => (
                    <div key={cardIndex} className="w-12 h-16 bg-white border rounded flex flex-col items-center justify-center">
                      <div className={`text-sm ${getCardColor(card)}`}>
                        {getSuitSymbol(card.suit)}
                      </div>
                      <div className="text-black text-xs font-bold">
                        {card.rank}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Cards Actions */}
      {selectedCards.length >= 3 && possibleMeld && (
        <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4">
          <div className="text-white text-center mb-3">
            Can form a <span className="text-purple-300 font-bold">{possibleMeld}</span>
          </div>
          <button
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            onClick={() => createMeld(possibleMeld)}
          >
            Create {possibleMeld}
          </button>
        </div>
      )}

      {/* My Hand */}
      <div className="w-full max-w-6xl">
        <h3 className="text-white text-lg mb-3">Your Hand:</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {myHand.map((card, index) => {
            const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank)
            return (
              <div
                key={index}
                className={`w-16 h-24 bg-white border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transform transition-all hover:scale-105 ${
                  isSelected ? 'border-purple-400 ring-2 ring-purple-300' : 'border-gray-300'
                }`}
                onClick={() => toggleCardSelection(card)}
                onDoubleClick={() => discardCard(card)}
              >
                <div className={`text-lg ${getCardColor(card)}`}>
                  {getSuitSymbol(card.suit)}
                </div>
                <div className="text-black text-sm font-bold">
                  {card.rank}
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-gray-400 text-sm text-center mt-2">
          Click to select, double-click to discard
        </div>
      </div>

      {/* Winner Display */}
      {rummyState.gameStatus === 'finished' && rummyState.winner && (
        <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 text-center">
          <h3 className="text-green-400 text-2xl font-bold">
            🎉 {gameState.players.find(p => p.id === rummyState.winner)?.displayName} Wins! 🎉
          </h3>
          <div className="text-white mt-2">
            GameCoins earned: {rummyState.entryFee * gameState.players.length}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function initializeRummyDeck(): RummyCard[] {
  const deck: RummyCard[] = []
  const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: ('A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K')[] = 
    ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  
  suits.forEach(suit => {
    ranks.forEach((rank, index) => {
      const value = rank === 'A' ? 1 : 
                   rank === 'J' || rank === 'Q' || rank === 'K' ? 10 : 
                   parseInt(rank) || (index + 1)
      
      deck.push({ suit, rank, value })
    })
  })
  
  return deck
}

function shuffleRummyDeck(deck: RummyCard[]): RummyCard[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default RummyGame