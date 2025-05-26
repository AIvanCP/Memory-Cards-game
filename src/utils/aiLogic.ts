import { Card, AIDifficulty, MatchType, Move, AIMemory, GAME_CONSTANTS } from '../types/game.types';
import { cardsMatch } from './cardUtils';

/**
 * AI Player class that handles different difficulty levels
 */
export class AIPlayer {
  private memory: AIMemory;
  private gameHistory: Move[] = [];

  constructor(difficulty: AIDifficulty) {
    this.memory = {
      knownCards: new Map(),
      knownPairs: [],
      playerPatterns: [],
      lastPlayerMoves: [],
      difficulty
    };  }

  /**
   * Main AI decision making function - BULLETPROOF VERSION
   */
  async makeMove(cards: Card[], matchType: MatchType, playerMoves: Move[]): Promise<[number, number]> {
    console.log('AI makeMove BULLETPROOF VERSION starting...');
    
    // STEP 1: Complete state reset and validation
    if (!Array.isArray(cards) || cards.length === 0) {
      console.error('AI: Invalid cards array provided');
      return [0, 1];
    }

    // STEP 2: AGGRESSIVE memory cleanup - remove ALL traces of matched cards
    this.purgeMatchedCardsFromMemory(cards);

    // STEP 3: Find ALL currently available cards with strict validation
    const availableIndices = this.findStrictlyAvailableCards(cards);
    
    console.log('AI available cards after strict validation:', {
      total: cards.length,
      available: availableIndices.length,
      matched: cards.filter(c => c?.isMatched === true).length,
      flipped: cards.filter(c => c?.isFlipped === true).length
    });

    // STEP 4: Emergency exit if not enough cards
    if (availableIndices.length < 2) {
      console.error('AI: Insufficient available cards!', availableIndices.length);
      return this.forceEmergencyMove(cards);
    }

    // STEP 5: Update memory safely
    this.updateMemory(cards, playerMoves);
    
    // STEP 6: Add reaction delay
    const delay = this.getReactionDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // STEP 7: Calculate move with multiple fallbacks
    let selectedMove = this.calculateSafeMove(cards, matchType, availableIndices);
    
    // STEP 8: Final bulletproof validation
    selectedMove = this.validateAndCorrectMove(cards, selectedMove, availableIndices);
    
    console.log('AI final move selection:', {
      move: selectedMove,
      card1: { id: cards[selectedMove[0]]?.id?.slice(-4), isFlipped: cards[selectedMove[0]]?.isFlipped, isMatched: cards[selectedMove[0]]?.isMatched },
      card2: { id: cards[selectedMove[1]]?.id?.slice(-4), isFlipped: cards[selectedMove[1]]?.isFlipped, isMatched: cards[selectedMove[1]]?.isMatched }
    });
    
    return selectedMove;
  }

  /**
   * Purge all matched cards from AI memory
   */
  private purgeMatchedCardsFromMemory(cards: Card[]): void {
    console.log('AI: Starting aggressive memory cleanup...');
    
    const matchedIndices = new Set<number>();
    
    // Find all matched cards
    cards.forEach((card, index) => {
      if (card?.isMatched === true) {
        matchedIndices.add(index);
        this.memory.knownCards.delete(index);
      }
    });
    
    // Remove any pairs involving matched cards
    const originalPairs = this.memory.knownPairs.length;
    this.memory.knownPairs = this.memory.knownPairs.filter(([i1, i2]) => 
      !matchedIndices.has(i1) && !matchedIndices.has(i2)
    );
    
    console.log(`AI memory cleanup: removed ${matchedIndices.size} matched cards, ${originalPairs - this.memory.knownPairs.length} pairs`);
  }

  /**
   * Find all strictly available cards (unflipped and unmatched)
   */
  private findStrictlyAvailableCards(cards: Card[]): number[] {
    const available: number[] = [];
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      // Strict validation
      if (card && 
          typeof card === 'object' &&
          card.id && 
          typeof card.id === 'string' &&
          typeof card.isFlipped === 'boolean' &&
          typeof card.isMatched === 'boolean' &&
          card.isFlipped === false &&
          card.isMatched === false) {
        available.push(i);
      }
    }
    
    return available;
  }

  /**
   * Calculate move with multiple fallback strategies
   */
  private calculateSafeMove(cards: Card[], matchType: MatchType, availableIndices: number[]): [number, number] {
    console.log(`AI calculating safe move with ${availableIndices.length} available cards`);
    
    const optimalPlayRate = GAME_CONSTANTS.AI_OPTIMAL_PLAY_RATES[this.memory.difficulty];
    
    // Try optimal strategies based on difficulty
    if (Math.random() < optimalPlayRate) {
      // Strategy 1: Known match
      const knownMatch = this.findSafeKnownMatch(cards, matchType, availableIndices);
      if (knownMatch) {
        console.log('AI using known match strategy');
        return knownMatch;
      }
      
      // Strategy 2: Strategic/blocking move for higher difficulties
      if (this.memory.difficulty === 'hard' || this.memory.difficulty === 'expert') {
        const strategicMove = this.findSafeStrategicMove(availableIndices);
        if (strategicMove) {
          console.log('AI using strategic move');
          return strategicMove;
        }
      }
      
      // Strategy 3: Inferred match for medium+
      if (this.memory.difficulty !== 'easy') {
        const inferredMatch = this.findSafeInferredMatch(cards, matchType, availableIndices);
        if (inferredMatch) {
          console.log('AI using inferred match');
          return inferredMatch;
        }
      }
    }
    
    // Default: Safe random move
    return this.makeSafeRandomMove(availableIndices);
  }

  /**
   * Find known match with safety checks
   */
  private findSafeKnownMatch(cards: Card[], matchType: MatchType, availableIndices: number[]): [number, number] | null {
    const availableSet = new Set(availableIndices);
    
    for (const [index1, index2] of this.memory.knownPairs) {
      if (availableSet.has(index1) && availableSet.has(index2)) {
        const card1 = cards[index1];
        const card2 = cards[index2];
        
        if (card1 && card2 && cardsMatch(card1, card2, matchType)) {
          return [index1, index2];
        }
      }
    }
    
    return null;
  }
  /**
   * Find strategic move safely - Enhanced for expert AI
   */
  private findSafeStrategicMove(availableIndices: number[]): [number, number] | null {
    if (availableIndices.length < 2) return null;
    
    // Expert AI: Use advanced strategies
    if (this.memory.difficulty === 'expert') {
      // Strategy 1: Try to pick cards that are unlikely to help the opponent
      const cards = availableIndices.map(idx => ({ index: idx, knownInMemory: this.memory.knownCards.has(idx) }));
      
      // Prefer unknown cards to gather new information
      const unknownCards = cards.filter(card => !card.knownInMemory);
      if (unknownCards.length >= 2) {
        const shuffled = [...unknownCards];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        console.log('Expert AI: Selecting unknown cards for information gathering');
        return [shuffled[0].index, shuffled[1].index];
      }
    }
    
    // Hard AI: Slightly more strategic than random
    if (this.memory.difficulty === 'hard') {
      // Prefer cards not in known pairs
      const knownPairIndices = new Set(this.memory.knownPairs.flat());
      const nonPairCards = availableIndices.filter(idx => !knownPairIndices.has(idx));
      
      if (nonPairCards.length >= 2) {
        const shuffled = [...nonPairCards];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        console.log('Hard AI: Avoiding known pair locations');
        return [shuffled[0], shuffled[1]];
      }
    }
    
    // Fallback: Randomized selection
    const shuffled = [...availableIndices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return [shuffled[0], shuffled[1]];
  }
  /**
   * Find inferred match safely - Enhanced for different difficulty levels
   */
  private findSafeInferredMatch(cards: Card[], matchType: MatchType, availableIndices: number[]): [number, number] | null {
    const availableSet = new Set(availableIndices);
    const knownCards = Array.from(this.memory.knownCards.entries());
    
    // Expert AI: Use sophisticated pattern recognition
    if (this.memory.difficulty === 'expert') {
      // First, try to find guaranteed matches based on complete knowledge
      for (const [knownIndex, knownCard] of knownCards) {
        if (!availableSet.has(knownIndex) || !knownCard?.id) continue;
        
        for (const otherIndex of availableIndices) {
          if (knownIndex === otherIndex) continue;
          
          const otherCard = cards[otherIndex];
          if (!otherCard) continue;
          
          // Expert AI has near-perfect memory and matching
          let matches = false;
          switch (matchType) {
            case 'color': matches = knownCard.color === otherCard.color; break;
            case 'rank': matches = knownCard.rank === otherCard.rank; break;
            case 'suit': matches = knownCard.suit === otherCard.suit; break;
          }
          
          if (matches) {
            console.log('Expert AI: Found inferred match with high confidence');
            return [knownIndex, otherIndex];
          }
        }
      }
      
      // Expert AI: Try partial matching with other known cards
      for (const [knownIndex1, knownCard1] of knownCards) {
        if (!availableSet.has(knownIndex1) || !knownCard1?.id) continue;
        
        for (const [knownIndex2, knownCard2] of knownCards) {
          if (knownIndex1 >= knownIndex2 || !availableSet.has(knownIndex2) || !knownCard2?.id) continue;
          
          let matches = false;
          switch (matchType) {
            case 'color': matches = knownCard1.color === knownCard2.color; break;
            case 'rank': matches = knownCard1.rank === knownCard2.rank; break;
            case 'suit': matches = knownCard1.suit === knownCard2.suit; break;
          }
          
          if (matches) {
            console.log('Expert AI: Found known pair match');
            return [knownIndex1, knownIndex2];
          }
        }
      }
    }
    
    // Medium/Hard AI: Less sophisticated matching
    const memoryAccuracy = this.memory.difficulty === 'hard' ? 0.85 : 0.6;
    
    for (const [knownIndex, knownCard] of knownCards) {
      if (!availableSet.has(knownIndex) || !knownCard?.id) continue;
      
      // Only try if AI "remembers" accurately
      if (Math.random() > memoryAccuracy) continue;
      
      for (const otherIndex of availableIndices) {
        if (knownIndex === otherIndex) continue;
        
        const otherCard = cards[otherIndex];
        if (!otherCard) continue;
        
        let matches = false;
        switch (matchType) {
          case 'color': matches = knownCard.color === otherCard.color; break;
          case 'rank': matches = knownCard.rank === otherCard.rank; break;
          case 'suit': matches = knownCard.suit === otherCard.suit; break;
        }
        
        if (matches) {
          console.log(`${this.memory.difficulty} AI: Found inferred match`);
          return [knownIndex, otherIndex];
        }
      }
    }
    
    return null;
  }

  /**
   * Make safe random move
   */
  private makeSafeRandomMove(availableIndices: number[]): [number, number] {
    console.log(`AI making safe random move from ${availableIndices.length} available cards`);
    
    // Shuffle available indices
    const shuffled = [...availableIndices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return [shuffled[0], shuffled[1]];
  }
  /**
   * Validate and correct move if necessary
   */
  private validateAndCorrectMove(cards: Card[], move: [number, number], availableIndices: number[]): [number, number] {
    const [index1, index2] = move;
    
    // ULTRA-CRITICAL: Check if either card is matched
    const card1 = cards[index1];
    const card2 = cards[index2];
    
    if (card1?.isMatched === true || card2?.isMatched === true) {
      console.error('CRITICAL BUG DETECTED: AI tried to select matched card(s)!', {
        move,
        card1: { id: card1?.id?.slice(-4), isMatched: card1?.isMatched, isFlipped: card1?.isFlipped },
        card2: { id: card2?.id?.slice(-4), isMatched: card2?.isMatched, isFlipped: card2?.isFlipped },
        availableCards: availableIndices.length
      });
      
      // Force correction
      if (availableIndices.length >= 2) {
        console.log('Forcing correction to first two available cards:', [availableIndices[0], availableIndices[1]]);
        return [availableIndices[0], availableIndices[1]];
      }
      
      return this.forceEmergencyMove(cards);
    }
    
    // Check if move is valid
    if (this.isValidMoveStrict(cards, move)) {
      return move;
    }
    
    console.warn('AI move failed validation, correcting...', move);
    
    // Return first two available indices as fallback
    if (availableIndices.length >= 2) {
      return [availableIndices[0], availableIndices[1]];
    }
    
    // Emergency fallback
    return this.forceEmergencyMove(cards);
  }

  /**
   * Strict move validation
   */
  private isValidMoveStrict(cards: Card[], move: [number, number]): boolean {
    const [index1, index2] = move;
    
    if (index1 < 0 || index1 >= cards.length || index2 < 0 || index2 >= cards.length) return false;
    if (index1 === index2) return false;
    
    const card1 = cards[index1];
    const card2 = cards[index2];
    
    if (!card1 || !card2 || !card1.id || !card2.id) return false;
    if (typeof card1.isFlipped !== 'boolean' || typeof card1.isMatched !== 'boolean') return false;
    if (typeof card2.isFlipped !== 'boolean' || typeof card2.isMatched !== 'boolean') return false;
    if (card1.isFlipped === true || card1.isMatched === true) return false;
    if (card2.isFlipped === true || card2.isMatched === true) return false;
    
    return true;
  }

  /**
   * Force emergency move as last resort
   */
  private forceEmergencyMove(cards: Card[]): [number, number] {
    console.error('AI EMERGENCY: Forcing emergency move');
    
    // Find ANY two cards that exist
    for (let i = 0; i < cards.length; i++) {
      if (cards[i]?.id) {
        for (let j = i + 1; j < cards.length; j++) {
          if (cards[j]?.id) {
            console.warn('Emergency move:', [i, j]);
            return [i, j];
          }
        }
      }
    }
    
    return [0, Math.min(1, cards.length - 1)];
  }/**
   * Update AI memory with new card information
   */  private updateMemory(cards: Card[], recentMoves: Move[]): void {
    const memoryLimit = GAME_CONSTANTS.AI_MEMORY_LIMITS[this.memory.difficulty];
    const difficulty = this.memory.difficulty;
      // Log memory update for debugging
    console.log(`AI (${difficulty}) updating memory - current known cards: ${this.memory.knownCards.size}`);
    
    // CRITICAL FIX: First, remove ALL matched cards from memory to prevent AI from selecting them
    const matchedIndices = new Set<number>();
    cards.forEach((card, index) => {
      if (card && card.isMatched === true) {
        matchedIndices.add(index);
        this.memory.knownCards.delete(index);
      }
    });
    
    // Process every card in the game
    cards.forEach((card, index) => {
      // Enhanced safety check: ensure card exists, has required properties, and is a valid object
      if (card && 
          typeof card === 'object' && 
          card.id && 
          typeof card.id === 'string' && 
          typeof card.isFlipped === 'boolean' && 
          typeof card.isMatched === 'boolean') {
        
        if (card.isMatched) {
          // Remove matched cards from potential move memory
          this.memory.knownCards.delete(index);
        } else if (card.isFlipped) {
          // Add flipped cards to memory - even expert AI can sometimes forget based on difficulty
          const shouldRemember = Math.random() < this.getMemoryReliability();
          if (shouldRemember) {
            this.memory.knownCards.set(index, { ...card }); // Make a copy to avoid reference issues
          }
        } else if (!card.isFlipped && !card.isMatched) {
          // IMPORTANT: If card is no longer flipped but was in memory, we should still remember it
          // This is key for AI to remember cards that were revealed but are now face-down again
          const wasInMemory = this.memory.knownCards.has(index);
          if (wasInMemory) {
            // Keep the memory but update the card state to reflect it's now face-down
            const rememberedCard = this.memory.knownCards.get(index);
            if (rememberedCard) {
              // Update the memory with current card info but preserve identity
              this.memory.knownCards.set(index, {
                ...card,
                // Preserve the card identity from when it was revealed
                color: rememberedCard.color,
                rank: rememberedCard.rank,
                suit: rememberedCard.suit
              });
            }
          }
        }
      } else if (card && !card.id) {
        console.warn(`Card at index ${index} missing ID property:`, card);
      }
    });
      // Clean up known pairs - remove any pairs that involve matched cards
    this.memory.knownPairs = this.memory.knownPairs.filter(([index1, index2]) => {
      const card1 = cards[index1];
      const card2 = cards[index2];
      return card1 && card2 && !card1.isMatched && !card2.isMatched;
    });
    
    // Update memory based on recent moves - learn from player's moves
    recentMoves.forEach(move => {
      if (move.isMatch && move.cardIds.length === 2) {
        // Learn from successful matches
        const matchType = this.determineMatchType(move.cardIds[0], move.cardIds[1], cards);
        if (matchType) {
          // AI becomes slightly better at recognizing this pattern
          console.log(`AI learning from match with ${matchType} pattern`);
        }
      }
    });
    
    // Limit memory based on difficulty
    if (this.memory.knownCards.size > memoryLimit) {
      const entries = Array.from(this.memory.knownCards.entries());
      // Easy AI forgets oldest cards, Expert AI forgets random cards
      let keepEntries;
      
      if (this.memory.difficulty === 'easy' || this.memory.difficulty === 'medium') {
        // Forget oldest memories first (more predictable forgetting)
        keepEntries = entries.slice(-memoryLimit);
      } else {
        // Hard/Expert: More selective forgetting (keeps some old, forgets some new)
        keepEntries = [];
        // Keep all paired cards first
        const pairedIndices = new Set(this.memory.knownPairs.flat());
        
        // First add all cards that are part of known pairs
        entries.forEach(entry => {
          if (pairedIndices.has(entry[0]) && keepEntries.length < memoryLimit) {
            keepEntries.push(entry);
          }
        });
        
        // Fill the rest randomly
        const remainingEntries = entries.filter(entry => !pairedIndices.has(entry[0]));
        while (keepEntries.length < memoryLimit && remainingEntries.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingEntries.length);
          keepEntries.push(remainingEntries[randomIndex]);
          remainingEntries.splice(randomIndex, 1);
        }
      }
      
      this.memory.knownCards = new Map(keepEntries);
    }
    
    // Update known pairs
    this.updateKnownPairs(cards);
    
    // Store recent player moves for pattern analysis
    this.memory.lastPlayerMoves = recentMoves.slice(-5);
  }
  /**
   * Update known pairs in memory
   */
  private updateKnownPairs(cards: Card[]): void {
    const knownCardEntries = Array.from(this.memory.knownCards.entries());
    
    for (let i = 0; i < knownCardEntries.length; i++) {
      for (let j = i + 1; j < knownCardEntries.length; j++) {
        const [index1, card1] = knownCardEntries[i];
        const [index2, card2] = knownCardEntries[j];
        
        // Safety check: ensure cards exist and have required properties
        if (!card1 || !card2 || !card1.id || !card2.id) {
          continue;
        }
        
        if (cardsMatch(card1, card2, 'color') || cardsMatch(card1, card2, 'rank') || cardsMatch(card1, card2, 'suit')) {
          const pairExists = this.memory.knownPairs.some(
            pair => (pair[0] === index1 && pair[1] === index2) || (pair[0] === index2 && pair[1] === index1)
          );
          
          if (!pairExists) {
            this.memory.knownPairs.push([index1, index2]);
          }
        }
      }
    }
  }  /**
   * Calculate the best move based on AI difficulty and strategy
   */
  private calculateBestMove(cards: Card[], matchType: MatchType): [number, number] {
    const optimalPlayRate = GAME_CONSTANTS.AI_OPTIMAL_PLAY_RATES[this.memory.difficulty];
    
    // CRITICAL FIX: Real-time card state validation before any strategy
    console.log(`AI (${this.memory.difficulty}) calculating best move - validating card states first`);
    
    // Get CURRENT available cards with aggressive validation
    const currentAvailableCards = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card, index }) => {
        if (!card || typeof card !== 'object') {
          console.warn(`Invalid card object at index ${index}:`, card);
          return false;
        }
        if (!card.id || typeof card.id !== 'string') {
          console.warn(`Card missing ID at index ${index}:`, card);
          return false;
        }
        if (typeof card.isFlipped !== 'boolean' || typeof card.isMatched !== 'boolean') {
          console.warn(`Card missing state properties at index ${index}:`, card);
          return false;
        }
        if (card.isFlipped === true || card.isMatched === true) {
          return false; // Not available
        }
        return true;
      });
    
    console.log('AI calculateBestMove real-time card validation:', {
      totalCards: cards.length,
      validAvailableCards: currentAvailableCards.length,
      invalidCards: cards.length - currentAvailableCards.length,
      optimalPlayRate: optimalPlayRate
    });
    
    // If we don't have at least 2 valid cards, emergency exit
    if (currentAvailableCards.length < 2) {
      console.error('AI calculateBestMove: Not enough valid cards!', {
        available: currentAvailableCards.length,
        cardStates: cards.map((c, i) => ({
          index: i,
          id: c?.id?.slice(-4),
          isFlipped: c?.isFlipped,
          isMatched: c?.isMatched,
          valid: c && typeof c === 'object' && c.id && 
                 typeof c.isFlipped === 'boolean' && typeof c.isMatched === 'boolean' &&
                 c.isFlipped === false && c.isMatched === false
        }))
      });
      return this.getEmergencyMove(cards);
    }
    
    try {
      // Should AI make optimal move?
      if (Math.random() < optimalPlayRate) {
        // Try to find a known match first
        const knownMatch = this.findKnownMatch(cards, matchType);
        if (knownMatch && this.validateMove(cards, knownMatch)) {
          console.log('AI using known match strategy');
          return knownMatch;
        }
        
        // Expert AI: Try to block player's obvious matches
        if (this.memory.difficulty === 'expert' || this.memory.difficulty === 'hard') {
          const blockingMove = this.findBlockingMove(cards, matchType);
          if (blockingMove && this.validateMove(cards, blockingMove)) {
            console.log('AI using blocking strategy');
            return blockingMove;
          }
        }
        
        // Hard/Expert AI: Make strategic moves to gather information
        if (this.memory.difficulty === 'hard' || this.memory.difficulty === 'expert') {
          const strategicMove = this.findStrategicMove(cards);
          if (strategicMove && this.validateMove(cards, strategicMove)) {
            console.log('AI using strategic information gathering');
            return strategicMove;
          }
        }
        
        // Medium+ AI: Try to find pairs that might match based on partial information
        if (this.memory.difficulty !== 'easy') {
          const inferredMatch = this.findInferredMatch(cards, matchType);
          if (inferredMatch && this.validateMove(cards, inferredMatch)) {
            console.log('AI using inferred match strategy');
            return inferredMatch;
          }
        }
      }
    } catch (error) {
      console.error('Error in AI calculateBestMove:', error);
    }
    
    // Make random move (or when optimal strategy doesn't find anything)
    const randomMove = this.makeRandomMove(cards);
    
    // Final validation to ensure the move is valid
    if (!this.validateMove(cards, randomMove)) {
      console.warn('AI generated invalid move, using emergency fallback');
      return this.getEmergencyMove(cards);
    }
    
    return randomMove;
  }  /**
   * Find a known matching pair
   */
  private findKnownMatch(cards: Card[], matchType: MatchType): [number, number] | null {
    for (const [index1, index2] of this.memory.knownPairs) {
      // Safety check: ensure indices are valid and within bounds
      if (index1 < 0 || index1 >= cards.length || index2 < 0 || index2 >= cards.length) {
        continue;
      }
      
      const card1 = cards[index1];
      const card2 = cards[index2];
      
      // CRITICAL FIX: Enhanced safety check with strict validation
      if (card1 && card2 && card1.id && card2.id && 
          card1.isMatched === false && card2.isMatched === false && 
          card1.isFlipped === false && card2.isFlipped === false) {
        
        // Additional double-check: verify cards are actually available
        if (cardsMatch(card1, card2, matchType)) {
          console.log('AI found valid known match:', {
            card1: card1.id.slice(-4),
            card2: card2.id.slice(-4),
            card1State: { isFlipped: card1.isFlipped, isMatched: card1.isMatched },
            card2State: { isFlipped: card2.isFlipped, isMatched: card2.isMatched }
          });
          return [index1, index2];
        }
      } else {
        // Log why this pair was rejected
        console.log('AI rejecting known pair due to invalid state:', {
          index1, index2,
          card1: card1 ? { id: card1.id?.slice(-4), isFlipped: card1.isFlipped, isMatched: card1.isMatched } : 'null',
          card2: card2 ? { id: card2.id?.slice(-4), isFlipped: card2.isFlipped, isMatched: card2.isMatched } : 'null'
        });
      }
    }
    return null;
  }/**
   * Find a move that blocks the player's obvious matches
   */
  private findBlockingMove(cards: Card[], matchType: MatchType): [number, number] | null {
    // Get all available cards with proper validation
    const availableCards: { card: Card; index: number }[] = [];
    
    cards.forEach((card, index) => {
      if (card && 
          card.id &&
          typeof card.isFlipped === 'boolean' &&
          typeof card.isMatched === 'boolean' &&
          card.isFlipped === false && 
          card.isMatched === false) {
        availableCards.push({ card, index });
      }
    });
    
    if (availableCards.length >= 2) {
      // Randomize the blocking strategy - don't always pick the first cards
      const shuffled = [...availableCards];
      
      // Fisher-Yates shuffle for true randomization
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Expert AI: Try to pick cards that disrupt potential matches
      // Look for cards that might break up obvious color/rank/suit patterns
      if (this.memory.difficulty === 'expert') {
        const strategicCards = this.findStrategicBlockingCards(shuffled, cards, matchType);
        if (strategicCards) {
          console.log('AI using strategic blocking move');
          return strategicCards;
        }
      }
      
      // Default blocking: pick two randomized available cards
      console.log('AI using randomized blocking move');
      return [shuffled[0].index, shuffled[1].index];
    }

    return null;
  }

  /**
   * Find strategic blocking cards for expert AI
   */
  private findStrategicBlockingCards(
    availableCards: { card: Card; index: number }[], 
    allCards: Card[], 
    matchType: MatchType
  ): [number, number] | null {
    // Expert AI tries to pick cards that minimize the chance of creating obvious matches
    // for the human player on their next turn
    
    if (availableCards.length < 2) return null;
    
    // Strategy: Pick cards that are less likely to form matches with recently revealed cards
    const recentlyRevealed = Array.from(this.memory.knownCards.values())
      .filter((card): card is Card => card !== null && card !== undefined && typeof card === 'object' && 'id' in card)
      .slice(-4); // Last 4 revealed cards
    
    if (recentlyRevealed.length > 0) {
      // Score each available card based on how likely it is to match with recent cards
      const cardScores = availableCards.map(({ card, index }) => {
        let matchRisk = 0;
        
        recentlyRevealed.forEach(recentCard => {
          if (recentCard && card) {
            switch (matchType) {
              case 'color':
                if (card.color === recentCard.color) matchRisk += 3;
                break;
              case 'rank':
                if (card.rank === recentCard.rank) matchRisk += 3;
                break;
              case 'suit':
                if (card.suit === recentCard.suit) matchRisk += 3;
                break;
            }
          }
        });
        
        return { card, index, matchRisk };
      });
      
      // Sort by match risk (ascending - we want low risk cards)
      cardScores.sort((a, b) => a.matchRisk - b.matchRisk);
      
      // Pick the two lowest risk cards, but add some randomization
      const lowRiskCards = cardScores.slice(0, Math.min(4, cardScores.length));
      const selected = lowRiskCards.slice(0, 2);
      
      if (selected.length === 2) {
        return [selected[0].index, selected[1].index];
      }
    }
    
    // Fallback: pick first two available cards
    return [availableCards[0].index, availableCards[1].index];
  }
  /**
   * Find a strategic move (reveal new information)
   */
  private findStrategicMove(cards: Card[]): [number, number] | null {
    const unknownCards = cards
      .map((card, index) => card ? { card, index } : null)
      .filter((item): item is { card: Card; index: number } => 
        item !== null && 
        item.card && 
        !item.card.isFlipped && 
        !item.card.isMatched && 
        !this.memory.knownCards.has(item.index)
      );
    
    if (unknownCards.length >= 2) {
      // Randomize the selection instead of always picking the first two
      const shuffled = [...unknownCards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Pick two randomized unknown cards to gather information
      return [shuffled[0].index, shuffled[1].index];
    }
    
    return null;
  }  /**
   * Find a potential match based on partial information (for medium+ difficulty)
   */  private findInferredMatch(cards: Card[], matchType: MatchType): [number, number] | null {
    // Only use this for medium+ difficulty
    if (this.memory.difficulty === 'easy') {
      return null;
    }
    
    // Get all known cards from memory
    const knownCards = Array.from(this.memory.knownCards.entries());
    
    // Safety check for empty memory
    if (knownCards.length === 0) {
      return null;
    }
    
    // Find valid unflipped cards with enhanced validation
    const unflippedIndices = cards
      .map((card, index) => ({ card, index }))
      .filter(item => 
        item.card && 
        typeof item.card === 'object' &&
        item.card.id && 
        typeof item.card.isFlipped === 'boolean' && 
        typeof item.card.isMatched === 'boolean' &&
        item.card.isFlipped === false && 
        item.card.isMatched === false
      )
      .map(item => item.index);
    
    // Check if we have enough valid cards to continue
    if (unflippedIndices.length === 0) {
      console.log('AI: No valid unflipped cards found for inferring matches');
      return null;
    }
    
    console.log('AI attempting to find inferred match:', {
      difficulty: this.memory.difficulty, 
      knownCards: knownCards.length,
      unflippedCards: unflippedIndices.length
    });
    
    // Vary strategy based on difficulty
    // Higher difficulties make better use of memory
    let matchProbability: number;
    switch (this.memory.difficulty) {
      case 'medium':
        matchProbability = 0.6;  // Medium has 60% chance to use memory correctly
        break;
      case 'hard':
        matchProbability = 0.85; // Hard has 85% chance to use memory correctly
        break;
      case 'expert':
        matchProbability = 0.98; // Expert almost always uses memory correctly
        break;
      default:
        matchProbability = 0.5;  // Default
    }
    
    // For each known card, try to find a matching unflipped card
    for (const [knownIndex, knownCard] of knownCards) {
      // Skip if the known card is already flipped or matched
      if (cards[knownIndex]?.isFlipped || cards[knownIndex]?.isMatched) {
        continue;
      }
      
      // Make sure knownCard is valid
      if (!knownCard || !knownCard.id) {
        continue;
      }
      
      // Use smarter matching for higher difficulty levels
      if (Math.random() < matchProbability) {
        for (const unflippedIndex of unflippedIndices) {
          // Don't match with self
          if (knownIndex === unflippedIndex) {
            continue;
          }
          
          // Validate both indices
          if (!this.validateMove(cards, [knownIndex, unflippedIndex])) {
            continue;
          }
          
          // Based on the match type, check for potential match
          const unflippedCard = cards[unflippedIndex];
          let potentialMatch = false;
          
          switch (matchType) {
            case 'color':
              potentialMatch = knownCard.color === unflippedCard.color;
              break;
            case 'rank':
              potentialMatch = knownCard.rank === unflippedCard.rank;
              break;
            case 'suit':
              potentialMatch = knownCard.suit === unflippedCard.suit;
              break;
          }
          
          if (potentialMatch) {
            console.log('AI found inferred match:', {
              card1: knownCard.id.slice(-4),
              card2: unflippedCard.id.slice(-4),
              matchType
            });
            return [knownIndex, unflippedIndex];
          }
        }
      }
    }
    
    return null;
  }  /**
   * Make a random move
   */  private makeRandomMove(cards: Card[]): [number, number] {
    // First, get all available (unflipped, unmatched) cards with stricter validation
    const availableIndices: number[] = [];
    
    // Extra logging to verify card state
    let invalidCardCount = 0;
    let flippedCardCount = 0;
    let matchedCardCount = 0;
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      // Check for invalid card state
      if (!card || typeof card !== 'object') {
        invalidCardCount++;
        continue;
      }
      
      if (!card.id || typeof card.id !== 'string') {
        invalidCardCount++;
        continue;
      }
      
      if (typeof card.isFlipped !== 'boolean' || typeof card.isMatched !== 'boolean') {
        invalidCardCount++;
        continue;
      }
      
      // Track flipped and matched cards for debugging
      if (card.isFlipped) flippedCardCount++;
      if (card.isMatched) matchedCardCount++;
      
      // Only include valid unflipped, unmatched cards
      if (card.isFlipped === false && card.isMatched === false) {
        availableIndices.push(i);
      }
    }
    
    console.log('AI card selection detailed stats:', {
      totalCards: cards.length,
      availableCards: availableIndices.length,
      invalidCards: invalidCardCount,
      flippedCards: flippedCardCount,
      matchedCards: matchedCardCount
    });
    
    // If we have no available cards, log an error
    if (availableIndices.length === 0) {
      console.error('No available cards for makeRandomMove!');
      return this.getEmergencyMove(cards);
    }
    
    if (availableIndices.length < 2) {
      console.error('AI: Not enough available cards!', {
        available: availableIndices.length,
        total: cards.length,
        cardStates: cards.map((c, i) => ({ 
          index: i, 
          id: c?.id?.slice(-4), 
          isFlipped: c?.isFlipped, 
          isMatched: c?.isMatched 
        }))
      });
      
      return this.getEmergencyMove(cards);
    }
      
    // Truly randomize the available cards using Fisher-Yates shuffle
    const shuffled = [...availableIndices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Double validate the move before returning
    const move: [number, number] = [shuffled[0], shuffled[1]];
    
    // Final validation to ensure the move is valid
    if (!this.validateMove(cards, move)) {
      console.warn('AI random move failed validation, getting emergency move instead');
      return this.getEmergencyMove(cards);
    }
    
    // Log detailed info about the move
    console.log('AI final random move selection:', {
      move,
      availableCount: availableIndices.length,
      difficulty: this.memory.difficulty,
      card1: cards[move[0]]?.id?.slice(-4),
      card2: cards[move[1]]?.id?.slice(-4)
    });
    
    return move;
  }

  /**
   * Check if AI should make a suboptimal move
   */
  private shouldMakeSuboptimalMove(): boolean {
    const optimalRate = GAME_CONSTANTS.AI_OPTIMAL_PLAY_RATES[this.memory.difficulty];
    return Math.random() > optimalRate;
  }

  /**
   * Get reaction delay for AI move
   */
  private getReactionDelay(): number {
    const { min, max } = GAME_CONSTANTS.AI_REACTION_TIMES[this.memory.difficulty];
    return Math.random() * (max - min) + min;
  }
  /**
   * Analyze player move patterns
   */
  private analyzePlayerPatterns(moves: Move[]): string[] {
    const patterns: string[] = [];
      // Simple pattern recognition
    if (moves.length >= 3) {
      // Check if player is focusing on specific areas of the board
      // This is a simplified pattern analysis
      patterns.push('focused_area');
    }
    
    return patterns;
  }
  /**
   * Validate that a move is legal (both cards are unflipped and unmatched)
   */  private validateMove(cards: Card[], move: [number, number]): boolean {
    const [index1, index2] = move;
    
    // Check indices are valid
    if (index1 < 0 || index1 >= cards.length || index2 < 0 || index2 >= cards.length) {
      console.warn('AI validation failed: Invalid card indices', { index1, index2, cardsLength: cards.length });
      return false;
    }
    
    // Check indices are different
    if (index1 === index2) {
      console.warn('AI validation failed: Same card selected twice', { index1, index2 });
      return false;
    }
    
    const card1 = cards[index1];
    const card2 = cards[index2];
    
    // Check cards exist and have required properties
    if (!card1 || !card2 || !card1.id || !card2.id) {
      console.warn('AI validation failed: Invalid card objects', { 
        card1: card1 ? { hasId: !!card1.id } : 'undefined', 
        card2: card2 ? { hasId: !!card2.id } : 'undefined' 
      });
      return false;
    }
    
    // Stronger validation for card type and properties
    if (typeof card1.isFlipped !== 'boolean' || 
        typeof card1.isMatched !== 'boolean' || 
        typeof card2.isFlipped !== 'boolean' || 
        typeof card2.isMatched !== 'boolean') {
      console.warn('AI validation failed: Cards have invalid state properties', {
        card1Props: { isFlipped: typeof card1.isFlipped, isMatched: typeof card1.isMatched },
        card2Props: { isFlipped: typeof card2.isFlipped, isMatched: typeof card2.isMatched }
      });
      return false;
    }
    
    // Extra strict check for card availability (not flipped or matched)
    if (card1.isFlipped === true || 
        card1.isMatched === true || 
        card2.isFlipped === true || 
        card2.isMatched === true) {
      console.warn('AI validation failed: Selected unavailable cards', {
        card1: { id: card1.id.slice(-4), isFlipped: card1.isFlipped, isMatched: card1.isMatched },
        card2: { id: card2.id.slice(-4), isFlipped: card2.isFlipped, isMatched: card2.isMatched }
      });
      return false;
    }
    
    return true;
  }

  /**
   * Get an emergency move when all other methods fail
   */  private getEmergencyMove(cards: Card[]): [number, number] {
    // First, check the entire card state to understand what's happening
    const cardsState = {
      total: cards.length,
      validObjects: cards.filter(c => c && typeof c === 'object').length,
      withId: cards.filter(c => c && c.id).length,
      unflipped: cards.filter(c => c && c.isFlipped === false).length,
      unmatched: cards.filter(c => c && c.isMatched === false).length,
      available: cards.filter(c => c && c.isFlipped === false && c.isMatched === false).length
    };
    
    console.log('Emergency move card state assessment:', cardsState);
    
    // Find ALL valid card indices that are unmatched and unflipped
    const validIndices: number[] = [];
    
    console.log('Looking for emergency move among cards...');
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card && 
          card.id && 
          typeof card.id === 'string' &&
          typeof card.isFlipped === 'boolean' &&
          typeof card.isMatched === 'boolean' &&
          card.isFlipped === false && 
          card.isMatched === false) {
        validIndices.push(i);
        // Only need 2 valid indices
        if (validIndices.length >= 2) {
          console.log('Found valid emergency move indices:', validIndices.slice(0, 2));
          break;
        }
      }
    }
    
    if (validIndices.length >= 2) {
      return [validIndices[0], validIndices[1]];
    }
    
    // If we couldn't find 2 completely valid cards, reset memory and try again
    console.log('AI: No fully valid moves available! Resetting AI memory and looking for unmatched cards...');
    
    // Reset AI memory to avoid persisting invalid state
    this.memory.knownCards.clear();
    this.memory.knownPairs = [];
    
    const unmatchedIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card && 
          typeof card === 'object' &&
          card.id && 
          typeof card.id === 'string' &&
          typeof card.isMatched === 'boolean' &&
          card.isMatched === false) {
        unmatchedIndices.push(i);
        if (unmatchedIndices.length >= 2) break;
      }
    }
    
    if (unmatchedIndices.length >= 2) {
      console.warn('AI: Using unmatched but possibly flipped cards:', unmatchedIndices.slice(0, 2));
      return [unmatchedIndices[0], unmatchedIndices[1]];
    }
    
    // If we're still here, dump full card state for debugging
    console.error('AI: Critical failure! Card state dump:', cards.map((c, i) => ({
      index: i,
      id: c?.id?.slice(-4),
      isFlipped: c?.isFlipped,
      isMatched: c?.isMatched,
      hasValidState: Boolean(c && typeof c.isFlipped === 'boolean' && typeof c.isMatched === 'boolean')
    })));
      
    // Absolute last resort - should never happen
    // Look for ANY two different indices that are at least properly defined
    for (let i = 0; i < cards.length; i++) {
      if (cards[i] && cards[i].id) {
        for (let j = i + 1; j < cards.length; j++) {
          if (cards[j] && cards[j].id) {
            console.warn('AI: Using emergency fallback with any two valid card objects:', [i, j]);
            return [i, j];
          }
        }
      }
    }
    
    // Final fallback - should never get here unless something is seriously wrong
    console.error('AI: No valid card objects found at all!');
    const index1 = 0;
    const index2 = Math.min(1, cards.length - 1);
    console.warn('AI: Using absolute last resort indices:', [index1, index2]);
    return [index1, index2] as [number, number];
  }

  /**
   * Get memory reliability based on AI difficulty
   * Easy: 70% memory reliability
   * Medium: 85% memory reliability
   * Hard: 95% memory reliability
   * Expert: 100% memory reliability
   */
  private getMemoryReliability(): number {
    switch (this.memory.difficulty) {
      case 'easy':
        return 0.7;
      case 'medium':
        return 0.85;
      case 'hard':
        return 0.95;
      case 'expert':
        return 1.0;
      default:
        return 0.85; // Medium is default
    }
  }
  /**
   * Determine what type of match exists between two cards
   */
  private determineMatchType(cardId1: string, cardId2: string, cards: Card[]): MatchType | null {
    // Find the cards by ID
    const card1 = cards.find(card => card && card.id === cardId1);
    const card2 = cards.find(card => card && card.id === cardId2);
    
    if (!card1 || !card2) return null;
    
    if (card1.color === card2.color) return 'color';
    if (card1.rank === card2.rank) return 'rank';
    if (card1.suit === card2.suit) return 'suit';
    
    return null;
  }

  /**
   * Comprehensive state verification to ensure AI doesn't select invalid cards
   * This is the ultimate safety net
   */
  private verifyCardStateIntegrity(cards: Card[], move: [number, number]): { isValid: boolean; reason?: string; correctedMove?: [number, number] } {
    const [index1, index2] = move;
    
    // Step 1: Verify indices are within bounds
    if (index1 < 0 || index1 >= cards.length || index2 < 0 || index2 >= cards.length) {
      return { 
        isValid: false, 
        reason: `Invalid indices: [${index1}, ${index2}] for cards array of length ${cards.length}` 
      };
    }
    
    // Step 2: Verify cards exist and are objects
    const card1 = cards[index1];
    const card2 = cards[index2];
    
    if (!card1 || !card2 || typeof card1 !== 'object' || typeof card2 !== 'object') {
      return { 
        isValid: false, 
        reason: `Cards don't exist or aren't objects: card1=${typeof card1}, card2=${typeof card2}` 
      };
    }
    
    // Step 3: Verify cards have required properties
    if (!card1.id || !card2.id || 
        typeof card1.isFlipped !== 'boolean' || typeof card2.isFlipped !== 'boolean' ||
        typeof card1.isMatched !== 'boolean' || typeof card2.isMatched !== 'boolean') {
      return { 
        isValid: false, 
        reason: 'Cards missing required properties (id, isFlipped, isMatched)' 
      };
    }
    
    // Step 4: Verify cards are actually available
    if (card1.isFlipped === true || card1.isMatched === true || 
        card2.isFlipped === true || card2.isMatched === true) {
      
      // Try to find a corrected move with available cards
      const availableIndices = cards
        .map((card, idx) => ({ card, idx }))
        .filter(({ card }) => card && card.id && 
                 card.isFlipped === false && card.isMatched === false)
        .map(({ idx }) => idx);
      
      if (availableIndices.length >= 2) {
        const correctedMove: [number, number] = [availableIndices[0], availableIndices[1]];
        return { 
          isValid: false, 
          reason: `Cards not available: card1(isFlipped=${card1.isFlipped}, isMatched=${card1.isMatched}), card2(isFlipped=${card2.isFlipped}, isMatched=${card2.isMatched})`,
          correctedMove 
        };
      } else {
        return { 
          isValid: false, 
          reason: `Cards not available and no valid alternatives found. Available cards: ${availableIndices.length}` 
        };
      }
    }
    
    // Step 5: Verify indices are different
    if (index1 === index2) {
      return { 
        isValid: false, 
        reason: `Same card selected twice: index ${index1}` 
      };
    }
    
    return { isValid: true };
  }
}

/**
 * Factory function to create a new AI player instance
 */
export function createAIPlayer(difficulty: AIDifficulty): AIPlayer {
  return new AIPlayer(difficulty);
}

/**
 * Get information about AI difficulty levels
 */
export function getAIDifficultyInfo(difficulty: AIDifficulty): {
  reactionTime: { min: number; max: number };
  optimalPlayRate: number;
  memoryLimit: number;
} {
  return {
    reactionTime: GAME_CONSTANTS.AI_REACTION_TIMES[difficulty],
    optimalPlayRate: GAME_CONSTANTS.AI_OPTIMAL_PLAY_RATES[difficulty],
    memoryLimit: GAME_CONSTANTS.AI_MEMORY_LIMITS[difficulty]  };
}
