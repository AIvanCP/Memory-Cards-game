import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { GameState, Card as CardType } from '../types/game.types';
import Card from './Card';
import { getBoardDimensions } from '../utils/cardUtils';
import { isGameDraw } from '../utils/gameLogic';
import { useGameSounds } from '../hooks/useSoundSystem';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (index: number) => void;
  isProcessingAI?: boolean;
  isProcessingCards?: boolean;
  lastFlippedCards?: CardType[];
  onRestart?: () => void;
  onBackToMenu?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  isProcessingAI = false,
  isProcessingCards = false,
  lastFlippedCards = [],
  onRestart,
  onBackToMenu
}) => {
  const [hintCards, setHintCards] = useState<Set<number>>(new Set());
  const [showingHint, setShowingHint] = useState(false);
  const { cardFlip, match, mismatch, gameWin, gameLose } = useGameSounds();

  const { rows, cols } = getBoardDimensions(gameState.boardSize);
  // Handle card click with sound effects
  const handleCardClick = useCallback((index: number) => {
    if (gameState.gameStatus !== 'playing' || isProcessingAI || isProcessingCards) return;
    
    cardFlip();
    onCardClick(index);
  }, [gameState.gameStatus, isProcessingAI, isProcessingCards, onCardClick, cardFlip]);

  // Show hint functionality
  const showHint = useCallback(() => {
    if (!gameState.settings.hintsEnabled || showingHint) return;

    const { cards, matchType } = gameState;
    const unmatched = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !card.isMatched && !card.isFlipped);
    
    // Find a valid pair
    for (let i = 0; i < unmatched.length; i++) {
      for (let j = i + 1; j < unmatched.length; j++) {
        const { card: card1, index: index1 } = unmatched[i];
        const { card: card2, index: index2 } = unmatched[j];
        
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

        if (isMatch) {
          setHintCards(new Set([index1, index2]));
          setShowingHint(true);
          
          // Hide hint after 3 seconds
          setTimeout(() => {
            setHintCards(new Set());
            setShowingHint(false);
          }, 3000);
          
          return;
        }
      }
    }
  }, [gameState, showingHint]);

  // Check if a card was last flipped
  const isLastFlippedCard = useCallback((cardId: string) => {
    return lastFlippedCards.some(card => card.id === cardId);
  }, [lastFlippedCards]);

  // Play sound effects for game events
  useEffect(() => {
    if (gameState.flippedCards.length === 2) {
      const [card1, card2] = gameState.flippedCards;
      const isMatch = gameState.matchedPairs.some(pair => 
        pair.some(c => c.id === card1.id) && pair.some(c => c.id === card2.id)
      );
      
      setTimeout(() => {
        if (isMatch) {
          match();
        } else {
          mismatch();
        }
      }, 600);
    }
  }, [gameState.flippedCards, gameState.matchedPairs, match, mismatch]);  // Play game end sounds
  useEffect(() => {
    if (gameState.gameStatus === 'finished') {      const humanPlayer = gameState.players.find(p => p.type === 'human');
      
      // Check for draw
      const isDraw = isGameDraw(gameState);
      
      const winner = gameState.players.reduce((prev, current) => 
        prev.score > current.score ? prev : current
      );
      
      setTimeout(() => {
        if (isDraw) {
          // Play a neutral sound for draws, or use the win sound
          gameWin(); // You could create a separate draw sound if desired
        } else if (humanPlayer && winner.type === 'human') {
          gameWin();
        } else {
          gameLose();
        }
      }, 1000);
    }
  }, [gameState, gameWin, gameLose]);
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  const isHumanTurn = currentPlayer?.type === 'human';

  // Get theme class
  const getThemeClass = () => {
    switch (gameState.settings.theme) {
      case 'minimalist': return 'theme-minimalist';
      case 'cyberpunk': return 'theme-cyberpunk';
      case 'neon': return 'theme-neon';
      case 'forest': return 'theme-forest';
      case 'dark': return 'dark';
      default: return '';
    }
  };

  return (
    <motion.div 
      className={`space-y-4 transition-colors duration-300 pb-20 ${getThemeClass()} ${
        gameState.settings.theme === 'light' || gameState.settings.theme === 'minimalist' 
          ? 'bg-gray-50' 
          : gameState.settings.theme === 'dark'
          ? 'bg-gray-900'
          : ''
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >{/* Game Controls */}
      <div className="flex justify-center items-center space-x-4">
        {gameState.settings.hintsEnabled && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={showHint}
            disabled={showingHint || !isHumanTurn}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${showingHint || !isHumanTurn
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }
            `}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Hint</span>
          </motion.button>
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-2 max-w-md mx-auto">
        {/* Match Counter */}
        <div className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
          {gameState.matchedPairs.length} / {gameState.cards.length / 2} pairs found
        </div>
        
        {/* Progress Bar */}
        <motion.div
          className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(gameState.matchedPairs.length / (gameState.cards.length / 2)) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>
      </div>{/* Game Board */}
      <motion.div
        className={`
          grid gap-1 sm:gap-2 lg:gap-3 max-w-3xl mx-auto
          ${cols === 4 ? 'grid-cols-4' : cols === 6 ? 'grid-cols-6' : 'grid-cols-4'}
        `}
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          aspectRatio: `${cols}/${rows}`
        } as React.CSSProperties}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence>
          {gameState.cards.map((card, index) => (
            <motion.div
              key={card.id}
              className="aspect-[2.5/3.5]"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card
                card={card}
                index={index}
                onClick={handleCardClick}
                isFlippable={isHumanTurn && !isProcessingAI}
                animationSpeed={gameState.settings.animationSpeed}
                cardTheme={gameState.settings.cardTheme}
                showHint={hintCards.has(index)}
                isLastFlipped={isLastFlippedCard(card.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>      </motion.div>

      {/* Hint Display */}
      {hintCards.size > 0 && (
        <motion.div
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          💡 Hint: Check the highlighted cards!
        </motion.div>
      )}

      {/* Game Finished Overlay */}
      <AnimatePresence>
        {gameState.gameStatus === 'finished' && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md mx-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >              <div className="mb-6">                {(() => {
                  const winner = gameState.players.reduce((prev, current) => 
                    prev.score > current.score ? prev : current
                  );
                  
                  // Check for draw
                  const isDraw = isGameDraw(gameState);
                  const maxScore = Math.max(...gameState.players.map(p => p.score));
                  const winners = gameState.players.filter(p => p.score === maxScore);
                  
                  const humanPlayer = gameState.players.find(p => p.type === 'human');
                  const isHumanWinner = humanPlayer && winner.type === 'human' && !isDraw;
                  
                  if (isDraw) {
                    return (
                      <>
                        <div className="text-6xl mb-4">
                          🤝
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          It's a Draw!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {winners.map(w => w.name).join(' and ')} tied with {maxScore} pairs each!
                        </p>
                      </>
                    );
                  }
                  
                  return (
                    <>
                      <div className="text-6xl mb-4">
                        {isHumanWinner ? '🏆' : '🤖'}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {isHumanWinner ? 'Congratulations!' : 'Game Over'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {winner.name} wins with {winner.score} pairs!
                      </p>
                    </>
                  );
                })()}
              </div><div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRestart}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToMenu}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Back to Menu
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Processing Indicator */}
      {isProcessingAI && (
        <motion.div
          className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>AI is thinking...</span>
        </motion.div>      )}
    </motion.div>
  );
};

export default GameBoard;
