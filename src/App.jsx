import React, { useState, useEffect, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import GameBoard from './components/GameBoard';
import TopBar from './components/UI/TopBar';
import SettingsModal from './components/UI/SettingsModal';
import { createBoard, checkForMatches, applyGravity, swap, hasValidMoves, reshuffle, BOARD_WIDTH, BOARD_HEIGHT } from './logic/GameEngine';
import { levels } from './config/levels';
import './App.css';

const TILE_IMAGES = [
  'ethereum-eth-logo.png',
  'dogecoin-doge-logo.png',
  'solana-sol-logo.png',
  'pepe-pepe-logo.png',
  'shiba-inu-shib-logo.png',
  'polygon-matic-logo.png'
];

function App() {
  const [gameState, setGameState] = useState('start'); // start, playing, paused, gameover
  const [user, setUser] = useState('');
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(0);
  
  const [board, setBoard] = useState([]);
  const [blastingPositions, setBlastingPositions] = useState(new Set());
  const [cometEffects, setCometEffects] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentLevel = levels[levelIndex];

  // Initialize Level
  const initLevel = useCallback((lvlIdx) => {
    const lvl = levels[lvlIdx];
    const initialBoard = createBoard(TILE_IMAGES);
    setBoard(initialBoard);
    setScore(0);
    setMovesLeft(lvl.maxMoves);
    setGameState('playing');
    setIsProcessing(false);
  }, []);

  const handleStart = (name) => {
    setUser(name);
    setLevelIndex(0);
    initLevel(0);
  };

  const processMatches = useCallback(async (currentBoard) => {
    let boardToProcess = currentBoard;
    let keepChecking = true;
    let localScore = 0;

    while (keepChecking) {
      const { matchedPositions, specialEffects } = checkForMatches(boardToProcess);
      
      if (matchedPositions.size === 0) {
        keepChecking = false;
        
        // Check if valid moves exist, if not reshuffle
        if (!hasValidMoves(boardToProcess)) {
          boardToProcess = reshuffle(boardToProcess);
          setBoard([...boardToProcess]);
        }
        break;
      }

      // 1. Calculate Score & Setup Effects
      let matchScore = matchedPositions.size * 10;
      let comets = [];
      specialEffects.forEach(effect => {
        if (effect.type === 'multiplier') {
          matchScore *= 2;
        } else if (effect.type === 'comet') {
          matchScore += 100;
          comets.push({
            type: Math.random() > 0.5 ? 'row' : 'col',
            center: effect.center
          });
        }
      });
      localScore += matchScore;

      // Expand matched positions for comet effects
      const expandedMatches = new Set(matchedPositions);
      comets.forEach(comet => {
        if (comet.type === 'row') {
          for (let c = 0; c < BOARD_WIDTH; c++) expandedMatches.add(`${comet.center.r},${c}`);
        } else {
          for (let r = 0; r < BOARD_HEIGHT; r++) expandedMatches.add(`${r},${comet.center.c}`);
        }
      });

      // 2. Trigger Animations
      setBlastingPositions(expandedMatches);
      setCometEffects(comets);
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for blast animation

      // 3. Clear tiles
      expandedMatches.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        boardToProcess[r][c] = null;
      });
      setBlastingPositions(new Set());
      setCometEffects([]);
      setBoard([...boardToProcess]);

      // 4. Apply Gravity
      await new Promise(resolve => setTimeout(resolve, 100)); // Small pause before drop
      const gravityResult = applyGravity(boardToProcess, TILE_IMAGES);
      boardToProcess = gravityResult.newBoard;
      setBoard([...boardToProcess]);
      await new Promise(resolve => setTimeout(resolve, 400)); // Wait for drop animation
    }

    return localScore;
  }, []);

  const handleSwap = async (r1, c1, r2, c2) => {
    if (isProcessing || gameState !== 'playing') return;
    setIsProcessing(true);

    const tempBoard = swap(board, r1, c1, r2, c2);
    setBoard([...tempBoard]);

    const { matchedPositions } = checkForMatches(tempBoard);

    if (matchedPositions.size === 0) {
      // Invalid swap, revert after a tiny delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setBoard([...board]);
      setIsProcessing(false);
    } else {
      // Valid swap
      setMovesLeft(prev => prev - 1);
      const points = await processMatches(tempBoard);
      setScore(prev => prev + points);
      setIsProcessing(false);
    }
  };

  // Check win/loss condition
  useEffect(() => {
    if (gameState === 'playing' && !isProcessing) {
      if (score >= currentLevel.targetScore) {
        setGameState('gameover');
      } else if (movesLeft <= 0) {
        setGameState('gameover');
      }
    }
  }, [score, movesLeft, isProcessing, gameState, currentLevel]);

  const handleRestart = () => {
    if (score >= currentLevel.targetScore) {
      // Next Level
      if (levelIndex < levels.length - 1) {
        setLevelIndex(prev => prev + 1);
        initLevel(levelIndex + 1);
      } else {
        // Beat the game!
        alert("You beat all levels! Amazing!");
        setGameState('start');
      }
    } else {
      // Retry Level
      initLevel(levelIndex);
    }
  };

  return (
    <div className="flex-center" style={{ width: '100%', height: '100%' }}>
      {gameState === 'start' && <StartScreen onStart={handleStart} />}
      
      {gameState !== 'start' && (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <TopBar 
            score={score} 
            targetScore={currentLevel.targetScore} 
            movesLeft={movesLeft} 
            level={currentLevel.level} 
            onPause={() => setGameState('paused')}
          />
          
          <GameBoard 
            board={board} 
            onSwap={handleSwap} 
            blastingPositions={blastingPositions}
            cometEffects={cometEffects}
          />

          {(gameState === 'paused' || gameState === 'gameover') && (
            <SettingsModal 
              isGameOver={gameState === 'gameover'}
              isWin={score >= currentLevel.targetScore}
              score={score}
              onResume={() => setGameState('playing')}
              onRestart={handleRestart}
              onHome={() => setGameState('start')}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
