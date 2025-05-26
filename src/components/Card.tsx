import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../types/game.types';
import { getSuitSymbol, getCardThemeClasses } from '../utils/cardUtils';

interface CardProps {
  card: CardType;
  index: number;
  onClick: (index: number) => void;
  isFlippable: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  cardTheme: string;
  showHint?: boolean;
  isLastFlipped?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  index,
  onClick,
  isFlippable,
  animationSpeed,
  cardTheme,
  showHint = false,
  isLastFlipped = false
}) => {
  const themeClasses = getCardThemeClasses(cardTheme);
  
  const animationDuration = {
    slow: 0.8,
    normal: 0.6,
    fast: 0.4
  }[animationSpeed];

  const handleClick = () => {
    if (isFlippable && !card.isFlipped && !card.isMatched) {
      onClick(index);
    }
  };
  const cardVariants = {
    hidden: { rotateY: 0 },
    visible: { rotateY: 180 },
    matched: { 
      scale: [1, 1.1, 1],
      transition: { duration: 0.5 }
    },
    shake: {
      x: [-3, 3, -3, 3, 0],
      transition: { duration: 0.4 }
    },
    hint: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0px rgba(59, 130, 246, 0)',
        '0 0 20px rgba(59, 130, 246, 0.6)',
        '0 0 0px rgba(59, 130, 246, 0)'
      ],
      transition: { duration: 1.5, repeat: Infinity }
    }
  };

  const isFlipped = card.isFlipped || card.isMatched;
  const isClickable = isFlippable && !card.isFlipped && !card.isMatched;

  return (
    <motion.div
      className={`
        relative w-full h-full cursor-pointer select-none
        ${isClickable ? 'hover:scale-105' : ''}
        ${showHint ? 'z-10' : ''}
      `}
      style={{ perspective: '1000px' }}
      onClick={handleClick}
      variants={cardVariants}
      animate={
        showHint ? 'hint' :
        card.isMatched && isLastFlipped ? 'matched' :
        isLastFlipped && !card.isMatched ? 'shake' :
        'hidden'
      }
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
    >      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ 
          duration: animationDuration, 
          ease: 'easeInOut',
          type: 'spring',
          stiffness: 300,
          damping: 25
        }}
        style={{ transformStyle: 'preserve-3d' } as any}
      >
        {/* Card Back */}
        <div
          className={`
            absolute inset-0 w-full h-full rounded-lg
            ${themeClasses.back}
            border-2 border-opacity-30 border-white
            flex items-center justify-center
            shadow-lg
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-white text-opacity-20 text-4xl font-bold">
            🂠
          </div>
        </div>

        {/* Card Front */}
        <div
          className={`
            absolute inset-0 w-full h-full rounded-lg
            ${themeClasses.card}
            border-2 border-gray-300
            flex flex-col items-center justify-center
            shadow-lg
            ${card.isMatched ? 'ring-2 ring-green-400 ring-opacity-75' : ''}
          `}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >          {/* Rank */}
          <div className={`
            text-2xl sm:text-3xl lg:text-4xl font-bold
            ${themeClasses.suit[card.suit]}
          `}>
            {card.rank}
          </div>
          
          {/* Suit Symbol */}
          <div className="text-xl sm:text-2xl lg:text-3xl">
            {getSuitSymbol(card.suit)}
          </div>

          {/* Corner indicators */}
          <div className={`
            absolute top-1 left-1 text-xs font-semibold
            ${themeClasses.suit[card.suit]}
          `}>
            {card.rank}
          </div>
          <div className={`
            absolute bottom-1 right-1 text-xs transform rotate-180
            ${themeClasses.suit[card.suit]}
          `}>
            {card.rank}
          </div>

          {/* Match indicator */}
          {card.isMatched && (
            <motion.div
              className="absolute inset-0 bg-green-400 bg-opacity-20 rounded-lg flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-green-600 text-2xl">✓</div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Selection indicator */}
      {card.isFlipped && !card.isMatched && (
        <motion.div
          className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Hint glow effect */}      {showHint && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none border-2 border-blue-500 shadow-lg shadow-blue-500/50"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.div>
  );
};

export default Card;
