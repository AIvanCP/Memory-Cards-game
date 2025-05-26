import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star } from 'lucide-react';
import { Achievement, GameStatistics } from '../types/game.types';

interface AchievementNotificationProps {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-xl p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="text-white text-2xl">
                {achievement.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Trophy className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white text-lg">
                    Achievement Unlocked!
                  </h3>
                </div>
                
                <h4 className="font-semibold text-white mb-1">
                  {achievement.name}
                </h4>
                
                <p className="text-yellow-100 text-sm">
                  {achievement.description}
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="text-white hover:text-yellow-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-3 pt-3 border-t border-yellow-300/30">
              <div className="flex items-center space-x-2 text-yellow-100 text-sm">
                <Star className="w-4 h-4" />
                <span>+{achievement.points} points</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-win',
    name: 'First Victory',
    title: 'First Victory',
    description: 'Win your first game',
    icon: '🎉',
    points: 10,
    category: 'gameplay',
    condition: (stats: GameStatistics) => stats.gamesWon >= 1
  },
  {
    id: 'perfect-game',
    name: 'Perfect Memory',
    title: 'Perfect Memory',
    description: 'Complete a game without any wrong matches',
    icon: '🧠',
    points: 25,
    category: 'achievement',
    condition: (stats: GameStatistics) => stats.perfectGames >= 1
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    title: 'Speed Demon',
    description: 'Complete a game in under 60 seconds',
    icon: '⚡',
    points: 30,
    category: 'challenge',
    condition: (stats: GameStatistics) => stats.bestTime > 0 && stats.bestTime <= 60
  },
  {
    id: 'win-streak-5',
    name: 'Hot Streak',
    title: 'Hot Streak',
    description: 'Win 5 games in a row',
    icon: '🔥',
    points: 50,
    category: 'achievement',
    condition: (stats: GameStatistics) => stats.currentStreak >= 5
  },
  {
    id: 'win-streak-10',
    name: 'Unstoppable',
    title: 'Unstoppable',
    description: 'Win 10 games in a row',
    icon: '🚀',
    points: 100,
    category: 'achievement',
    condition: (stats: GameStatistics) => stats.currentStreak >= 10
  },
  {
    id: 'veteran',
    name: 'Veteran Player',
    title: 'Veteran Player',
    description: 'Play 50 games',
    icon: '🏆',
    points: 75,
    category: 'gameplay',
    condition: (stats: GameStatistics) => stats.gamesPlayed >= 50
  },
  {
    id: 'master',
    name: 'Memory Master',
    title: 'Memory Master',
    description: 'Play 100 games',
    icon: '👑',
    points: 150,
    category: 'gameplay',
    condition: (stats: GameStatistics) => stats.gamesPlayed >= 100
  },
  {
    id: 'ai-slayer',
    name: 'AI Slayer',
    title: 'AI Slayer',
    description: 'Beat an Expert AI opponent',
    icon: '🤖',
    points: 40,
    category: 'challenge',
    condition: (stats: GameStatistics) => stats.gamesByDifficulty.expert.won >= 1
  },
  {
    id: 'efficiency-expert',
    name: 'Efficiency Expert',
    title: 'Efficiency Expert',
    description: 'Maintain an 80% win rate over 20+ games',
    icon: '📊',
    points: 60,
    category: 'achievement',
    condition: (stats: GameStatistics) => 
      stats.gamesPlayed >= 20 && stats.winRate >= 0.8
  },
  {
    id: 'collector',
    name: 'Card Collector',
    title: 'Card Collector',
    description: 'Make 1000 total matches',
    icon: '🃏',
    points: 80,
    category: 'gameplay',
    condition: (stats: GameStatistics) => stats.matchesMade >= 1000  },
  {
    id: 'ai-observer',
    name: 'AI Observer',
    title: 'AI Observer',
    description: 'Watch 5 AI vs AI games',
    icon: '👁️',
    points: 50,
    category: 'achievement',
    condition: (stats: GameStatistics) => stats.gamesByMode.aiVsAi.watched >= 5
  },
  {
    id: 'social-player',
    name: 'Social Player',
    title: 'Social Player',
    description: 'Play 10 multiplayer games',
    icon: '👥',
    points: 35,
    category: 'gameplay',
    condition: (stats: GameStatistics) => stats.gamesByMode.multiPlayer.played >= 10
  },
  {
    id: 'consistency',
    name: 'Consistent Player',
    title: 'Consistent Player',
    description: 'Play at least one game every day for a week',
    icon: '📅',
    points: 45,
    category: 'challenge',
    // This would need additional tracking for daily play
    condition: () => false // Placeholder - would need daily play tracking
  },
  {
    id: 'lightning-fast',
    name: 'Lightning Fast',
    title: 'Lightning Fast',
    description: 'Complete a game in under 30 seconds',
    icon: '⚡',
    points: 50,
    category: 'challenge',
    condition: (stats: GameStatistics) => stats.bestTime > 0 && stats.bestTime <= 30
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    title: 'Perfectionist',
    description: 'Complete 10 perfect games',
    icon: '💎',
    points: 100,
    category: 'achievement',
    condition: (stats: GameStatistics) => stats.perfectGames >= 10
  }
];

// Helper function to ensure statistics object has proper structure
const ensureStatsStructure = (stats: GameStatistics): GameStatistics => {
  // Create a deep copy to avoid mutating the original
  const safeStats = { ...stats };
  
  // Ensure gamesByMode exists
  if (!safeStats.gamesByMode) {
    safeStats.gamesByMode = {
      singlePlayer: { played: 0, won: 0 },
      multiPlayer: { played: 0, won: 0 },
      aiVsAi: { played: 0, watched: 0 }
    };
  }
  
  // Ensure each mode exists with proper structure
  if (!safeStats.gamesByMode.singlePlayer) {
    safeStats.gamesByMode.singlePlayer = { played: 0, won: 0 };
  }
  
  if (!safeStats.gamesByMode.multiPlayer) {
    safeStats.gamesByMode.multiPlayer = { played: 0, won: 0 };
  }
  
  // Ensure aiVsAi mode has both played and watched properties
  if (!safeStats.gamesByMode.aiVsAi) {
    safeStats.gamesByMode.aiVsAi = { played: 0, watched: 0 };
  } else if (!safeStats.gamesByMode.aiVsAi.hasOwnProperty('watched')) {
    safeStats.gamesByMode.aiVsAi = {
      played: safeStats.gamesByMode.aiVsAi.played || 0,
      watched: 0
    };
  }
  
  return safeStats;
};

// Helper function to check for new achievements
export const checkForNewAchievements = (
  currentStats: GameStatistics,
  unlockedAchievements: Achievement[]
): Achievement[] => {
  // Ensure stats structure is correct before checking achievements
  const safeStats = ensureStatsStructure(currentStats);
  
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
  const newAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedIds.has(achievement.id) && achievement.condition && achievement.condition(safeStats)) {
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: Date.now()
      };
      newAchievements.push(unlockedAchievement);
    }
  }

  return newAchievements;
};

// Helper function to calculate total achievement points
export const calculateAchievementPoints = (achievements: Achievement[]): number => {
  return achievements
    .filter(a => a.unlockedAt)
    .reduce((total, achievement) => total + achievement.points, 0);
};
