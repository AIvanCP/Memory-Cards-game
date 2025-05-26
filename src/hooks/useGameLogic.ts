import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Card, GameMode, MatchType, BoardSize, AIDifficulty } from '../types/game.types';
import { initializeGame, handleCardFlip, isGameFinished, getGameWinner, calculateGameStats, isGameDraw } from '../utils/gameLogic';
import { AIPlayer } from '../utils/aiLogic';
import { useAppData } from './useLocalStorage';

/**
 * Main game logic hook
 */
export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiPlayer, setAiPlayer] = useState<AIPlayer | null>(null);
  const [aiPlayer2, setAiPlayer2] = useState<AIPlayer | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [lastFlippedCards, setLastFlippedCards] = useState<Card[]>([]);
  const [isProcessingCards, setIsProcessingCards] = useState(false);
  const { updateStatistics, checkAchievements, setItem, settings, statistics } = useAppData();
  const aiMoveTimeoutRef = useRef<number>();
  const aiWatchdogTimeoutRef = useRef<number>();
  
  const scheduleAIMoveRef = useRef<((gameState: GameState) => void) | null>(null);
  const handleGameCompleteRef = useRef<((gameState: GameState) => void) | null>(null);

  const startNewGame = useCallback((
    gameMode: GameMode,
    matchType: MatchType,
    boardSize: BoardSize,
    player1Name: string,
    player2Name?: string,
    aiDifficulty?: AIDifficulty,
    ai2Difficulty?: AIDifficulty
  ) => {
    const newGameState = initializeGame(
      gameMode,
      matchType,
      boardSize,
      player1Name,
      player2Name,
      aiDifficulty,
      ai2Difficulty
    );
    
    setGameState(newGameState);
    setLastFlippedCards([]);
    
    if (gameMode === 'ai' && aiDifficulty) {
      const newAiPlayer = new AIPlayer(aiDifficulty);
      setAiPlayer(newAiPlayer);
      setAiPlayer2(null);
    } else if (gameMode === 'ai-vs-ai' && aiDifficulty && ai2Difficulty) {
      const newAiPlayer1 = new AIPlayer(aiDifficulty);
      const newAiPlayer2 = new AIPlayer(ai2Difficulty);
      setAiPlayer(newAiPlayer1);
      setAiPlayer2(newAiPlayer2);
    } else {
      setAiPlayer(null);
      setAiPlayer2(null);
    }
    
    setItem('memory-card-game-saved', newGameState);
  }, [setItem]);

  const flipCard = useCallback((cardIndex: number) => {
    if (!gameState || isProcessingAI || isProcessingCards) return;

    const newGameState = handleCardFlip(gameState, cardIndex);
    setGameState(newGameState);
    setLastFlippedCards(newGameState.flippedCards);
    setItem('memory-card-game-saved', newGameState);

    if (newGameState.flippedCards.length === 2) {
      setIsProcessingCards(true);
      const [card1, card2] = newGameState.flippedCards;
      let cardsMatch = false;

      if (!card1 || !card2 || !card1.id || !card2.id) {
        console.warn('Invalid flipped cards detected in flipCard:', { card1, card2, flippedCards: newGameState.flippedCards });
        setIsProcessingCards(false);
        return;
      }

      switch (newGameState.matchType) {
        case 'color':
          cardsMatch = card1.color === card2.color;
          break;
        case 'rank':
          cardsMatch = card1.rank === card2.rank;
          break;
        case 'suit':
          cardsMatch = card1.suit === card2.suit;
          break;
      }

      if (!cardsMatch) {
        window.setTimeout(() => {
          if (!card1 || !card2 || !card1.id || !card2.id) {
            console.warn('Invalid cards detected during human mismatch handling:', { card1, card2 });
            setIsProcessingCards(false);
            return;
          }
            const resetCards = newGameState.cards.map(card => {
            if (!card || !card.id) {
              console.warn('Invalid card found in cards array:', card);
              return card;
            }

            // ABSOLUTE RULE: If card is matched, NEVER change it
            if (card.isMatched === true) {
              console.log(`PROTECTION: Keeping matched card unchanged: ${card.id.slice(-4)}`);
              return card; // Keep exactly as is
            }

            // CRITICAL FIX: Reset ALL flipped cards that are not matched
            // This ensures no cards remain in a flipped state after a mismatch
            if (card.isFlipped === true && card.isMatched === false) {
              console.log(`Human mismatch: Resetting flipped unmatched card: ${card.id.slice(-4)}`);
              return { ...card, isFlipped: false };
            }
            return card;
          });

          const resetState = {
            ...newGameState,
            flippedCards: [],
            cards: resetCards
          };
          setGameState(resetState);
          setLastFlippedCards([]);
          setItem('memory-card-game-saved', resetState);
          setIsProcessingCards(false);
            if (resetState.gameMode === 'ai' && resetState.currentPlayer === 'ai') {
            console.log('Human mismatch - auto-start effect will handle AI move');
          } else if (resetState.gameMode === 'ai-vs-ai' && 
                    (resetState.currentPlayer === 'ai1' || resetState.currentPlayer === 'ai2')) {
            console.log('Human mismatch - auto-start effect will handle AI move');
          }
        }, 1500);
        return;
      } else {
        setIsProcessingCards(false);
      }    } else {
      setIsProcessingCards(false);
    }      if (((newGameState.gameMode === 'ai' && newGameState.currentPlayer === 'ai') ||
        (newGameState.gameMode === 'ai-vs-ai' && 
         (newGameState.currentPlayer === 'ai1' || newGameState.currentPlayer === 'ai2'))) &&
        !isGameFinished(newGameState) &&
        newGameState.flippedCards.length === 0) {
      
      console.log('flipCard: Auto-start effect will handle AI move for player:', newGameState.currentPlayer);
    }

    if (isGameFinished(newGameState)) {
      console.log('flipCard: Game finished, triggering game complete');
      handleGameCompleteRef.current?.(newGameState);
    }
  }, [gameState, isProcessingAI, isProcessingCards, setItem]);
  const scheduleAIMove = useCallback((currentGameState: GameState) => {
    // Early exit if game is finished
    if (isGameFinished(currentGameState)) {
      console.log('Game is finished, not scheduling AI move');
      handleGameCompleteRef.current?.(currentGameState);
      return;
    }    // Determine which AI player should make the move
    let currentAI: AIPlayer | null = null;
    if (currentGameState.gameMode === 'ai' && currentGameState.currentPlayer === 'ai') {
      currentAI = aiPlayer;
    } else if (currentGameState.gameMode === 'ai-vs-ai') {
      if (currentGameState.currentPlayer === 'ai1') {
        currentAI = aiPlayer;
      } else if (currentGameState.currentPlayer === 'ai2') {
        currentAI = aiPlayer2;
      }
    }
    
    console.log('AI player selection debug:', {
      gameMode: currentGameState.gameMode,
      currentPlayer: currentGameState.currentPlayer,
      aiPlayer: !!aiPlayer,
      aiPlayer2: !!aiPlayer2,
      selectedAI: !!currentAI,
      aiPlayerType: currentAI?.constructor?.name
    });
    
    if (!currentAI || isProcessingAI) {
      console.log('Cannot make AI move:', {
        currentAI: !!currentAI,
        isProcessingAI,
        aiPlayer: !!aiPlayer,
        aiPlayer2: !!aiPlayer2
      });
      return;
    }
    
    // Check if there are enough available cards
    const availableCards = currentGameState.cards.filter((c: Card) => c && !c.isFlipped && !c.isMatched);
    if (availableCards.length < 2) {
      console.log('Not enough available cards for AI move, ending game');
      handleGameCompleteRef.current?.(currentGameState);
      return;
    }
    
    // CRITICAL: Verify the current state has all matched cards properly preserved
    console.log('AI scheduleAIMove called - verifying state integrity:', {
      totalCards: currentGameState.cards.length,
      matchedCards: currentGameState.cards.filter((c: Card) => c && c.isMatched === true).length,
      flippedCards: currentGameState.cards.filter((c: Card) => c && c.isFlipped === true).length,
      availableCards: availableCards.length,
      currentPlayer: currentGameState.currentPlayer
    });
    
    setIsProcessingAI(true);
    
    if (aiMoveTimeoutRef.current) {
      clearTimeout(aiMoveTimeoutRef.current);
    }
    
    if (aiWatchdogTimeoutRef.current) {
      clearTimeout(aiWatchdogTimeoutRef.current);
    }    aiWatchdogTimeoutRef.current = window.setTimeout(() => {
      console.log('AI watchdog triggered - checking game state');
      setIsProcessingAI(false);
      
      // Check if game is finished before scheduling another move
      if (isGameFinished(currentGameState)) {
        console.log('AI watchdog: Game is finished');
        handleGameCompleteRef.current?.(currentGameState);
        return;
      }
      
      // Check if there are still available cards
      const availableCards = currentGameState.cards.filter((c: Card) => c && !c.isFlipped && !c.isMatched);
      if (availableCards.length < 2) {
        console.log('AI watchdog: Not enough available cards');
        handleGameCompleteRef.current?.(currentGameState);
        return;
      }
        if (((currentGameState.gameMode === 'ai' && currentGameState.currentPlayer === 'ai') ||
          (currentGameState.gameMode === 'ai-vs-ai' && 
           (currentGameState.currentPlayer === 'ai1' || currentGameState.currentPlayer === 'ai2')))) {
        console.log('AI watchdog: Auto-start effect will handle next AI move');
      }
    }, 5000);
      aiMoveTimeoutRef.current = window.setTimeout(async () => {
      try {
        // CRITICAL: Check if game is finished before processing
        if (isGameFinished(currentGameState)) {
          console.log('AI timeout: Game is finished, not making move');
          setIsProcessingAI(false);
          handleGameCompleteRef.current?.(currentGameState);
          return;
        }

        // CRITICAL FIX: Get the absolute latest game state right before AI move
        let latestState: GameState | null = null;
        
        setGameState((prevState: GameState | null) => {
          if (!prevState) return prevState;
          
          latestState = prevState; // Capture the latest state
          
          console.log('AI getting latest state snapshot:', {
            totalCards: prevState.cards.length,
            availableCards: prevState.cards.filter((c: Card) => c && !c.isFlipped && !c.isMatched).length,
            matchedCards: prevState.cards.filter((c: Card) => c && c.isMatched === true).length,
            flippedCards: prevState.cards.filter((c: Card) => c && c.isFlipped === true).length,
            matchedCardsDetailed: prevState.cards.filter((c: Card) => c && c.isMatched === true).map((c: Card) => ({
              id: c.id?.slice(-4),
              isMatched: c.isMatched,
              isFlipped: c.isFlipped
            }))
          });
          
          return prevState; // Return the same state but this ensures we have the latest
        });
          // Wait for state to update and then use it
        setTimeout(async () => {
          if (!latestState) {
            console.error('Failed to get latest state for AI move');
            setIsProcessingAI(false);
            return;
          }

          // Double-check if game is finished with latest state
          if (isGameFinished(latestState)) {
            console.log('AI timeout: Game is finished (latest state check)');
            setIsProcessingAI(false);
            handleGameCompleteRef.current?.(latestState);
            return;
          }

          // First check if we have enough unmatched cards for a valid move
          const availableCards = latestState.cards.filter((c: Card) => c && !c.isFlipped && !c.isMatched);
          if (availableCards.length < 2) {
            console.warn('AI has no valid moves available:', {
              totalCards: latestState.cards.length,
              availableCards: availableCards.length,
              matchedCards: latestState.cards.filter((c: Card) => c && c.isMatched).length,
              flippedCards: latestState.cards.filter((c: Card) => c && c.isFlipped).length
            });
            setIsProcessingAI(false);
            handleGameCompleteRef.current?.(latestState);
            return;
          }

          // Additional null check for currentAI before making the move
          if (!currentAI) {
            console.error('currentAI is null when trying to make move');
            setIsProcessingAI(false);
            return;
          }
        
          const [cardIndex1, cardIndex2] = await currentAI.makeMove(
            latestState.cards,
            latestState.matchType,
            latestState.moveHistory
          );

          console.log('AI SELECTED MOVE - FINAL VERIFICATION:', {
            selectedMove: [cardIndex1, cardIndex2],
            card1State: latestState.cards[cardIndex1] ? {
              id: latestState.cards[cardIndex1].id?.slice(-4),
              isMatched: latestState.cards[cardIndex1].isMatched,
              isFlipped: latestState.cards[cardIndex1].isFlipped
            } : 'INVALID_INDEX',
            card2State: latestState.cards[cardIndex2] ? {
              id: latestState.cards[cardIndex2].id?.slice(-4),
              isMatched: latestState.cards[cardIndex2].isMatched,
              isFlipped: latestState.cards[cardIndex2].isFlipped
            } : 'INVALID_INDEX',
            totalMatchedCards: latestState.cards.filter((c: Card) => c?.isMatched === true).length,
            totalAvailableCards: latestState.cards.filter((c: Card) => c && !c.isFlipped && !c.isMatched).length
          });

          // Enhanced validation of the AI's chosen cards before proceeding
          if (cardIndex1 === undefined || cardIndex2 === undefined || 
              cardIndex1 < 0 || cardIndex2 < 0 || 
              cardIndex1 >= latestState.cards.length || cardIndex2 >= latestState.cards.length) {
            console.error('AI returned invalid card indices:', { cardIndex1, cardIndex2 });
            setIsProcessingAI(false);
            return;
          }
          
          const card1 = latestState.cards[cardIndex1];
          const card2 = latestState.cards[cardIndex2];
          
          // CRITICAL FIX: Enhanced validation with strict equality checks
          if (!card1 || !card2 || 
              card1.isFlipped === true || card1.isMatched === true || 
              card2.isFlipped === true || card2.isMatched === true) {
            console.error('AI selected invalid cards! This should not happen:', { 
              cardIndex1, 
              cardIndex2, 
              card1: card1 ? { id: card1.id, isFlipped: card1.isFlipped, isMatched: card1.isMatched } : null,
              card2: card2 ? { id: card2.id, isFlipped: card2.isFlipped, isMatched: card2.isMatched } : null,
              availableCards: latestState.cards.filter((c: Card) => c && !c.isFlipped && !c.isMatched).length
            });
            setIsProcessingAI(false);
            return;
          }

          const firstMoveState = handleCardFlip(latestState, cardIndex1);
          
          // Additional validation after first card flip
          if (!firstMoveState || !firstMoveState.flippedCards || firstMoveState.flippedCards.length !== 1) {
            console.error('First AI move failed to produce a valid state:', {
              hasState: !!firstMoveState,
              flippedCardsLength: firstMoveState?.flippedCards?.length
            });
            setIsProcessingAI(false);
            return;
          }
          
          if (firstMoveState.flippedCards.length === 1) {
            window.setTimeout(() => {
              const finalState = handleCardFlip(firstMoveState, cardIndex2);
              
              // Additional validation after second card flip
              if (!finalState || !finalState.flippedCards) {
                console.error('Second AI move failed to produce a valid state');
                setIsProcessingAI(false);
                return;
              }
              
              setGameState(finalState);
              setLastFlippedCards(finalState.flippedCards);
              setItem('memory-card-game-saved', finalState);
              
              // More robust flipped cards handling
              if (!finalState.flippedCards || finalState.flippedCards.length !== 2) {
                console.warn('Invalid flipped cards array:', { 
                  flippedCardsLength: finalState.flippedCards?.length, 
                  flippedCards: finalState.flippedCards 
                });
                setIsProcessingAI(false);
                return;
              }
              
              const [card1, card2] = finalState.flippedCards;
              let cardsMatch = false;
              
              if (card1 && card2 && card1.id && card2.id) {
                switch (finalState.matchType) {
                  case 'color':
                    cardsMatch = card1.color === card2.color;
                    break;
                  case 'rank':
                    cardsMatch = card1.rank === card2.rank;
                    break;
                  case 'suit':
                    cardsMatch = card1.suit === card2.suit;
                    break;
                }
              } else {
                console.warn('Invalid flipped cards detected:', { 
                  card1: card1 || 'undefined', 
                  card2: card2 || 'undefined', 
                  flippedCards: finalState.flippedCards 
                });
                setIsProcessingAI(false);
                return;
              }
              
              if (aiWatchdogTimeoutRef.current) {
                clearTimeout(aiWatchdogTimeoutRef.current);
              }
              
              if (isGameFinished(finalState)) {
                handleGameCompleteRef.current?.(finalState);
                setIsProcessingAI(false);
                return;
              }
              
              if (cardsMatch) {
                // AI matched! The match was already processed by handleCardFlip -> processCardPair
                console.log('AI made a match:', { 
                  card1: card1?.id?.slice(-4), 
                  card2: card2?.id?.slice(-4), 
                  aiScore: finalState.players.find(p => p.id === 'ai')?.score 
                });
                
                // Just update the game state and continue - no manual card manipulation needed
                setGameState(finalState);
                setLastFlippedCards([]);
                setItem('memory-card-game-saved', finalState);
                setIsProcessingAI(false);
                  // CRITICAL FIX: Schedule next AI move with React state callback to ensure latest state
                setTimeout(() => {
                  setGameState((currentState: GameState | null) => {
                    if (!currentState) return finalState;
                    
                    // Check if game is finished first
                    if (isGameFinished(currentState)) {
                      console.log('AI match: Game is finished, triggering game complete');
                      handleGameCompleteRef.current?.(currentState);
                      return currentState;
                    }
                    
                    // Use current state for scheduling next AI move to ensure we have latest matched cards
                    const availableCards = currentState.cards.filter((c: Card) => c && !c.isFlipped && !c.isMatched);
                    const isCurrentPlayerAI = (currentState.currentPlayer === 'ai' && currentState.gameMode === 'ai') ||
                                            (currentState.gameMode === 'ai-vs-ai' && 
                                             (currentState.currentPlayer === 'ai1' || currentState.currentPlayer === 'ai2'));
                      if (isCurrentPlayerAI && availableCards.length >= 2) {
                      console.log('AI matched, auto-start effect will handle next move:', {
                        availableCards: availableCards.length,
                        matchedCards: currentState.cards.filter((c: Card) => c && c.isMatched === true).length,
                        aiScore: currentState.players.find((p: any) => p.id === currentState.currentPlayer)?.score,
                        totalMatchedPairs: currentState.matchedPairs.length
                      });
                      
                      // Let the auto-start effect handle the next AI move
                    } else {
                      console.log('AI turn complete or game finished', {
                        isAITurn: isCurrentPlayerAI,
                        isGameFinished: isGameFinished(currentState),
                        availableCards: availableCards.length
                      });
                      
                      // If no available cards or game finished, trigger completion
                      if (availableCards.length < 2 || isGameFinished(currentState)) {
                        handleGameCompleteRef.current?.(currentState);
                      }
                    }
                    
                    return currentState; // Return current state unchanged
                  });
                }, 1000);
              } else {
                // AI didn't match - reset only the unmatched cards
                setIsProcessingCards(true);
                setTimeout(() => {
                  if (!card1 || !card2 || !card1.id || !card2.id) {
                    console.warn('Invalid cards detected during AI mismatch handling:', { card1, card2 });
                    setIsProcessingCards(false);
                    setIsProcessingAI(false);
                    return;
                  }
                  
                  console.log('AI mismatch - resetting cards:', {
                    card1: { id: card1.id.slice(-4), isMatched: card1.isMatched },
                    card2: { id: card2.id.slice(-4), isMatched: card2.isMatched }
                  });
                    // BULLETPROOF PROTECTION: NEVER reset matched cards
                  const resetCards = finalState.cards.map((card: Card) => {
                    if (!card || !card.id) {
                      console.warn('Invalid card found in cards array:', card);
                      return card;
                    }
                    
                    // ABSOLUTE RULE: If card is matched, NEVER change it
                    if (card.isMatched === true) {
                      console.log(`PROTECTION: Keeping matched card unchanged: ${card.id.slice(-4)}`);
                      return card; // Keep exactly as is
                    }
                    
                    // CRITICAL FIX: Reset ALL flipped cards that are not matched
                    // This ensures no cards remain in a flipped state after a mismatch
                    if (card.isFlipped === true && card.isMatched === false) {
                      console.log(`AI mismatch: Resetting flipped unmatched card: ${card.id.slice(-4)}`);
                      return { ...card, isFlipped: false };
                    }
                    
                    // Keep all other cards unchanged
                    return card;
                  });
                    // Determine next player based on game mode
                  let nextPlayer: string;
                  if (finalState.gameMode === 'ai-vs-ai') {
                    // In AI vs AI mode, switch between ai1 and ai2
                    nextPlayer = finalState.currentPlayer === 'ai1' ? 'ai2' : 'ai1';
                    console.log('AI vs AI mismatch - switching to other AI:', { 
                      from: finalState.currentPlayer, 
                      to: nextPlayer 
                    });
                  } else {
                    // In regular AI mode, switch to human player
                    nextPlayer = finalState.players.find((p: any) => p.type === 'human')?.id || 'player1';
                    console.log('AI mismatch complete - switching to human player');
                  }
                  
                  const resetState = { 
                    ...finalState, 
                    flippedCards: [],
                    cards: resetCards,
                    currentPlayer: nextPlayer
                  };
                    setGameState(resetState);
                  setLastFlippedCards([]);
                  setItem('memory-card-game-saved', resetState);
                  setIsProcessingCards(false);
                  setIsProcessingAI(false);
                  
                  // The auto-start effect will handle scheduling the next AI move
                  console.log('AI mismatch handled, auto-start effect will trigger next AI move');
                }, 1500);
              }
            }, 300);
          } else {
            setIsProcessingAI(false);
          }
        }, 100);
      } catch (error) {
        console.error('AI move error:', error);
        setIsProcessingAI(false);
      }
    }, 600);
  }, [aiPlayer, aiPlayer2, isProcessingAI, setItem]);

  scheduleAIMoveRef.current = scheduleAIMove;
  const handleGameComplete = useCallback((completedGameState: GameState) => {
    const winner = getGameWinner(completedGameState);
    const stats = calculateGameStats(completedGameState);
    const isDraw = isGameDraw(completedGameState);
    
    const aiPlayer = completedGameState.players.find(p => p.type === 'ai');
    const aiDifficulty = aiPlayer?.aiDifficulty;
    
    let gameMode: 'singlePlayer' | 'multiPlayer' | 'aiVsAi';
    if (completedGameState.gameMode === 'ai') {
      gameMode = 'singlePlayer';
    } else if (completedGameState.gameMode === 'local-multiplayer') {
      gameMode = 'multiPlayer';
    } else {
      gameMode = 'aiVsAi';
    }
    
    let humanWon = false;
    
    // Handle draw scenario
    if (isDraw) {
      // In a draw, determine if any human was involved in the tie
      if (Array.isArray(winner)) {
        humanWon = winner.some(w => w.type === 'human');
      } else {
        humanWon = false; // This shouldn't happen in a draw, but just in case
      }
      console.log('Game ended in a draw!', {
        winners: Array.isArray(winner) ? winner.map(w => w.name) : [],
        humanInvolved: humanWon
      });
    } else {
      // Regular win scenario
      if (Array.isArray(winner)) {
        humanWon = winner.some(w => w.type === 'human');
      } else if (winner) {
        humanWon = winner.type === 'human';
      } else {
        humanWon = false;
      }
    }
    
    if (completedGameState.gameMode === 'local-multiplayer') {
      const maxScore = Math.max(...completedGameState.players.map(p => p.score));
      const winners = completedGameState.players.filter(p => p.score === maxScore);
      
      if (winners.length === 1) {
        humanWon = winners[0].type === 'human';
      } else {
        // This is a draw scenario
        humanWon = winners.some(w => w.type === 'human');
      }
    }
    
    const humanPlayers = completedGameState.players.filter(p => p.type === 'human');
    const humanMatches = humanPlayers.reduce((total, player) => total + player.score, 0);
    
    const gameResult = {
      won: humanWon,
      gameTime: Math.round(stats.gameDuration / 1000),
      boardSize: completedGameState.boardSize,
      matches: humanMatches,
      totalMoves: stats.totalMoves,
      isPerfect: stats.isPerfectGame,
      isAiVsAi: completedGameState.gameMode === 'ai-vs-ai',
      aiDifficulty: aiDifficulty,
      gameMode: gameMode,
      isDraw: isDraw
    };
    
    console.log('Game completed with result:', gameResult);
    updateStatistics(gameResult);
    checkAchievements(statistics, gameResult);
  }, [updateStatistics, checkAchievements, statistics]);

  handleGameCompleteRef.current = handleGameComplete;

  const togglePause = useCallback(() => {
    if (!gameState) return;
    
    const newGameState: GameState = {
      ...gameState,
      gameStatus: gameState.gameStatus === 'paused' ? 'playing' : 'paused'
    };
    
    setGameState(newGameState);
    setItem('memory-card-game-saved', newGameState);
  }, [gameState, setItem]);

  const resetGame = useCallback(() => {
    if (!gameState) return;
    
    if (aiMoveTimeoutRef.current) {
      clearTimeout(aiMoveTimeoutRef.current);
    }
    if (aiWatchdogTimeoutRef.current) {
      clearTimeout(aiWatchdogTimeoutRef.current);
    }
    
    const aiPlayers = gameState.players.filter(p => p.type === 'ai');
    const newGameState = initializeGame(
      gameState.gameMode,
      gameState.matchType,
      gameState.boardSize,
      gameState.players[0].name,
      gameState.players[1]?.name,
      aiPlayers[0]?.aiDifficulty,
      aiPlayers[1]?.aiDifficulty
    );
    
    setGameState(newGameState);
    setLastFlippedCards([]);
    setIsProcessingAI(false);
    setIsProcessingCards(false);
    
    if (gameState.gameMode === 'ai') {
      const aiDifficulty = gameState.players.find(p => p.type === 'ai')?.aiDifficulty;
      if (aiDifficulty) {
        setAiPlayer(new AIPlayer(aiDifficulty));
        setAiPlayer2(null);
      }
    } else if (gameState.gameMode === 'ai-vs-ai') {
      if (aiPlayers.length >= 2 && aiPlayers[0].aiDifficulty && aiPlayers[1].aiDifficulty) {
        setAiPlayer(new AIPlayer(aiPlayers[0].aiDifficulty));
        setAiPlayer2(new AIPlayer(aiPlayers[1].aiDifficulty));
      }
    } else {
      setAiPlayer(null);
      setAiPlayer2(null);
    }
    
    setItem('memory-card-game-saved', newGameState);
  }, [gameState, setItem]);

  const getHint = useCallback((): { card1: number; card2: number } | null => {
    if (!gameState || !settings.hintsEnabled) return null;
    
    const { cards, matchType } = gameState;
    const unmatched = cards.filter((card: Card) => !card.isMatched && !card.isFlipped);
    
    for (let i = 0; i < unmatched.length; i++) {
      for (let j = i + 1; j < unmatched.length; j++) {
        const card1 = unmatched[i];
        const card2 = unmatched[j];
        
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
          return {
            card1: card1.position,
            card2: card2.position
          };
        }
      }
    }
    
    return null;
  }, [gameState, settings.hintsEnabled]);

  const loadGame = useCallback((savedGameState: GameState) => {
    setGameState(savedGameState);
    setLastFlippedCards(savedGameState.flippedCards);
    
    if (savedGameState.gameMode === 'ai') {
      const aiDifficulty = savedGameState.players.find(p => p.type === 'ai')?.aiDifficulty;
      if (aiDifficulty) {
        setAiPlayer(new AIPlayer(aiDifficulty));
        setAiPlayer2(null);
      }
    } else if (savedGameState.gameMode === 'ai-vs-ai') {
      const aiPlayers = savedGameState.players.filter(p => p.type === 'ai');
      if (aiPlayers.length >= 2 && aiPlayers[0].aiDifficulty && aiPlayers[1].aiDifficulty) {
        setAiPlayer(new AIPlayer(aiPlayers[0].aiDifficulty));
        setAiPlayer2(new AIPlayer(aiPlayers[1].aiDifficulty));
      }
    } else {
      setAiPlayer(null);
      setAiPlayer2(null);
    }
  }, []);

  const endGame = useCallback(() => {
    if (aiMoveTimeoutRef.current) {
      clearTimeout(aiMoveTimeoutRef.current);
    }
    if (aiWatchdogTimeoutRef.current) {
      clearTimeout(aiWatchdogTimeoutRef.current);
    }
    
    setGameState(null);
    setAiPlayer(null);
    setAiPlayer2(null);
    setIsProcessingAI(false);
    setLastFlippedCards([]);
    setIsProcessingCards(false);
    
    setItem('memory-card-game-saved', null);
  }, [setItem]);  // AI auto-start effect for AI vs AI mode
  useEffect(() => {
    console.log('Auto-start effect triggered with:', {
      hasGameState: !!gameState,
      isProcessingAI,
      isProcessingCards,
      currentPlayer: gameState?.currentPlayer,
      gameMode: gameState?.gameMode,
      flippedCardsLength: gameState?.flippedCards?.length,
      aiPlayer: !!aiPlayer,
      aiPlayer2: !!aiPlayer2
    });

    if (!gameState || isProcessingAI || isProcessingCards) return;

    // Check if game is finished first
    if (isGameFinished(gameState)) {
      console.log('Game is finished, not starting AI move');
      return;
    }

    const currentPlayerData = gameState.players.find(p => p.id === gameState.currentPlayer);
    const isAIMode = gameState.gameMode === 'ai' || gameState.gameMode === 'ai-vs-ai';
    const isCurrentPlayerAI = currentPlayerData?.type === 'ai';
    
    // Check if there are enough available cards
    const availableCards = gameState.cards.filter(c => c && !c.isFlipped && !c.isMatched);
    
    console.log('Auto-start effect conditions check:', {
      isAIMode,
      isCurrentPlayerAI,
      flippedCardsLength: gameState.flippedCards.length,
      availableCards: availableCards.length,
      currentPlayerData: currentPlayerData ? {
        id: currentPlayerData.id,
        type: currentPlayerData.type
      } : null
    });
    
    if (isAIMode && isCurrentPlayerAI && gameState.flippedCards.length === 0 && availableCards.length >= 2) {
      console.log('Auto-starting AI move for:', {
        gameMode: gameState.gameMode,
        currentPlayer: gameState.currentPlayer,
        playerType: currentPlayerData?.type,
        availableCards: availableCards.length
      });
      
      // Schedule AI move after a brief delay
      const timeoutId = setTimeout(() => {
        console.log('Auto-start timeout executing, calling scheduleAIMove');
        scheduleAIMoveRef.current?.(gameState);
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else if (isAIMode && isCurrentPlayerAI && availableCards.length < 2) {
      console.log('Not enough available cards for AI move:', {
        availableCards: availableCards.length,
        totalCards: gameState.cards.length
      });    } else {
      console.log('Auto-start conditions not met:', {
        isAIMode,
        isCurrentPlayerAI,
        flippedCardsEmpty: gameState.flippedCards.length === 0,
        enoughCards: availableCards.length >= 2
      });
    }
  }, [gameState, isProcessingAI, isProcessingCards, aiPlayer, aiPlayer2]);

  useEffect(() => {
    return () => {
      if (aiMoveTimeoutRef.current) {
        clearTimeout(aiMoveTimeoutRef.current);
      }
      if (aiWatchdogTimeoutRef.current) {
        clearTimeout(aiWatchdogTimeoutRef.current);
      }
    };
  }, []);

  return {
    gameState,
    startNewGame,
    flipCard,
    togglePause,
    resetGame,
    endGame,
    getHint,
    loadGame,
    isProcessingAI,
    isProcessingCards,
    lastFlippedCards
  };
}
