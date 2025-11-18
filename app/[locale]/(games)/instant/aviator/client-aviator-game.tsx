'use client';

import { useEffect, useRef, useState } from 'react';

interface GameState {
  multiplier: number;
  crashPoint: number | null;
  isRunning: boolean;
  gameState: 'waiting' | 'countdown' | 'running' | 'crashed';
  gameHistory: number[];
  playerBets: Array<{
    playerId: number;
    amount: number;
    cashedOut: boolean;
    cashoutMultiplier: number;
    playerName: string;
  }>;
  demoPlayers: Array<{
    id: number;
    name: string;
    balance: number;
    betAmount: number;
    cashOutAt: number;
  }>;
  elapsedTime: number;
  timestamp: number;
}

interface AnimationState {
  multiplier: number;
  rocketX: number;
  rocketY: number;
  rocketRotation: number;
  rocketSize: number;
  showFlame: boolean;
  showExplosion: boolean;
  countdown: number;
  countdownVisible: boolean;
  isResetting: boolean;
}

export default function ClientAviatorGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>({
    multiplier: 1.0,
    rocketX: 15,
    rocketY: 85,
    rocketRotation: 0,
    rocketSize: 60,
    showFlame: false,
    showExplosion: false,
    countdown: 3,
    countdownVisible: false,
    isResetting: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showBlownUpRocket, setShowBlownUpRocket] = useState(false);
  const [resetRocket, setResetRocket] = useState(false);
  
  const animationRef = useRef<number>();
  const lastGameStateRef = useRef<GameState | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const targetMultiplierRef = useRef(1.0);
  const targetRocketRef = useRef({ x: 15, y: 85, rotation: 0, size: 60 });
  const countdownStartTimeRef = useRef(0);
  const countdownValueRef = useRef(3);
  const resetStartTimeRef = useRef(0);
  const explosionEndTimeRef = useRef(0);
  const rocketRef = useRef<HTMLDivElement>(null);

  // Fetch game state from server
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch('/api/aviator?t=' + Date.now(), {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          setGameState(data);
          targetMultiplierRef.current = data.multiplier;
          
          // Update target rocket position based on game state
          if (data.gameState === 'running') {
            const progress = Math.min(1, (data.multiplier - 1) / 2);
            targetRocketRef.current.x = 17 + progress * 60;
            const curveX = (targetRocketRef.current.x - 15) / 60;
            targetRocketRef.current.y = 85 - (60 * curveX * curveX);
            targetRocketRef.current.rotation = 45 * progress;
            targetRocketRef.current.size = 60 + Math.min(40, (data.multiplier - 1) * 10);
          } else {
            // Reset target for waiting/countdown
            targetRocketRef.current = { x: 15, y: 85, rotation: 0, size: 60 };
          }
          
          // Handle countdown state changes
          if (data.gameState === 'countdown' && lastGameStateRef.current?.gameState !== 'countdown') {
            countdownStartTimeRef.current = Date.now() - (data.elapsedTime * 1000 || 0);
            countdownValueRef.current = 3;
            
            // Reset rocket without animation when countdown starts
            setResetRocket(true);
            setShowBlownUpRocket(false);
          }
          
          // Handle crash state - start reset animation
          if (data.gameState === 'crashed' && lastGameStateRef.current?.gameState !== 'crashed') {
            explosionEndTimeRef.current = Date.now() + 1000; // Show explosion for 1 second
            setShowBlownUpRocket(true);
          }
          
          // Handle transition from crashed to waiting - start smooth reset
          if (data.gameState === 'waiting' && lastGameStateRef.current?.gameState === 'crashed') {
            resetStartTimeRef.current = Date.now();
            setAnimationState(prev => ({ ...prev, isResetting: true, showExplosion: false }));
            setShowBlownUpRocket(false);
          }
          
          if (data && isLoading) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch game state:', error);
      }
    };

    // Initial fetch
    fetchGameState();

    // Set up polling for game state updates
    const intervalId = setInterval(fetchGameState, 100);

    return () => {
      clearInterval(intervalId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoading]);

  // Store previous game state for comparison
  useEffect(() => {
    lastGameStateRef.current = gameState;
  }, [gameState]);

  // High-performance animation loop
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = (timestamp: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp;
      }
      
      const deltaTime = Math.min(100, timestamp - lastUpdateTimeRef.current);
      lastUpdateTimeRef.current = timestamp;
      const currentTime = Date.now();
      
      // Calculate interpolation factor based on frame time
      const interpolationFactor = Math.min(1, deltaTime / (1000 / 60) * 0.2);
      
      setAnimationState(prev => {
        // Handle explosion timer
        let showExplosion = prev.showExplosion;
        if (currentTime < explosionEndTimeRef.current) {
          showExplosion = true;
        } else if (prev.showExplosion && currentTime >= explosionEndTimeRef.current) {
          showExplosion = false;
        }
        
        // Smooth multiplier animation
        const currentMultiplier = prev.multiplier;
        const targetMultiplier = targetMultiplierRef.current;
        const multiplierDiff = targetMultiplier - currentMultiplier;
        const newMultiplier = Math.abs(multiplierDiff) < 0.001 
          ? targetMultiplier 
          : currentMultiplier + multiplierDiff * interpolationFactor * 5;
        
        // Handle rocket reset animation
        let rocketX = prev.rocketX;
        let rocketY = prev.rocketY;
        let rocketRotation = prev.rocketRotation;
        let rocketSize = prev.rocketSize;
        let isResetting = prev.isResetting;
        let showFlame = false;
        
        if (resetRocket) {
          // Immediately reset rocket to starting position without animation
          rocketX = 15;
          rocketY = 85;
          rocketRotation = 0;
          rocketSize = 60;
          showFlame = false;
          isResetting = false;
          setResetRocket(false); // Reset the flag
        } else if (prev.isResetting) {
          // Smoothly reset rocket to starting position
          const resetProgress = Math.min(1, (currentTime - resetStartTimeRef.current) / 1000);
          
          rocketX = prev.rocketX + (15 - prev.rocketX) * resetProgress;
          rocketY = prev.rocketY + (85 - prev.rocketY) * resetProgress;
          rocketRotation = prev.rocketRotation + (0 - prev.rocketRotation) * resetProgress;
          rocketSize = prev.rocketSize + (60 - prev.rocketSize) * resetProgress;
          
          // Finish reset after 1 second
          if (resetProgress >= 1) {
            isResetting = false;
          }
        } else if (gameState?.gameState === 'running') {
          // Normal rocket flight animation
          const targetX = targetRocketRef.current.x;
          const targetY = targetRocketRef.current.y;
          const targetRotation = targetRocketRef.current.rotation;
          const targetSize = targetRocketRef.current.size;
          
          rocketX = prev.rocketX + (targetX - prev.rocketX) * interpolationFactor * 5;
          rocketY = prev.rocketY + (targetY - prev.rocketY) * interpolationFactor * 5;
          rocketRotation = prev.rocketRotation + (targetRotation - prev.rocketRotation) * interpolationFactor * 5;
          rocketSize = prev.rocketSize + (targetSize - prev.rocketSize) * interpolationFactor * 5;
          
          showFlame = true;
        } else if (gameState?.gameState === 'crashed') {
          // Keep rocket at crash position during explosion
          rocketX = prev.rocketX;
          rocketY = prev.rocketY;
          rocketRotation = prev.rocketRotation;
          rocketSize = prev.rocketSize;
          showFlame = false;
        } else {
          // For waiting and countdown, ensure rocket is at start position
          rocketX = 15;
          rocketY = 85;
          rocketRotation = 0;
          rocketSize = 60;
          showFlame = false;
          isResetting = false;
        }
        
        // Determine countdown state
        let countdownVisible = false;
        let countdownValue = 0;
        
        if (gameState?.gameState === 'countdown') {
          countdownVisible = true;
          // Calculate countdown value based on elapsed time
          const elapsed = (currentTime - countdownStartTimeRef.current) / 1000;
          countdownValue = Math.max(0, 3 - elapsed);
          countdownValueRef.current = countdownValue;
        }
        
        return {
          multiplier: newMultiplier,
          rocketX,
          rocketY,
          rocketRotation,
          rocketSize,
          showFlame,
          showExplosion,
          countdown: countdownValue,
          countdownVisible,
          isResetting
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, resetRocket]); // Added resetRocket to dependencies

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Failed to load game</div>
      </div>
    );
  }

  // Active bets
  const activeBets = gameState.playerBets.filter(bet => !bet.cashedOut);
  const totalBet = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  const potentialWin = totalBet * animationState.multiplier;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      {/* Game display */}
      <div className="w-full max-w-4xl aspect-[3/2] bg-gradient-to-b from-blue-300 to-blue-500 border-8 border-yellow-500 rounded-xl relative overflow-hidden shadow-2xl">
        {/* Cloud background */}
        <div className="absolute inset-0">
          {/* Cloud layers */}
          <div className="absolute top-10 left-10 w-32 h-16 bg-white/80 rounded-full"></div>
          <div className="absolute top-10 left-20 w-40 h-20 bg-white/90 rounded-full"></div>
          <div className="absolute top-15 left-5 w-36 h-18 bg-white/70 rounded-full"></div>
          
          <div className="absolute top-30 right-20 w-40 h-20 bg-white/80 rounded-full"></div>
          <div className="absolute top-35 right-10 w-32 h-16 bg-white/90 rounded-full"></div>
          <div className="absolute top-25 right-25 w-36 h-18 bg-white/70 rounded-full"></div>
        </div>

        {/* Flight path */}
        <svg width="100%" height="100%" className="absolute">
          <path
            d="M15 85 Q 45 85, 75 25"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>

        {/* Regular rocket */}
        {!showBlownUpRocket && (
          <div
            ref={rocketRef}
            className="absolute rocket-movement"
            style={{
              left: `${animationState.rocketX}%`,
              top: `${animationState.rocketY}%`,
              transform: `translate(-50%, -50%) rotate(${animationState.rocketRotation}deg)`,
              pointerEvents: 'none',
              fontSize: `${animationState.rocketSize}px`,
              zIndex: 10,
              filter: gameState.gameState === 'running' ? 'drop-shadow(0 0 8px rgba(255,255,0,0.5))' : 'none',
              willChange: 'transform, left, top, font-size',
              transition: resetRocket ? 'none' : 'all 0.1s ease-out',
            }}
          >
            🚀
          </div>
        )}

        {/* Blown up rocket */}
        {showBlownUpRocket && (
          <div
            className="absolute"
            style={{
              left: `${animationState.rocketX}%`,
              top: `${animationState.rocketY}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              fontSize: `${animationState.rocketSize * 1.2}px`,
              zIndex: 10,
              filter: 'grayscale(1) brightness(0.5)',
            }}
          >
            💥
          </div>
        )}

        {/* Rocket flame effect */}
        {animationState.showFlame && (
          <div
            className="absolute flame-movement"
            style={{
              left: `${animationState.rocketX - 2}%`,
              top: `${animationState.rocketY + 2}%`,
              transform: `translate(-50%, -50%) rotate(${animationState.rocketRotation + 180}deg)`,
              pointerEvents: 'none',
              fontSize: `${animationState.rocketSize * 0.6}px`,
              zIndex: 9,
              filter: 'blur(2px)',
              opacity: 0.8,
              willChange: 'transform, left, top, font-size',
            }}
          >
            🔥
          </div>
        )}

        {/* Explosion effect when crashed */}
        {animationState.showExplosion && (
          <div
            className="absolute explode-animation"
            style={{
              left: `${animationState.rocketX}%`,
              top: `${animationState.rocketY}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              fontSize: `${animationState.rocketSize * 1.5}px`,
              zIndex: 20,
              willChange: 'transform, opacity',
            }}
          >
            💥
          </div>
        )}

        {/* Multiplier display */}
        <div className="absolute top-4 left-4 text-4xl font-bold text-green-400 drop-shadow-lg">
          {animationState.multiplier > 1 ? `x${animationState.multiplier.toFixed(2)}` : '—'}
        </div>

        {/* Game state indicator */}
        <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded text-sm">
          {gameState.gameState === 'waiting' && 'Waiting for next round...'}
          {gameState.gameState === 'countdown' && `Starting in ${Math.ceil(animationState.countdown)}...`}
          {gameState.gameState === 'running' && 'Flying!'}
          {gameState.gameState === 'crashed' && `Crashed at x${gameState.crashPoint?.toFixed(2)}`}
        </div>

        {/* Game history */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          {gameState.gameHistory.map((point, index) => (
            <div 
              key={index} 
              className={`px-2 py-1 rounded text-xs font-semibold ${
                point < 2 ? 'bg-red-500' : point < 5 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            >
              x{point.toFixed(2)}
            </div>
          ))}
        </div>

        {/* Active bets indicator */}
        {activeBets.length > 0 && (
          <div className="absolute top-12 left-4 px-3 py-1 rounded text-sm font-semibold bg-blue-800 shadow">
            Active bets: ${totalBet} (Potential: ${potentialWin.toFixed(0)})
          </div>
        )}

        {/* Countdown overlay */}
        {animationState.countdownVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-8xl font-bold text-white/90 animate-pulse">
              {Math.ceil(animationState.countdown)}
            </div>
          </div>
        )}
      </div>

      {/* Game info and player list */}
      <div className="mt-8 flex flex-col space-y-4 w-full max-w-4xl">
        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
          <div className="text-lg font-semibold">
            Server-Controlled Aviator Game
          </div>
          <div className="text-sm text-gray-300">
            Multiplier: {animationState.multiplier > 1 ? `x${animationState.multiplier.toFixed(2)}` : '—'}
          </div>
        </div>

        {/* Player list */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Demo Players</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {gameState.demoPlayers.map(player => (
              <div key={player.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                <div className="text-sm">{player.name}</div>
                <div className="text-sm font-semibold">${player.balance}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active bets */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-3">Active Bets</h3>
          {activeBets.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {activeBets.map(bet => (
                <div key={`${bet.playerId}-${bet.amount}`} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                  <div className="text-sm">{bet.playerName}</div>
                  <div className="text-sm font-semibold">${bet.amount}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">No active bets</div>
          )}
        </div>

        <div className="text-gray-300 text-center">
          <p className="text-lg">Fully Server-Side Aviator Game</p>
          <p className="mt-2 text-sm">
            This game runs completely on the server with demo players. 
            The game continues automatically even if no one is watching.
          </p>
        </div>
      </div>
    </div>
  );
}