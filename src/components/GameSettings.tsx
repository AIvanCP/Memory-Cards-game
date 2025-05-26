import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Zap, 
  Clock, 
  Lightbulb, 
  Palette,
  Users,
  Bot,
  Play,
  RotateCcw,
  X
} from 'lucide-react';
import { GameMode, MatchType, BoardSize, AIDifficulty, AIVsAIConfig } from '../types/game.types';
import { useAppData } from '../hooks/useLocalStorage';

interface GameSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: GameConfig) => void;
  currentGameState?: any;
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

const GameSettings: React.FC<GameSettingsProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentGameState
}) => {
  const { settings, updateSetting } = useAppData();
    // Game configuration state
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    gameMode: 'ai',
    matchType: 'color',
    boardSize: '4x4',
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    aiDifficulty: 'medium',
    aiVsAiConfig: {
      ai1Difficulty: 'medium',
      ai2Difficulty: 'medium',
      gameSpeed: 'normal',
      autoRestart: false
    }
  });

  const [activeTab, setActiveTab] = useState<'game' | 'settings'>('game');

  const handleStartGame = () => {
    onStartGame(gameConfig);
    onClose();
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 50 }
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-game-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Game Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-600">
              <button
                onClick={() => setActiveTab('game')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'game'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Play className="w-4 h-4 inline mr-2" />
                New Game
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Preferences
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <AnimatePresence mode="wait">
                {activeTab === 'game' && (
                  <motion.div
                    key="game"
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    {/* Game Mode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Game Mode
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">                        {[
                          { value: 'ai', label: 'vs AI', icon: Bot, desc: 'Play against computer' },
                          { value: 'local-multiplayer', label: 'Local 2P', icon: Users, desc: 'Pass and play' },
                          { value: 'ai-vs-ai', label: 'AI vs AI', icon: Bot, desc: 'Watch AIs compete' }
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => setGameConfig(prev => ({ ...prev, gameMode: mode.value as GameMode }))}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              gameConfig.gameMode === mode.value
                                ? 'border-blue-400 bg-blue-400/10'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <mode.icon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                            <div className="text-sm font-medium text-white">{mode.label}</div>
                            <div className="text-xs text-gray-400">{mode.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Difficulty (if AI mode) */}
                    {gameConfig.gameMode === 'ai' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          AI Difficulty
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { value: 'easy', label: 'Easy', color: 'text-green-400' },
                            { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
                            { value: 'hard', label: 'Hard', color: 'text-orange-400' },
                            { value: 'expert', label: 'Expert', color: 'text-red-400' }
                          ].map((difficulty) => (
                            <button
                              key={difficulty.value}
                              onClick={() => setGameConfig(prev => ({ ...prev, aiDifficulty: difficulty.value as AIDifficulty }))}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                gameConfig.aiDifficulty === difficulty.value
                                  ? 'border-blue-400 bg-blue-400/10'
                                  : 'border-gray-600 hover:border-gray-500'
                              }`}
                            >
                              <div className={`text-sm font-medium ${difficulty.color}`}>
                                {difficulty.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>                    )}

                    {/* AI vs AI Configuration */}
                    {gameConfig.gameMode === 'ai-vs-ai' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            AI 1 Difficulty
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { value: 'easy', label: 'Easy', color: 'text-green-400' },
                              { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
                              { value: 'hard', label: 'Hard', color: 'text-orange-400' },
                              { value: 'expert', label: 'Expert', color: 'text-red-400' }
                            ].map((difficulty) => (
                              <button
                                key={difficulty.value}
                                onClick={() => setGameConfig(prev => ({ 
                                  ...prev, 
                                  aiVsAiConfig: { 
                                    ...prev.aiVsAiConfig!, 
                                    ai1Difficulty: difficulty.value as AIDifficulty 
                                  } 
                                }))}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  gameConfig.aiVsAiConfig?.ai1Difficulty === difficulty.value
                                    ? 'border-blue-400 bg-blue-400/10'
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                              >
                                <div className={`text-sm font-medium ${difficulty.color}`}>
                                  {difficulty.label}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            AI 2 Difficulty
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { value: 'easy', label: 'Easy', color: 'text-green-400' },
                              { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
                              { value: 'hard', label: 'Hard', color: 'text-orange-400' },
                              { value: 'expert', label: 'Expert', color: 'text-red-400' }
                            ].map((difficulty) => (
                              <button
                                key={difficulty.value}
                                onClick={() => setGameConfig(prev => ({ 
                                  ...prev, 
                                  aiVsAiConfig: { 
                                    ...prev.aiVsAiConfig!, 
                                    ai2Difficulty: difficulty.value as AIDifficulty 
                                  } 
                                }))}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  gameConfig.aiVsAiConfig?.ai2Difficulty === difficulty.value
                                    ? 'border-blue-400 bg-blue-400/10'
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                              >
                                <div className={`text-sm font-medium ${difficulty.color}`}>
                                  {difficulty.label}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Game Speed
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'slow', label: 'Slow', desc: 'Easy to follow' },
                              { value: 'normal', label: 'Normal', desc: 'Standard pace' },
                              { value: 'fast', label: 'Fast', desc: 'Quick matches' }
                            ].map((speed) => (
                              <button
                                key={speed.value}
                                onClick={() => setGameConfig(prev => ({ 
                                  ...prev, 
                                  aiVsAiConfig: { 
                                    ...prev.aiVsAiConfig!, 
                                    gameSpeed: speed.value as 'slow' | 'normal' | 'fast'
                                  } 
                                }))}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  gameConfig.aiVsAiConfig?.gameSpeed === speed.value
                                    ? 'border-blue-400 bg-blue-400/10'
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                              >
                                <div className="text-sm font-medium text-white">{speed.label}</div>
                                <div className="text-xs text-gray-400">{speed.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={gameConfig.aiVsAiConfig?.autoRestart || false}
                              onChange={(e) => setGameConfig(prev => ({ 
                                ...prev, 
                                aiVsAiConfig: { 
                                  ...prev.aiVsAiConfig!, 
                                  autoRestart: e.target.checked 
                                } 
                              }))}
                              className="w-4 h-4 text-blue-400 bg-gray-700 border-gray-600 rounded focus:ring-blue-400 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-gray-300">Auto-restart games</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Match Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Match Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: 'color', label: 'Color Match', desc: 'Red with red, black with black' },
                          { value: 'rank', label: 'Rank Match', desc: 'Same numbers/face cards' },
                          { value: 'suit', label: 'Suit Match', desc: 'Same suit symbols' }
                        ].map((match) => (
                          <button
                            key={match.value}
                            onClick={() => setGameConfig(prev => ({ ...prev, matchType: match.value as MatchType }))}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              gameConfig.matchType === match.value
                                ? 'border-blue-400 bg-blue-400/10'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div className="text-sm font-medium text-white">{match.label}</div>
                            <div className="text-xs text-gray-400">{match.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Board Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Board Size
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: '4x4', label: '4×4', desc: '16 cards (Easy)' },
                          { value: '4x6', label: '4×6', desc: '24 cards (Medium)' },
                          { value: '6x6', label: '6×6', desc: '36 cards (Hard)' }
                        ].map((size) => (
                          <button
                            key={size.value}
                            onClick={() => setGameConfig(prev => ({ ...prev, boardSize: size.value as BoardSize }))}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              gameConfig.boardSize === size.value
                                ? 'border-blue-400 bg-blue-400/10'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div className="text-sm font-medium text-white">{size.label}</div>
                            <div className="text-xs text-gray-400">{size.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Player Names */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Player 1 Name
                        </label>
                        <input
                          type="text"
                          value={gameConfig.player1Name}
                          onChange={(e) => setGameConfig(prev => ({ ...prev, player1Name: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                          placeholder="Enter player 1 name"
                        />
                      </div>

                      {gameConfig.gameMode === 'local-multiplayer' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Player 2 Name
                          </label>
                          <input
                            type="text"
                            value={gameConfig.player2Name}
                            onChange={(e) => setGameConfig(prev => ({ ...prev, player2Name: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                            placeholder="Enter player 2 name"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    {/* Sound Settings */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {settings.soundEnabled ? (
                          <Volume2 className="w-5 h-5 text-blue-400" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">Sound Effects</div>
                          <div className="text-xs text-gray-400">Card flips and game sounds</div>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.soundEnabled ? 'bg-blue-400' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Animation Speed */}
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-white">Animation Speed</div>
                          <div className="text-xs text-gray-400">Card flip animation speed</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['slow', 'normal', 'fast'].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => updateSetting('animationSpeed', speed as any)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              settings.animationSpeed === speed
                                ? 'bg-blue-400 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {speed.charAt(0).toUpperCase() + speed.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Show Timer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-white">Show Timer</div>
                          <div className="text-xs text-gray-400">Display game timer</div>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('showTimer', !settings.showTimer)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.showTimer ? 'bg-blue-400' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            settings.showTimer ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Hints */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Lightbulb className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-white">Enable Hints</div>
                          <div className="text-xs text-gray-400">Show hint button in game</div>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('hintsEnabled', !settings.hintsEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.hintsEnabled ? 'bg-blue-400' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            settings.hintsEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>                    {/* App Theme */}
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <Palette className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-white">App Theme</div>
                          <div className="text-xs text-gray-400">Overall visual theme</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'light', label: 'Light', desc: 'Clean light theme' },
                          { value: 'dark', label: 'Dark', desc: 'Modern dark theme' },
                          { value: 'minimalist', label: 'Minimalist', desc: 'Simple and clean' },
                          { value: 'cyberpunk', label: 'Cyberpunk', desc: 'Futuristic neon' },
                          { value: 'neon', label: 'Neon', desc: 'Bright neon colors' },
                          { value: 'forest', label: 'Forest', desc: 'Natural green tones' }
                        ].map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => updateSetting('theme', theme.value as any)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              settings.theme === theme.value
                                ? 'border-blue-400 bg-blue-400/10'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div className="text-sm font-medium text-white">{theme.label}</div>
                            <div className="text-xs text-gray-400">{theme.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Theme */}
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <Palette className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-white">Card Theme</div>
                          <div className="text-xs text-gray-400">Visual style of cards</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['classic', 'modern', 'minimal'].map((theme) => (
                          <button
                            key={theme}
                            onClick={() => updateSetting('cardTheme', theme as any)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              settings.cardTheme === theme
                                ? 'bg-blue-400 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-600">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              {activeTab === 'game' && (
                <button
                  onClick={handleStartGame}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Game</span>
                </button>
              )}

              {currentGameState && activeTab === 'game' && (
                <button
                  onClick={() => {
                    // This would restart with current settings
                    onClose();
                  }}
                  className="px-4 py-2 text-orange-400 hover:text-orange-300 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart Current</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameSettings;
