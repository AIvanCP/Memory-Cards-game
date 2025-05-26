import { ReactNode } from 'react';

// Core game types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardColor = 'red' | 'black';
export type MatchType = 'color' | 'rank' | 'suit';
export type BoardSize = '4x4' | '4x6' | '6x6';
export type GameMode = 'ai' | 'local-multiplayer' | 'ai-vs-ai';
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type GameStatus = 'setup' | 'playing' | 'paused' | 'finished';
export type PlayerType = 'human' | 'ai';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  color: CardColor;
  position: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  score: number;
  matches: Card[][];
  isCurrentPlayer: boolean;
  aiDifficulty?: AIDifficulty;
}

export interface Move {
  playerId: string;
  cardIds: string[];
  timestamp: number;
  isMatch: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'light' | 'dark' | 'minimalist' | 'cyberpunk' | 'neon' | 'forest';
  showTimer: boolean;
  hintsEnabled: boolean;
  cardTheme: 'classic' | 'modern' | 'minimal';
  turnTimeLimit?: number;
}

export interface GameState {
  gameMode: GameMode;
  matchType: MatchType;
  boardSize: BoardSize;
  currentPlayer: string;
  players: Player[];
  cards: Card[];
  flippedCards: Card[];
  matchedPairs: Card[][];
  gameStatus: GameStatus;
  turnStartTime?: number;
  gameStartTime?: number;
  moveHistory: Move[];
  settings: GameSettings;
}

export interface GameStatistics {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number;
  totalTime: number;
  matchesMade: number;
  perfectGames: number;
  averageTime: number;
  winRate: number;  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  gamesByDifficulty: {
    easy: { played: number; won: number };
    medium: { played: number; won: number };
    hard: { played: number; won: number };
    expert: { played: number; won: number };
  };
  gamesByMode: {
    singlePlayer: { played: number; won: number };
    multiPlayer: { played: number; won: number };
    aiVsAi: { played: number; watched: number };
  };
}

export interface Achievement {
  name: ReactNode;
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
  category: 'gameplay' | 'achievement' | 'challenge';
  condition?: (stats: GameStatistics) => boolean;
}

export interface AIMemory {
  knownCards: Map<number, Card>;
  knownPairs: [number, number][];
  playerPatterns: string[];
  lastPlayerMoves: Move[];
  difficulty: AIDifficulty;
}

export interface AIVsAIConfig {
  ai1Difficulty: AIDifficulty;
  ai2Difficulty: AIDifficulty;
  gameSpeed?: 'slow' | 'normal' | 'fast';
  autoRestart?: boolean;
}

export const GAME_CONSTANTS = {
  AI_MEMORY_LIMITS: {
    easy: 3,
    medium: 7,
    hard: 12,
    expert: 20
  },
  AI_OPTIMAL_PLAY_RATES: {
    easy: 0.3,
    medium: 0.6,
    hard: 0.85,
    expert: 0.95
  },
  AI_REACTION_TIMES: {
    easy: { min: 1000, max: 2000 },
    medium: { min: 500, max: 1000 },
    hard: { min: 200, max: 500 },
    expert: { min: 100, max: 300 }
  }
};
