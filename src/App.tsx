import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, BarChart3, Play, Users, Home, Bot } from 'lucide-react';

// Components
import GameBoard from './components/GameBoard';
import PlayerScore from './components/PlayerScore';
import GameSettings from './components/GameSettings';
import { Statistics } from './components/Statistics';
import { AchievementNotification } from './components/AchievementSystem';

// Hooks and Utils
import { useGameLogic } from './hooks/useGameLogic';
import { useAppData } from './hooks/useLocalStorage';
import { useSoundSystem } from './hooks/useSoundSystem';

// Types
import { 
  GameMode, 
  Achievement,
  MatchType,
  BoardSize,
  AIDifficulty,
  AIVsAIConfig
} from './types/game.types';

interface AppState {
  currentScreen: 'menu' | 'game' | 'settings' | 'statistics';
  gameMode: GameMode;
  isSettingsOpen: boolean;
  isStatisticsOpen: boolean;
  showAchievement: Achievement | null;
}

interface GameConfig {
  gameMode: GameMode;
  matchType: MatchType;
  boardSize: BoardSize;
  player1Name: string;
  player2Name?: string;
  aiDifficulty?: AIDifficulty;
  aiVsAiConfig?: AIVsAIConfig;
}

const App: React.FC = () => {
  const { settings, updateSetting } = useAppData();
  const { playSound } = useSoundSystem();

  // Game logic hook
  const gameLogic = useGameLogic();

  // App state
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'menu',
    gameMode: 'ai',
    isSettingsOpen: false,
    isStatisticsOpen: false,
    showAchievement: null
  });

  // Theme effect - apply theme classes to document
  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove('dark', 'theme-minimalist', 'theme-cyberpunk', 'theme-neon', 'theme-forest');
    
    // Add current theme class
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme !== 'light') {
      document.documentElement.classList.add(`theme-${settings.theme}`);
    }
  }, [settings.theme]);  // Achievement checking
  useEffect(() => {
    if (gameLogic.gameState?.gameStatus === 'finished') {
      // Check for new achievements when game finishes
      playSound('cardFlip');
    }
  }, [gameLogic.gameState?.gameStatus, playSound]);

  // Handle screen changes
  const navigateToScreen = useCallback((screen: AppState['currentScreen']) => {
    playSound('buttonClick');
    
    // End current game when going back to menu
    if (screen === 'menu' && appState.currentScreen === 'game') {
      gameLogic.endGame();
    }
    
    setAppState(prev => ({ ...prev, currentScreen: screen }));
  }, [playSound, appState.currentScreen, gameLogic]);
  // Start new game
  const startNewGame = useCallback((config: GameConfig) => {
    playSound('buttonClick');
    
    setAppState(prev => ({ 
      ...prev, 
      currentScreen: 'game', 
      gameMode: config.gameMode 
    }));
    
    if (config.gameMode === 'ai-vs-ai' && config.aiVsAiConfig) {
      gameLogic.startNewGame(
        config.gameMode,
        config.matchType,
        config.boardSize,
        'AI Player 1',
        'AI Player 2',
        config.aiVsAiConfig.ai1Difficulty,
        config.aiVsAiConfig.ai2Difficulty
      );
    } else {
      gameLogic.startNewGame(
        config.gameMode,
        config.matchType,
        config.boardSize,
        config.player1Name,
        config.player2Name,
        config.aiDifficulty
      );
    }  }, [gameLogic, playSound]);
  
  // Get theme classes for the main app container
  const getAppThemeClasses = () => {
    switch (settings.theme) {
      case 'light':
        return 'bg-gradient-to-br from-blue-50 to-purple-50';
      case 'dark':
        return 'dark bg-gradient-to-br from-gray-900 to-blue-900';
      case 'minimalist':
        return 'theme-minimalist bg-gray-50';
      case 'cyberpunk':
        return 'theme-cyberpunk bg-black';
      case 'neon':
        return 'theme-neon bg-black';
      case 'forest':
        return 'theme-forest bg-green-50';
      default:
        return 'bg-gradient-to-br from-blue-50 to-purple-50';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getAppThemeClasses()}`}>
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {appState.currentScreen === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              {/* Header */}
              <div className="space-y-4">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Memory Cards
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Test your memory and have fun!
                </p>
              </div>              {/* Main Game Modes */}
              <div className="max-w-md mx-auto space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                  onClick={() => {
                    playSound('buttonClick');
                    setAppState(prev => ({ ...prev, currentScreen: 'game', gameMode: 'ai' }));
                    gameLogic.startNewGame('ai', 'color', '4x4', 'Player 1', undefined, 'medium');
                  }}
                >
                  <Play className="w-6 h-6" />
                  Single Player vs AI
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                  onClick={() => {
                    playSound('buttonClick');
                    setAppState(prev => ({ ...prev, currentScreen: 'game', gameMode: 'local-multiplayer' }));
                    gameLogic.startNewGame('local-multiplayer', 'color', '4x4', 'Player 1', 'Player 2');
                  }}
                >
                  <Users className="w-6 h-6" />
                  Player vs Player
                </motion.button>                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                  onClick={() => {
                    playSound('buttonClick');
                    setAppState(prev => ({ ...prev, currentScreen: 'game', gameMode: 'ai-vs-ai' }));
                    gameLogic.startNewGame('ai-vs-ai', 'color', '4x4', 'AI Player 1', 'AI Player 2', 'medium', 'medium');
                  }}
                >
                  <Bot className="w-6 h-6" />
                  AI vs AI
                </motion.button>
              </div>{/* Secondary Options */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium shadow hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => setAppState(prev => ({ ...prev, isSettingsOpen: true }))}
                >
                  <Settings className="w-5 h-5" />
                  Custom Game
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium shadow hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => setAppState(prev => ({ ...prev, isStatisticsOpen: true }))}
                >
                  <BarChart3 className="w-5 h-5" />
                  Statistics
                </motion.button>
              </div>

              {/* Theme Selector */}
              <div className="max-w-md mx-auto space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Choose Theme</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'minimalist', label: 'Minimal' },
                    { value: 'cyberpunk', label: 'Cyber' },
                    { value: 'neon', label: 'Neon' },
                    { value: 'forest', label: 'Forest' }
                  ].map((theme) => (
                    <motion.button
                      key={theme.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        updateSetting('theme', theme.value as any);
                        playSound('cardFlip');
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        settings.theme === theme.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {theme.label}
                    </motion.button>                ))}
                </div>
              </div>
            </motion.div>
          )}

          {appState.currentScreen === 'game' && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              {/* Game Header */}
              <div className="flex justify-between items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToScreen('menu')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Menu
                </motion.button>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => gameLogic.resetGame()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reset Game
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAppState(prev => ({ ...prev, isSettingsOpen: true }))}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Settings
                  </motion.button>
                </div>
              </div>

              {/* Player Scores */}
              <div className="flex justify-center gap-4">
                {gameLogic.gameState && gameLogic.gameState.players && 
                 Array.isArray(gameLogic.gameState.players) &&                 gameLogic.gameState.players
                   .filter((player: any) => player && typeof player === 'object' && player.id && player.name)
                   .map((player: any) => (
                  <PlayerScore
                    key={player.id}
                    player={player}
                    isCurrentPlayer={gameLogic.gameState!.currentPlayer === player.id}
                    totalPairs={Math.floor(gameLogic.gameState!.cards.length / 2)}
                    gameMode={gameLogic.gameState!.gameMode === 'ai' ? 'ai' :
                             gameLogic.gameState!.gameMode === 'local-multiplayer' ? 'local-multiplayer' : 'local-multiplayer'}
                  />
                ))}
              </div>

              {/* Game Board */}
              {gameLogic.gameState && (
                <GameBoard
                  gameState={gameLogic.gameState}
                  onCardClick={gameLogic.flipCard}
                  isProcessingAI={gameLogic.isProcessingAI}
                  isProcessingCards={gameLogic.isProcessingCards}
                  lastFlippedCards={gameLogic.lastFlippedCards}
                  onRestart={() => gameLogic.resetGame()}
                  onBackToMenu={() => navigateToScreen('menu')}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {appState.isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setAppState(prev => ({ ...prev, isSettingsOpen: false }))}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              >                <GameSettings
                  isOpen={true}
                  onClose={() => setAppState(prev => ({ ...prev, isSettingsOpen: false }))}
                  onStartGame={startNewGame}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics Modal */}
        <AnimatePresence>
          {appState.isStatisticsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setAppState(prev => ({ ...prev, isStatisticsOpen: false }))}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <Statistics
                  isOpen={true}
                  onClose={() => setAppState(prev => ({ ...prev, isStatisticsOpen: false }))}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievement Notification */}
        <AnimatePresence>
          {appState.showAchievement && (
            <AchievementNotification
              achievement={appState.showAchievement}
              isVisible={true}
              onClose={() => setAppState(prev => ({ ...prev, showAchievement: null }))}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
