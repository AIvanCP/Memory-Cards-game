import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Trophy, Target, Clock, TrendingUp, Download, Upload, Trash2 } from 'lucide-react';
import { Achievement } from '../types/game.types';
import { useAppData } from '../hooks/useLocalStorage';

interface StatisticsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatTabProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const StatTab: React.FC<StatTabProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color = 'blue' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      {icon && <div className={`text-${color}-500`}>{icon}</div>}
    </div>
    <div className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
      {value}
    </div>
    {subtitle && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    )}
  </div>
);

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-l-4 ${
      achievement.unlockedAt ? 'border-yellow-500' : 'border-gray-300'
    }`}
  >
    <div className="flex items-center space-x-3">
      <div className={`text-2xl ${achievement.unlockedAt ? 'grayscale-0' : 'grayscale'}`}>
        {achievement.icon}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${
          achievement.unlockedAt ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {achievement.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {achievement.description}
        </p>
        {achievement.unlockedAt && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      {achievement.unlockedAt && (
        <Trophy className="w-5 h-5 text-yellow-500" />
      )}
    </div>
  </motion.div>
);

export const Statistics: React.FC<StatisticsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'data'>('overview');
  const { statistics, achievements, exportData, importData, clearAll } = useAppData();

  const handleExportData = () => {
    exportData();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAll();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Game Statistics
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <StatTab
                icon={<BarChart3 className="w-4 h-4" />}
                label="Overview"
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              />
              <StatTab
                icon={<Trophy className="w-4 h-4" />}
                label="Achievements"
                isActive={activeTab === 'achievements'}
                onClick={() => setActiveTab('achievements')}
              />
              <StatTab
                icon={<Download className="w-4 h-4" />}
                label="Data"
                isActive={activeTab === 'data'}
                onClick={() => setActiveTab('data')}
              />
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* General Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    General Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Games Played"
                      value={statistics.gamesPlayed}
                      icon={<Target className="w-5 h-5" />}
                      color="blue"
                    />
                    <StatCard
                      title="Win Rate"
                      value={`${(statistics.winRate * 100).toFixed(1)}%`}
                      subtitle={`${statistics.gamesWon} wins`}
                      icon={<Trophy className="w-5 h-5" />}
                      color="green"
                    />
                    <StatCard
                      title="Best Time"
                      value={statistics.bestTime ? formatTime(statistics.bestTime) : '--:--'}
                      icon={<Clock className="w-5 h-5" />}
                      color="purple"
                    />
                    <StatCard
                      title="Current Streak"
                      value={statistics.currentStreak}
                      subtitle={`Best: ${statistics.bestStreak}`}
                      icon={<TrendingUp className="w-5 h-5" />}
                      color="orange"
                    />
                  </div>
                </div>

                {/* Performance Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      title="Perfect Games"
                      value={statistics.perfectGames}
                      subtitle="No wrong matches"
                      color="yellow"
                    />
                    <StatCard
                      title="Total Matches"
                      value={statistics.matchesMade}
                      color="indigo"
                    />
                    <StatCard
                      title="Average Time"
                      value={statistics.averageTime ? formatTime(statistics.averageTime) : '--:--'}
                      color="pink"
                    />
                  </div>
                </div>

                {/* Game Mode Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    By Game Mode
                  </h3>                  <div className="space-y-3">
                    {Object.entries(statistics.gamesByMode).map(([mode, stats]) => (
                      <div key={mode} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {mode.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {mode === 'aiVsAi' ? (
                              <>
                                {stats.played} played • {'watched' in stats ? stats.watched : 0} watched
                              </>
                            ) : (
                              <>
                                {stats.played} played • {'won' in stats ? stats.won : 0} won •{' '}
                                {stats.played > 0 ? (('won' in stats ? stats.won : 0) / stats.played * 100).toFixed(1) : 0}% win rate
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    By Difficulty
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(statistics.gamesByDifficulty).map(([difficulty, stats]) => (
                      <div key={difficulty} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {difficulty}
                          </span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.played} played • {stats.won} won •{' '}
                            {stats.played > 0 ? ((stats.won / stats.played) * 100).toFixed(1) : 0}% win rate
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Achievements
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {achievements.filter(a => a.unlockedAt).length} / {achievements.length} unlocked
                  </span>
                </div>
                
                {achievements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No achievements available yet. Start playing to unlock them!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {achievements
                      .sort((a, b) => {
                        if (a.unlockedAt && !b.unlockedAt) return -1;
                        if (!a.unlockedAt && b.unlockedAt) return 1;
                        return 0;
                      })
                      .map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Data Management
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Export your game data for backup or import previously saved data.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Export Data
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Download all your game statistics, settings, and achievements.
                    </p>
                    <button
                      onClick={handleExportData}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Data</span>
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Import Data
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Restore your data from a previously exported file.
                    </p>
                    <label className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Import Data</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">
                      Clear All Data
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                      Permanently delete all your statistics, settings, and achievements. This action cannot be undone.
                    </p>
                    <button
                      onClick={handleClearData}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
