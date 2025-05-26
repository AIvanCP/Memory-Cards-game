import { useState, useCallback, useRef } from 'react';
import { Card, AIDifficulty, MatchType, Move } from '../types/game.types';
import { AIPlayer, createAIPlayer, getAIDifficultyInfo } from '../utils/aiLogic';

/**
 * Hook for managing AI players and their behavior
 */
export function useAI() {
  const [aiPlayers, setAiPlayers] = useState<Map<string, AIPlayer>>(new Map());
  const [aiStats, setAiStats] = useState<Record<string, any>>({});
  const processingRef = useRef<Set<string>>(new Set());  /**
   * Create or get an AI player instance
   */
  const getAIPlayer = useCallback((playerId: string, difficulty: AIDifficulty): AIPlayer => {
    let player = aiPlayers.get(playerId);
    
    if (!player) {
      const newPlayer = createAIPlayer(difficulty);
      if (!newPlayer) {
        throw new Error(`Failed to create AI player with difficulty: ${difficulty}`);
      }
      player = newPlayer;
      setAiPlayers(prev => new Map(prev).set(playerId, player!));
    }
    
    return player;
  }, [aiPlayers]);

  /**
   * Make an AI move with proper difficulty simulation
   */
  const makeAIMove = useCallback(async (
    playerId: string,
    difficulty: AIDifficulty,
    cards: Card[],
    matchType: MatchType,
    moveHistory: Move[]
  ): Promise<[number, number]> => {
    // Prevent concurrent AI processing for the same player
    if (processingRef.current.has(playerId)) {
      throw new Error('AI player is already processing a move');
    }
    
    processingRef.current.add(playerId);
    
    try {
      const aiPlayer = getAIPlayer(playerId, difficulty);
      const move = await aiPlayer.makeMove(cards, matchType, moveHistory);
      
      // Update AI stats
      setAiStats(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          totalMoves: (prev[playerId]?.totalMoves || 0) + 1,
          lastMoveTime: Date.now(),
          difficulty
        }
      }));
      
      return move;
    } finally {
      processingRef.current.delete(playerId);
    }
  }, [getAIPlayer]);

  /**
   * Reset an AI player's memory
   */
  const resetAIPlayer = useCallback((playerId: string, difficulty: AIDifficulty) => {
    const newPlayer = createAIPlayer(difficulty);
    setAiPlayers(prev => new Map(prev).set(playerId, newPlayer));
    
    // Clear stats for this player
    setAiStats(prev => {
      const newStats = { ...prev };
      delete newStats[playerId];
      return newStats;
    });
  }, []);

  /**
   * Get AI difficulty information
   */
  const getDifficultyInfo = useCallback((difficulty: AIDifficulty) => {
    return getAIDifficultyInfo(difficulty);
  }, []);

  /**
   * Get AI player statistics
   */
  const getAIStats = useCallback((playerId: string) => {
    return aiStats[playerId] || {
      totalMoves: 0,
      lastMoveTime: null,
      difficulty: 'medium'
    };
  }, [aiStats]);

  /**
   * Check if AI is currently processing
   */
  const isAIProcessing = useCallback((playerId: string) => {
    return processingRef.current.has(playerId);
  }, []);

  /**
   * Simulate AI "thinking" time based on difficulty
   */
  const simulateThinkingTime = useCallback(async (difficulty: AIDifficulty): Promise<void> => {
    const difficultyInfo = getDifficultyInfo(difficulty);
    const baseTime = {
      easy: { min: 2000, max: 4000 },
      medium: { min: 1000, max: 2500 },
      hard: { min: 500, max: 1500 },
      expert: { min: 200, max: 800 }
    }[difficulty];
    
    const thinkingTime = Math.random() * (baseTime.max - baseTime.min) + baseTime.min;
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
  }, [getDifficultyInfo]);

  /**
   * Evaluate AI move quality (for debugging/analysis)
   */
  const evaluateMove = useCallback((
    move: [number, number],
    cards: Card[],
    matchType: MatchType,
    difficulty: AIDifficulty
  ) => {
    const [index1, index2] = move;
    const card1 = cards[index1];
    const card2 = cards[index2];
    
    if (!card1 || !card2) {
      return { isValid: false, quality: 0, reasoning: 'Invalid card indices' };
    }
    
    // Check if it's a matching move
    let isMatch = false;
    switch (matchType) {
      case 'color':
        isMatch = card1.color === card2.color;
        break;
      case 'rank':
        isMatch = card1.rank === card2.rank;
        break;
      case 'suit':
        isMatch = card1.suit === card2.suit;
        break;
    }
    
    let quality = 0;
    let reasoning = '';
    
    if (isMatch) {
      quality = 100;
      reasoning = 'Perfect match found';
    } else {
      // Evaluate information gathering value
      const isNewInfo = !card1.isFlipped && !card2.isFlipped;
      if (isNewInfo) {
        quality = 60;
        reasoning = 'Good information gathering move';
      } else {
        quality = 30;
        reasoning = 'Suboptimal move - revealing known cards';
      }
    }
    
    return {
      isValid: true,
      quality,
      reasoning,
      isMatch,
      difficultyAppropriate: quality >= getDifficultyInfo(difficulty).optimalPlayRate * 100
    };
  }, [getDifficultyInfo]);

  return {
    makeAIMove,
    resetAIPlayer,
    getDifficultyInfo,
    getAIStats,
    isAIProcessing,
    simulateThinkingTime,
    evaluateMove,
    aiStats
  };
}
