import { Card, Suit, Rank, CardColor, MatchType, BoardSize } from '../types/game.types';

/**
 * Generate a deck of cards for the memory game
 */
export const generateGameCards = (boardSize: BoardSize, matchType: MatchType): Card[] => {
  const totalCards = getBoardDimensions(boardSize).total;
  const numPairs = totalCards / 2;
  
  const cards: Card[] = [];
  let cardId = 0;

  // Generate pairs based on match type
  for (let i = 0; i < numPairs; i++) {
    const baseCard = generateBaseCard(i, matchType);
    const pair = generateMatchingCard(baseCard, matchType);
    
    cards.push({ 
      ...baseCard, 
      id: `card-${cardId++}`,
      position: cards.length,
      isFlipped: false,
      isMatched: false
    });
    cards.push({ 
      ...pair, 
      id: `card-${cardId++}`,
      position: cards.length,
      isFlipped: false,
      isMatched: false
    });
  }

  // Shuffle the cards
  return shuffleArray(cards).map((card, index) => ({
    ...card,
    position: index
  }));
};

/**
 * Get board dimensions based on size
 */
export const getBoardDimensions = (boardSize: BoardSize) => {
  switch (boardSize) {
    case '4x4': return { rows: 4, cols: 4, total: 16 };
    case '4x6': return { rows: 4, cols: 6, total: 24 };
    case '6x6': return { rows: 6, cols: 6, total: 36 };
    default: return { rows: 4, cols: 4, total: 16 };
  }
};

/**
 * Check if two cards match based on match type
 */
export const cardsMatch = (card1: Card, card2: Card, matchType: MatchType): boolean => {
  switch (matchType) {
    case 'color':
      return card1.color === card2.color;
    case 'rank':
      return card1.rank === card2.rank;
    case 'suit':
      return card1.suit === card2.suit;
    default:
      return false;
  }
};

/**
 * Generate a base card for pairing
 */
const generateBaseCard = (index: number, matchType: MatchType): Omit<Card, 'id' | 'position' | 'isFlipped' | 'isMatched'> => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const suitIndex = index % suits.length;
  const rankIndex = Math.floor(index / suits.length) % ranks.length;
  
  const suit = suits[suitIndex];
  const rank = ranks[rankIndex];
  const color: CardColor = (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
  
  return { suit, rank, color };
};

/**
 * Generate a matching card based on match type
 */
const generateMatchingCard = (baseCard: Omit<Card, 'id' | 'position' | 'isFlipped' | 'isMatched'>, matchType: MatchType): Omit<Card, 'id' | 'position' | 'isFlipped' | 'isMatched'> => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  switch (matchType) {
    case 'color': {
      // Find a different suit of the same color
      const samColorSuits = suits.filter(s => getCardColor(s) === baseCard.color && s !== baseCard.suit);
      const newSuit = samColorSuits[Math.floor(Math.random() * samColorSuits.length)] || baseCard.suit;
      return { ...baseCard, suit: newSuit };
    }
    case 'rank': {
      // Same rank, different suit
      const differentSuits = suits.filter(s => s !== baseCard.suit);
      const newSuit = differentSuits[Math.floor(Math.random() * differentSuits.length)] || suits[0];
      return { 
        suit: newSuit, 
        rank: baseCard.rank, 
        color: getCardColor(newSuit) 
      };
    }
    case 'suit': {
      // Same suit, different rank
      const differentRanks = ranks.filter(r => r !== baseCard.rank);
      const newRank = differentRanks[Math.floor(Math.random() * differentRanks.length)] || ranks[0];
      return { 
        suit: baseCard.suit, 
        rank: newRank, 
        color: baseCard.color 
      };
    }
    default:
      return baseCard;
  }
};

/**
 * Get card color from suit
 */
const getCardColor = (suit: Suit): CardColor => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Reset flipped cards that aren't matched
 */
export const resetFlippedCards = (cards: Card[]): Card[] => {
  return cards.map(card => {
    if (card.isFlipped && !card.isMatched) {
      return { ...card, isFlipped: false };
    }
    return card;
  });
};

/**
 * Get card display symbol
 */
export const getCardSymbol = (suit: Suit): string => {
  const symbols = {
    hearts: '♥️',
    diamonds: '♦️',
    clubs: '♣️',
    spades: '♠️'
  };
  return symbols[suit];
};

/**
 * Get card display text
 */
export const getCardDisplayText = (card: Card): string => {
  return `${card.rank}${getCardSymbol(card.suit)}`;
};

/**
 * Validate card deck for game
 */
export const validateCardDeck = (cards: Card[], matchType: MatchType): boolean => {
  if (cards.length % 2 !== 0) return false;
  
  const pairs = [];
  for (let i = 0; i < cards.length; i += 2) {
    const card1 = cards[i];
    const card2 = cards[i + 1];
    
    if (!cardsMatch(card1, card2, matchType)) {
      return false;
    }
    
    pairs.push([card1, card2]);
  }
  
  return true;
};

/**
 * Get suit symbol for display
 */
export const getSuitSymbol = (suit: Suit): string => {
  return getCardSymbol(suit);
};

/**
 * Get CSS classes for card themes
 */
export const getCardThemeClasses = (theme: string) => {
  const themes = {
    classic: {
      card: 'bg-white border-gray-200',
      back: 'bg-blue-600',
      suit: {
        hearts: 'text-red-500',
        diamonds: 'text-red-500', 
        clubs: 'text-black',
        spades: 'text-black'
      }
    },
    modern: {
      card: 'bg-gray-50 border-gray-300',
      back: 'bg-gradient-to-br from-purple-500 to-blue-600',
      suit: {
        hearts: 'text-pink-500',
        diamonds: 'text-orange-500',
        clubs: 'text-gray-700',
        spades: 'text-gray-800'
      }
    },
    dark: {
      card: 'bg-gray-800 border-gray-600',
      back: 'bg-gradient-to-br from-gray-700 to-black',
      suit: {
        hearts: 'text-red-400',
        diamonds: 'text-red-400',
        clubs: 'text-gray-300',
        spades: 'text-gray-300'
      }
    }
  };
  
  return themes[theme as keyof typeof themes] || themes.classic;
};
