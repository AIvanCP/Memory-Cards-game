import { useState, useCallback } from 'react';
import { GameSettings, GameStatistics, Achievement, BoardSize, AIDifficulty } from '../types/game.types';

const STORAGE_KEYS = {
  GAME_SETTINGS: 'memory-card-game-settings',
  STATISTICS: 'memory-card-game-statistics',
  ACHIEVEMENTS: 'memory-card-game-achievements',
  SAVED_GAME: 'memory-card-game-saved'
} as const;

/**
 * Custom hook for managing local storage with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for managing game settings
 */
export function useGameSettings() {
  const defaultSettings: GameSettings = {
    soundEnabled: true,
    animationSpeed: 'normal',
    theme: 'dark',
    showTimer: true,
    hintsEnabled: true,
    cardTheme: 'classic'
  };

  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.GAME_SETTINGS, defaultSettings);

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSetting,
    resetSettings
  };
}

/**
 * Hook for managing game statistics
 */
export function useGameStatistics() {
  const defaultStats: GameStatistics = {
    gamesPlayed: 0,
    gamesWon: 0,
    bestTime: 0,
    totalTime: 0,
    matchesMade: 0,
    perfectGames: 0,
    averageTime: 0,
    winRate: 0,    currentStreak: 0,
    bestStreak: 0,
    accuracy: 0,
    gamesByDifficulty: {
      easy: { played: 0, won: 0 },
      medium: { played: 0, won: 0 },
      hard: { played: 0, won: 0 },
      expert: { played: 0, won: 0 }
    },    gamesByMode: {
      singlePlayer: { played: 0, won: 0 },
      multiPlayer: { played: 0, won: 0 },
      aiVsAi: { played: 0, watched: 0 }
    }
  };
  // Function to ensure statistics have proper structure (for migration from older versions)
  const migrateStats = (stats: GameStatistics): GameStatistics => {
    const migratedStats = { ...stats };
    
    // Ensure gamesByMode exists
    if (!migratedStats.gamesByMode) {
      migratedStats.gamesByMode = {
        singlePlayer: { played: 0, won: 0 },
        multiPlayer: { played: 0, won: 0 },
        aiVsAi: { played: 0, watched: 0 }
      };
    }
    
    // Ensure each mode exists with proper structure
    if (!migratedStats.gamesByMode.singlePlayer) {
      migratedStats.gamesByMode.singlePlayer = { played: 0, won: 0 };
    }
    
    if (!migratedStats.gamesByMode.multiPlayer) {
      migratedStats.gamesByMode.multiPlayer = { played: 0, won: 0 };
    }
    
    // Ensure aiVsAi mode has both played and watched properties
    if (!migratedStats.gamesByMode.aiVsAi) {
      migratedStats.gamesByMode.aiVsAi = { played: 0, watched: 0 };
    } else if (!migratedStats.gamesByMode.aiVsAi.hasOwnProperty('watched')) {
      migratedStats.gamesByMode.aiVsAi = {
        played: migratedStats.gamesByMode.aiVsAi.played || 0,
        watched: 0
      };
    }
    
    // Ensure gamesByDifficulty exists
    if (!migratedStats.gamesByDifficulty) {
      migratedStats.gamesByDifficulty = {
        easy: { played: 0, won: 0 },
        medium: { played: 0, won: 0 },
        hard: { played: 0, won: 0 },
        expert: { played: 0, won: 0 }
      };
    }
    
    return migratedStats;
  };

  const [rawStatistics, setStatistics] = useLocalStorage(STORAGE_KEYS.STATISTICS, defaultStats);
  
  // Migrate statistics to ensure proper structure
  const statistics = migrateStats(rawStatistics);  const updateStatistics = (gameResult: {
    won: boolean;
    gameTime: number;
    boardSize: BoardSize;
    matches: number;
    totalMoves: number;
    isPerfect: boolean;
    aiDifficulty?: AIDifficulty;
    gameMode?: 'singlePlayer' | 'multiPlayer' | 'aiVsAi';
    isWatching?: boolean;
  }) => {
    setStatistics(prev => {
      const migratedPrev = migrateStats(prev);
      const newStats = { ...migratedPrev };
      
      // Update basic counts
      newStats.gamesPlayed++;
      if (gameResult.won) {
        newStats.gamesWon++;
        newStats.currentStreak++;
        if (newStats.currentStreak > newStats.bestStreak) {
          newStats.bestStreak = newStats.currentStreak;
        }
      } else {
        newStats.currentStreak = 0;
      }
      
      // Update win rate
      newStats.winRate = newStats.gamesWon / newStats.gamesPlayed;
      
      // Update time statistics
      newStats.totalTime += gameResult.gameTime;
      newStats.averageTime = newStats.totalTime / newStats.gamesPlayed;
      
      if (gameResult.gameTime < newStats.bestTime || newStats.bestTime === 0) {
        newStats.bestTime = gameResult.gameTime;
      }
      
      // Update matches and accuracy
      newStats.matchesMade += gameResult.matches;
      newStats.accuracy = gameResult.totalMoves > 0 ? (gameResult.matches / gameResult.totalMoves) * 100 : 0;
      
      // Update perfect games
      if (gameResult.isPerfect) {
        newStats.perfectGames++;
      }
        // Update difficulty-specific stats
      if (gameResult.aiDifficulty && newStats.gamesByDifficulty[gameResult.aiDifficulty]) {
        newStats.gamesByDifficulty[gameResult.aiDifficulty].played++;
        if (gameResult.won) {
          newStats.gamesByDifficulty[gameResult.aiDifficulty].won++;
        }
      }
        // Update mode-specific stats
      if (gameResult.gameMode) {
        if (gameResult.gameMode === 'aiVsAi') {
          newStats.gamesByMode.aiVsAi.played++;
          if (gameResult.isWatching) {
            newStats.gamesByMode.aiVsAi.watched++;
          }
        } else {
          newStats.gamesByMode[gameResult.gameMode].played++;
          if (gameResult.won) {
            newStats.gamesByMode[gameResult.gameMode].won++;
          }
        }
      }      
      return newStats;
    });
  };
  const resetStatistics = () => {
    setStatistics(defaultStats);
  };

  return {
    statistics,
    updateStatistics,
    resetStatistics
  };
}

/**
 * Hook for managing achievements
 */
export function useAchievements() {
  const [achievements, setAchievements] = useLocalStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []);

  const checkAchievements = (statistics: GameStatistics, gameState?: any): Achievement[] => {
    // Import achievements from the achievement system
    const { checkForNewAchievements } = require('../components/AchievementSystem');
    
    const newAchievements = checkForNewAchievements(statistics, achievements);
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
    }
    
    return newAchievements;
  };

  const getUnlockedAchievements = () => {
    return achievements.filter(achievement => achievement.unlockedAt);
  };

  const resetAchievements = () => {
    setAchievements([]);
  };

  return {
    achievements,
    checkAchievements,
    getUnlockedAchievements,
    resetAchievements
  };
}

/**
 * Hook for managing all app data
 */
export function useAppData() {
  const { settings, updateSetting, resetSettings } = useGameSettings();
  const { statistics, updateStatistics, resetStatistics } = useGameStatistics();
  const { achievements, checkAchievements, getUnlockedAchievements, resetAchievements } = useAchievements();

  const getItem = useCallback((key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  }, []);

  const setItem = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, []);

  const exportData = () => {
    const data = {
      settings,
      statistics,
      achievements: achievements.filter(a => a.unlockedAt),
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-game-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.settings) {
            Object.keys(data.settings).forEach(key => {
              updateSetting(key as keyof GameSettings, data.settings[key]);
            });
          }
          if (data.statistics) {
            setItem(STORAGE_KEYS.STATISTICS, data.statistics);
          }
          if (data.achievements) {
            setItem(STORAGE_KEYS.ACHIEVEMENTS, data.achievements);
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const clearAll = () => {
    resetSettings();
    resetStatistics();
    resetAchievements();
    localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
  };

  return {
    settings,
    statistics,
    achievements,
    updateSetting,
    updateStatistics,
    checkAchievements,
    getUnlockedAchievements,
    getItem,
    setItem,
    exportData,
    importData,
    clearAll
  };
}
