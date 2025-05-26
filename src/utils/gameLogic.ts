import { GameState, Player, Move, MatchType, GameStatus, BoardSize, AIDifficulty } from '../types/game.types';
import { generateGameCards, cardsMatch, resetFlippedCards } from './cardUtils';

/**
 * Initialize a new game state
 */
export const initializeGame = (
  gameMode: GameState['gameMode'],
  matchType: MatchType,
  boardSize: BoardSize,
  player1Name: string,
  player2Name?: string,
  aiDifficulty?: AIDifficulty,
  ai2Difficulty?: AIDifficulty
): GameState => {
  const cards = generateGameCards(boardSize, matchType);
    const players: Player[] = [
    {
      id: gameMode === 'ai-vs-ai' ? 'ai1' : 'player1',
      name: player1Name,
      type: gameMode === 'ai-vs-ai' ? 'ai' : 'human',
      score: 0,
      matches: [],
      isCurrentPlayer: true,
      aiDifficulty: gameMode === 'ai-vs-ai' ? aiDifficulty : undefined
    }
  ];

  if (gameMode === 'ai') {
    players.push({
      id: 'ai',
      name: `AI (${aiDifficulty})`,
      type: 'ai',
      score: 0,
      matches: [],
      isCurrentPlayer: false,
      aiDifficulty
    });
  } else if (gameMode === 'ai-vs-ai') {
    players.push({
      id: 'ai2',
      name: `AI 2 (${ai2Difficulty})`,
      type: 'ai',
      score: 0,
      matches: [],
      isCurrentPlayer: false,
      aiDifficulty: ai2Difficulty
    });
  } else if (gameMode === 'local-multiplayer') {
    players.push({
      id: 'player2',
      name: player2Name || 'Player 2',
      type: 'human',
      score: 0,
      matches: [],
      isCurrentPlayer: false
    });
  }
  return {
    gameMode,
    matchType,
    boardSize,
    currentPlayer: gameMode === 'ai-vs-ai' ? 'ai1' : 'player1',
    players,
    cards,
    flippedCards: [],
    matchedPairs: [],
    gameStatus: 'playing',
    turnStartTime: Date.now(),
    gameStartTime: Date.now(),
    moveHistory: [],settings: {
      soundEnabled: true,
      animationSpeed: 'normal',
      theme: 'dark',
      showTimer: true,
      hintsEnabled: gameMode === 'local-multiplayer',
      cardTheme: 'classic'
    }
  };
};

/**
 * Handle card flip action
 */
export const handleCardFlip = (
  gameState: GameState,
  cardIndex: number
): GameState => {
  const { cards, flippedCards } = gameState;
  
  // Validate move
  if (!canFlipCard(gameState, cardIndex)) {
    return gameState;
  }
  const newCards = [...cards];
  const newFlippedCards = [...flippedCards];
  
  // Additional safety check
  if (!newCards[cardIndex] || !newCards[cardIndex].id) {
    console.warn('Invalid card at index:', cardIndex, newCards[cardIndex]);
    return gameState;
  }
  
  // Flip the card
  newCards[cardIndex] = { ...newCards[cardIndex], isFlipped: true };
  newFlippedCards.push(newCards[cardIndex]);

  let newGameState: GameState = {
    ...gameState,
    cards: newCards,
    flippedCards: newFlippedCards
  };

  // Check if we have two flipped cards
  if (newFlippedCards.length === 2) {
    newGameState = processCardPair(newGameState);
  }

  return newGameState;
};

/**
 * Check if a card can be flipped
 */
export const canFlipCard = (gameState: GameState, cardIndex: number): boolean => {
  const { cards, flippedCards, gameStatus } = gameState;
  
  // Safety checks
  if (cardIndex < 0 || cardIndex >= cards.length) {
    return false;
  }
  
  const card = cards[cardIndex];
  
  // Ensure card exists and has required properties
  if (!card || !card.id) {
    return false;
  }

  return (
    gameStatus === 'playing' &&
    !card.isFlipped &&
    !card.isMatched &&
    flippedCards.length < 2
  );
};

/**
 * Process a pair of flipped cards
 */
const processCardPair = (gameState: GameState): GameState => {
  const { flippedCards, matchType, currentPlayer, players, moveHistory } = gameState;
  
  if (flippedCards.length !== 2) return gameState;

  const [card1, card2] = flippedCards;
  
  // Safety check: ensure both cards exist and have required properties
  if (!card1 || !card2 || !card1.id || !card2.id) {
    console.warn('Invalid cards in processCardPair:', { card1, card2 });
    return gameState;
  }
  
  const isMatch = cardsMatch(card1, card2, matchType);
  
  // Create move record
  const move: Move = {
    playerId: currentPlayer,
    cardIds: [card1.id, card2.id],
    timestamp: Date.now(),
    isMatch
  };

  let newCards = [...gameState.cards];
  let newPlayers = [...players];
  let newMatchedPairs = [...gameState.matchedPairs];  if (isMatch) {
    // Mark cards as matched AND keep them flipped
    console.log('MATCH FOUND! Marking cards as matched and flipped:', {
      card1: { id: card1.id?.slice(-4), wasFlipped: card1.isFlipped, wasMatched: card1.isMatched },
      card2: { id: card2.id?.slice(-4), wasFlipped: card2.isFlipped, wasMatched: card2.isMatched }
    });
    
    newCards = newCards.map(card => {
      // Safety check for card existence and properties
      if (!card || !card.id || !card1 || !card2 || !card1.id || !card2.id) {
        return card;
      }
      if (card.id === card1.id || card.id === card2.id) {
        console.log(`Marking card as matched: ${card.id.slice(-4)} (isMatched: true, isFlipped: true)`);
        return { ...card, isMatched: true, isFlipped: true }; // CRITICAL: Keep matched cards flipped!
      }
      return card;
    });

    // Update player score
    const playerIndex = players.findIndex(p => p.id === currentPlayer);
    if (playerIndex !== -1) {
      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        score: newPlayers[playerIndex].score + 1,
        matches: [...newPlayers[playerIndex].matches, [card1, card2]]
      };
    }    newMatchedPairs.push([card1, card2]);
  }  // Don't reset flipped cards here for mismatches - let the component handle the delay
  const newGameState: GameState = {
    ...gameState,
    cards: newCards,
    flippedCards: isMatch ? [] : flippedCards, // Keep flipped cards visible for mismatches
    players: newPlayers,
    matchedPairs: newMatchedPairs,
    moveHistory: [...moveHistory, move],
    // CRITICAL FIX: For AI vs AI mode, don't switch turns immediately on mismatch
    // The useGameLogic timeout handler will handle the turn switch after cards are reset
    currentPlayer: isMatch ? currentPlayer : 
      (gameState.gameMode === 'ai-vs-ai' ? currentPlayer : getNextPlayer(gameState)),
    turnStartTime: Date.now()
  };

  // Check if game is finished
  if (isGameFinished(newGameState)) {
    return { ...newGameState, gameStatus: 'finished' };
  }

  return newGameState;
};

/**
 * Get the next player
 */
export const getNextPlayer = (gameState: GameState): string => {
  const { players, currentPlayer } = gameState;
  const currentIndex = players.findIndex(p => p.id === currentPlayer);
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
};

/**
 * Check if the game is finished
 */
export const isGameFinished = (gameState: GameState): boolean => {
  return gameState.cards.every(card => card.isMatched);
};

/**
 * Get the winner(s) of the game
 */
export const getGameWinner = (gameState: GameState): Player | Player[] | null => {
  if (!isGameFinished(gameState)) return null;

  const { players } = gameState;
  const maxScore = Math.max(...players.map(p => p.score));
  const winners = players.filter(p => p.score === maxScore);

  return winners.length === 1 ? winners[0] : winners;
};

/**
 * Check if the game ended in a draw
 */
export const isGameDraw = (gameState: GameState): boolean => {
  if (!isGameFinished(gameState)) return false;
  
  const { players } = gameState;
  const maxScore = Math.max(...players.map(p => p.score));
  const winners = players.filter(p => p.score === maxScore);
  
  return winners.length > 1;
};

/**
 * Calculate game statistics
 */
export const calculateGameStats = (gameState: GameState) => {
  const { gameStartTime, moveHistory, players, cards } = gameState;
  const gameEndTime = Date.now();
  const gameDuration = gameStartTime ? gameEndTime - gameStartTime : 0;
  
  const totalMoves = moveHistory.length;
  const successfulMatches = moveHistory.filter(move => move.isMatch).length;
  const accuracy = totalMoves > 0 ? (successfulMatches / totalMoves) * 100 : 0;
  
  const humanPlayer = players.find(p => p.type === 'human');
  const aiPlayer = players.find(p => p.type === 'ai');
  
  return {
    gameDuration,
    totalMoves,
    accuracy: Math.round(accuracy),
    humanScore: humanPlayer?.score || 0,
    aiScore: aiPlayer?.score || 0,
    totalPairs: cards.length / 2,
    isPerfectGame: accuracy === 100 && totalMoves === cards.length / 2
  };
};

/**
 * Reset flipped cards with delay
 */
export const resetFlippedCardsWithDelay = (
  gameState: GameState,
  delay: number = 1000
): Promise<GameState> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newCards = resetFlippedCards(gameState.cards);
      resolve({
        ...gameState,
        cards: newCards,
        flippedCards: []
      });
    }, delay);
  });
};

/**
 * Pause/Resume game
 */
export const toggleGamePause = (gameState: GameState): GameState => {
  const newStatus: GameStatus = gameState.gameStatus === 'paused' ? 'playing' : 'paused';
  
  return {
    ...gameState,
    gameStatus: newStatus,
    turnStartTime: newStatus === 'playing' ? Date.now() : gameState.turnStartTime
  };
};

/**
 * Get hint for current player (easy mode only)
 */
export const getHint = (gameState: GameState): { card1: number; card2: number } | null => {
  if (!gameState.settings.hintsEnabled) return null;

  const { cards, matchType } = gameState;
  const unmatched = cards.filter(card => !card.isMatched && !card.isFlipped);
  
  // Find a valid pair
  for (let i = 0; i < unmatched.length; i++) {
    for (let j = i + 1; j < unmatched.length; j++) {
      if (cardsMatch(unmatched[i], unmatched[j], matchType)) {
        return {
          card1: unmatched[i].position,
          card2: unmatched[j].position
        };
      }
    }
  }

  return null;
};

/**
 * Validate game state integrity
 */
export const validateGameState = (gameState: GameState): boolean => {
  const { cards, players, flippedCards } = gameState;
  
  // Check basic constraints
  if (cards.length % 2 !== 0) return false;
  if (players.length < 1 || players.length > 2) return false;
  if (flippedCards.length > 2) return false;
  
  // Check card consistency
  const flippedCount = cards.filter(card => card.isFlipped).length;
  const matchedCount = cards.filter(card => card.isMatched).length;
  
  if (flippedCount < flippedCards.length) return false;
  if (matchedCount % 2 !== 0) return false;
  
  // Check player scores
  const totalMatches = matchedCount / 2;
  const playerScoreSum = players.reduce((sum, player) => sum + player.score, 0);
  
  if (playerScoreSum !== totalMatches) return false;
  
  return true;
};

/**
 * Create a safe copy of game state (for AI processing)
 */
export const createGameStateCopy = (gameState: GameState): GameState => {
  return JSON.parse(JSON.stringify(gameState));
};

/**
 * Get available moves for current player
 */
export const getAvailableMoves = (gameState: GameState): number[] => {
  return gameState.cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => !card.isFlipped && !card.isMatched)
    .map(({ index }) => index);
};

/**
 * Apply AI move to game state
 */
export const applyAIMove = async (
  gameState: GameState,
  cardIndices: [number, number]
): Promise<GameState> => {
  let newState = gameState;
  
  // Flip first card
  newState = handleCardFlip(newState, cardIndices[0]);
  
  // Small delay between flips for visual effect
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Flip second card
  newState = handleCardFlip(newState, cardIndices[1]);
  
  return newState;
};

/**
 * Calculate turn time remaining
 */
export const getTurnTimeRemaining = (gameState: GameState): number => {
  const { turnStartTime, settings } = gameState;
  
  if (!settings.turnTimeLimit || !turnStartTime) return 0;
  
  const elapsed = Date.now() - turnStartTime;
  const remaining = (settings.turnTimeLimit * 1000) - elapsed;
  
  return Math.max(0, Math.floor(remaining / 1000));
};
