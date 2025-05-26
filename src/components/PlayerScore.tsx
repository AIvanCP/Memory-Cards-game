import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, User, Bot, Target } from 'lucide-react';
import { Player, GameMode } from '../types/game.types';

interface PlayerScoreProps {
  player: Player;
  isCurrentPlayer: boolean;
  totalPairs: number;
  gameMode: GameMode;
  isWinner?: boolean;
}

const PlayerScore: React.FC<PlayerScoreProps> = ({
  player,
  isCurrentPlayer,
  totalPairs,
  gameMode,
  isWinner = false
}) => {
  const scorePercentage = totalPairs > 0 ? (player.score / totalPairs) * 100 : 0;

  const getPlayerIcon = () => {
    if (player.type === 'ai') {
      return <Bot className="w-5 h-5 text-red-400" />;
    }
    return <User className="w-5 h-5 text-blue-400" />;
  };

  const getPlayerTypeLabel = () => {
    if (player.type === 'ai' && player.aiDifficulty) {
      return `AI (${player.aiDifficulty.charAt(0).toUpperCase() + player.aiDifficulty.slice(1)})`;
    }
    return 'Human';
  };

  const getDifficultyColor = () => {
    if (player.type !== 'ai') return 'text-blue-400';
    
    switch (player.aiDifficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'expert': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div
      className={`
        relative bg-gray-800 rounded-lg p-4 shadow-lg border-2 transition-all duration-300
        ${isCurrentPlayer 
          ? 'border-blue-400 shadow-blue-400/20' 
          : 'border-gray-600'
        }
        ${isWinner 
          ? 'ring-2 ring-yellow-400 ring-opacity-50' 
          : ''
        }
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Winner Crown */}
      {isWinner && (
        <motion.div
          className="absolute -top-3 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.5 }}
        >
          <Crown className="w-6 h-6 text-yellow-400 fill-current" />
        </motion.div>
      )}

      {/* Current Player Indicator */}
      {isCurrentPlayer && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getPlayerIcon()}
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              {player.name}
            </h3>
            <p className={`text-xs ${getDifficultyColor()}`}>
              {getPlayerTypeLabel()}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center space-x-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              {player.score}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {Math.round(scorePercentage)}% of total
          </p>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Pairs Found</span>
          <span>{player.score}/{totalPairs}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`
              h-full rounded-full
              ${player.type === 'ai' 
                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }
            `}
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Recent Matches */}
      {player.matches.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 font-medium">Recent Matches:</p>
          <div className="flex flex-wrap gap-1">
            {player.matches.slice(-3).map((match, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-1 bg-gray-700 rounded px-2 py-1 text-xs"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className={match[0].color === 'red' ? 'text-red-400' : 'text-gray-300'}>
                  {match[0].rank}
                </span>
                <span className="text-gray-500">+</span>
                <span className={match[1].color === 'red' ? 'text-red-400' : 'text-gray-300'}>
                  {match[1].rank}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI Status Indicator */}
      {player.type === 'ai' && isCurrentPlayer && (
        <motion.div
          className="mt-2 flex items-center space-x-2 text-xs text-blue-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Target className="w-3 h-3" />
          <span>AI Calculating...</span>
        </motion.div>
      )}

      {/* Performance Stats for AI */}
      {player.type === 'ai' && !isCurrentPlayer && player.matches.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span className={getDifficultyColor()}>
              {Math.round((player.score / (player.matches.length + 1)) * 100)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PlayerScore;
