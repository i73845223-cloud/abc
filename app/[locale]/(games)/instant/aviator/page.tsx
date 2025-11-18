'use client';

import { useEffect, useRef, useState } from 'react';

function generateCrashMultiplier(): number {
  const rand = Math.random();
  if (rand < 0.01) return 1.0;
  return Math.max(1.01, parseFloat((1.0 / (1.0 - rand)).toFixed(2)));
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export default function AviatorGame() {
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [balance, setBalance] = useState(100_000);
  const [rocketVisible, setRocketVisible] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  const [countdown, setCountdown] = useState(0);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'running' | 'crashed'>('waiting');
  const [showExplosion, setShowExplosion] = useState(false);

  const [bet1, setBet1] = useState<{amount: number, cashedOut: boolean, cashoutMultiplier: number, isNextRound: boolean} | null>(null);
  const [bet2, setBet2] = useState<{amount: number, cashedOut: boolean, cashoutMultiplier: number, isNextRound: boolean} | null>(null);
  const [betAmount1, setBetAmount1] = useState(1000);
  const [betAmount2, setBetAmount2] = useState(1000);
  const [nextRoundBet1, setNextRoundBet1] = useState<number | null>(null);
  const [nextRoundBet2, setNextRoundBet2] = useState<number | null>(null);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const previousMultiplierRef = useRef(1.0);
  const previousRocketXRef = useRef(15);
  const previousRocketYRef = useRef(85);
  const previousRocketRotationRef = useRef(0);
  const previousRocketSizeRef = useRef(0);
  const hasReachedX3Ref = useRef(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const crashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const explosionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Start the initial countdown after a short delay
    const timer = setTimeout(() => {
      startCountdown();
    }, 1000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (crashTimeoutRef.current) clearTimeout(crashTimeoutRef.current);
      if (explosionTimeoutRef.current) clearTimeout(explosionTimeoutRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const startCountdown = () => {
    setGameState('countdown');
    setCountdown(3);
    setMultiplier(1.0);
    setCrashPoint(null);
    setResult(null);
    setShowExplosion(false);
    
    previousMultiplierRef.current = 1.0;
    previousRocketXRef.current = 15;
    previousRocketYRef.current = 85;
    previousRocketRotationRef.current = 0;
    previousRocketSizeRef.current = 0;
    hasReachedX3Ref.current = false;
    
    // Automatically place next round bets if they exist
    if (nextRoundBet1 !== null) {
      placeBetFromNextRound(1, nextRoundBet1);
    }
    
    if (nextRoundBet2 !== null) {
      placeBetFromNextRound(2, nextRoundBet2);
    }
    
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const placeBetFromNextRound = (betNumber: number, amount: number) => {
    if (amount > balance) {
      setResult("❌ Not enough balance to place bet!");
      return;
    }
    
    if (amount < 10 || amount > 10000) {
      setResult("❌ Bet amount must be between $10 and $10,000!");
      return;
    }
    
    if (betNumber === 1) {
      if (bet1 !== null) {
        return; // Bet already placed
      }
      setBet1({amount: amount, cashedOut: false, cashoutMultiplier: 1.0, isNextRound: true});
      setBalance(prev => prev - amount);
      setResult(`🎯 Next round Bet 1 placed: $${amount}`);
    }
    
    if (betNumber === 2) {
      if (bet2 !== null) {
        return; // Bet already placed
      }
      setBet2({amount: amount, cashedOut: false, cashoutMultiplier: 1.0, isNextRound: true});
      setBalance(prev => prev - amount);
      setResult(`🎯 Next round Bet 2 placed: $${amount}`);
    }
  };

  const startGame = () => {
    const crash = generateCrashMultiplier();
    setCrashPoint(crash);
    setMultiplier(1.0);
    previousMultiplierRef.current = 1.0;
    setIsRunning(true);
    setGameState('running');
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      let baseMultiplier;
      if (elapsed < 8) {
        baseMultiplier = 1 + (elapsed / 8) * 2;
      } else {
        const adjustedElapsed = elapsed - 8;
        baseMultiplier = 3 + easeOutQuad(adjustedElapsed / 15) * 15;
      }
      
      const smoothedMultiplier = previousMultiplierRef.current + 
        (baseMultiplier - previousMultiplierRef.current) * 0.15;
      
      const newMultiplier = parseFloat(Math.max(1.0, smoothedMultiplier).toFixed(2));
      previousMultiplierRef.current = newMultiplier;

      if (crash && newMultiplier >= crash) {
        setMultiplier(crash);
        setIsRunning(false);
        setGameState('crashed');
        setShowExplosion(true);
        
        let lostAmount = 0;
        if (bet1 !== null && !bet1.cashedOut) {
          lostAmount += bet1.amount;
        }
        if (bet2 !== null && !bet2.cashedOut) {
          lostAmount += bet2.amount;
        }
        
        if (lostAmount > 0) {
          setResult(`💥 Crashed at x${crash.toFixed(2)} — You lost ${lostAmount}`);
        }
        
        setGameHistory(prev => [crash, ...prev.slice(0, 4)]);
        
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
        
        if (explosionTimeoutRef.current) clearTimeout(explosionTimeoutRef.current);
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        
        explosionTimeoutRef.current = setTimeout(() => {
          setShowExplosion(false);
          setRocketVisible(false);
          
          restartTimeoutRef.current = setTimeout(() => {
            setRocketVisible(true);
            // Reset current bets but keep next round bets
            setBet1(null);
            setBet2(null);
            startCountdown();
          }, 3000);
        }, 1000);
        
        return;
      }

      setMultiplier(newMultiplier);
      requestRef.current = requestAnimationFrame(step);
    };

    requestRef.current = requestAnimationFrame(step);
  };

  const cashOut = (betNumber: number) => {
    if (!isRunning || multiplier <= 1.0) return;
    
    if (betNumber === 1 && bet1 !== null && !bet1.cashedOut) {
      // Prevent cashing out next round bets
      if (bet1.isNextRound) {
        setResult("❌ Next round bets cannot be cashed out!");
        return;
      }
      
      const winnings = Math.floor(bet1.amount * multiplier);
      setBalance(prev => prev + winnings);
      setBet1({...bet1, cashedOut: true, cashoutMultiplier: multiplier});
      setResult(`✅ Bet 1 cashed out at x${multiplier.toFixed(2)} — You won ${winnings}!`);
    }
    
    if (betNumber === 2 && bet2 !== null && !bet2.cashedOut) {
      // Prevent cashing out next round bets
      if (bet2.isNextRound) {
        setResult("❌ Next round bets cannot be cashed out!");
        return;
      }
      
      const winnings = Math.floor(bet2.amount * multiplier);
      setBalance(prev => prev + winnings);
      setBet2({...bet2, cashedOut: true, cashoutMultiplier: multiplier});
      setResult(`✅ Bet 2 cashed out at x${multiplier.toFixed(2)} — You won ${winnings}!`);
    }
  };

  const placeBet = (betNumber: number) => {
    const betAmount = betNumber === 1 ? betAmount1 : betAmount2;
    
    if (betAmount > balance) {
      setResult("❌ Not enough balance to place bet!");
      return;
    }
    
    if (betAmount < 10 || betAmount > 10000) {
      setResult("❌ Bet amount must be between $10 and $10,000!");
      return;
    }
    
    // Allow bets during waiting, countdown, and even after crash (before restart)
    if (gameState === 'running') {
      setResult("❌ You can't place bets while the game is running!");
      return;
    }
    
    if (betNumber === 1) {
      if (bet1 !== null) {
        setResult("❌ Bet 1 already placed!");
        return;
      }
      setBet1({amount: betAmount, cashedOut: false, cashoutMultiplier: 1.0, isNextRound: false});
      setBalance(prev => prev - betAmount);
      setResult(`🎯 Bet 1 placed: $${betAmount}`);
    }
    
    if (betNumber === 2) {
      if (bet2 !== null) {
        setResult("❌ Bet 2 already placed!");
        return;
      }
      setBet2({amount: betAmount, cashedOut: false, cashoutMultiplier: 1.0, isNextRound: false});
      setBalance(prev => prev - betAmount);
      setResult(`🎯 Bet 2 placed: $${betAmount}`);
    }
  };

  const setBetForNextRound = (betNumber: number) => {
    const betAmount = betNumber === 1 ? betAmount1 : betAmount2;
    
    if (betAmount > balance) {
      setResult("❌ Not enough balance to set bet for next round!");
      return;
    }
    
    if (betAmount < 10 || betAmount > 10000) {
      setResult("❌ Bet amount must be between $10 and $10,000!");
      return;
    }
    
    if (betNumber === 1) {
      setNextRoundBet1(betAmount);
      setResult(`✅ Bet 1 set for next round: $${betAmount}`);
    }
    
    if (betNumber === 2) {
      setNextRoundBet2(betAmount);
      setResult(`✅ Bet 2 set for next round: $${betAmount}`);
    }
  };

  const removeNextRoundBet = (betNumber: number) => {
    if (betNumber === 1) {
      setNextRoundBet1(null);
      setResult("❌ Next round Bet 1 removed");
    }
    
    if (betNumber === 2) {
      setNextRoundBet2(null);
      setResult("❌ Next round Bet 2 removed");
    }
  };

  const handleBetAmountChange = (betNumber: number, value: string) => {
    const amount = parseInt(value) || 0;
    if (amount >= 10 && amount <= 10000) {
      if (betNumber === 1) {
        setBetAmount1(amount);
      } else {
        setBetAmount2(amount);
      }
    }
  };

  const setPresetAmount = (betNumber: number, amount: number) => {
    if (betNumber === 1) {
      setBetAmount1(amount);
    } else {
      setBetAmount2(amount);
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, []);

  const progress = Math.min(1, (multiplier - 1) / 2);
  
  if (multiplier >= 3 && !hasReachedX3Ref.current) {
    hasReachedX3Ref.current = true;
  }
  
  let baseRocketX = 17 + progress * 60;
  const curveX = (baseRocketX - 15) / 60;
  let baseRocketY = 85 - (60 * curveX * curveX);
  
  const x3ToX10Progress = hasReachedX3Ref.current 
    ? Math.min(1, (multiplier - 3) / 7) 
    : 0;
  
  let rocketX = baseRocketX;
  let rocketY = baseRocketY;
  
  if (hasReachedX3Ref.current) {
    const x3Progress = (3 - 1) / 2;
    const x3RocketX = 17 + x3Progress * 60;
    const x3CurveX = (x3RocketX - 15) / 60;
    const x3RocketY = 85 - (60 * x3CurveX * x3CurveX);
    
    rocketX = x3RocketX;
    rocketY = x3RocketY;
  }
  
  const targetRotation = 45 * progress;
  const finalRotation = hasReachedX3Ref.current 
    ? 45 
    : targetRotation;
  
  const smoothedRocketX = previousRocketXRef.current + (rocketX - previousRocketXRef.current) * 0.2;
  const smoothedRocketY = previousRocketYRef.current + (rocketY - previousRocketYRef.current) * 0.2;
  const smoothedRotation = previousRocketRotationRef.current + 
    (finalRotation - previousRocketRotationRef.current) * 0.2;
  
  previousRocketXRef.current = smoothedRocketX;
  previousRocketYRef.current = smoothedRocketY;
  previousRocketRotationRef.current = smoothedRotation;

  const turbulenceIntensity = 0.2 + Math.min(0.8, progress * 1.2);
  const showTurbulence = isRunning;
  
  const isCrash = !isRunning && crashPoint && multiplier >= crashPoint;

  const baseRocketSize = Math.max(
    40,
    Math.min(
      120,
      Math.round(windowSize.width / 20)
    )
  );
  
  let sizeMultiplier = 1;
  if (hasReachedX3Ref.current) {
    sizeMultiplier = 1;
  }
  
  const targetRocketSize = baseRocketSize * sizeMultiplier;
  const smoothedRocketSize = previousRocketSizeRef.current + 
    (targetRocketSize - previousRocketSizeRef.current) * 0.1;
  
  previousRocketSizeRef.current = smoothedRocketSize;

  const skyGradientTop = gameState === 'waiting' || gameState === 'countdown' 
    ? 'hsl(210, 80%, 30%)' 
    : `hsl(210, ${80 - progress * 40}%, ${30 + progress * 50}%)`;
    
  const skyGradientMiddle = gameState === 'waiting' || gameState === 'countdown' 
    ? 'hsl(220, 70%, 20%)' 
    : `hsl(220, ${70 - progress * 40}%, ${20 + progress * 40}%)`;
    
  const skyGradientBottom = gameState === 'waiting' || gameState === 'countdown' 
    ? 'hsl(230, 60%, 10%)' 
    : `hsl(230, ${60 - progress * 40}%, ${10 + progress * 30}%)`;
  
  const groundVisibility = gameState === 'waiting' || gameState === 'countdown' 
    ? 1 
    : Math.max(0, 1 - progress * 1.5);

  // Allow placing bets during waiting, countdown, and after crash (before restart)
  const canPlaceBets = gameState !== 'running';

  return (
    <>
      <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">

        <div className="absolute top-4 right-4 bg-gray-800 px-4 py-2 rounded text-lg font-semibold shadow z-10">
          💰 Balance: ${balance.toLocaleString()}
        </div>

        <div className="absolute top-4 left-4 flex space-x-2 z-10">
          {gameHistory.map((point, index) => (
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

        {bet1 !== null && (
          <div className={`absolute top-16 left-4 px-4 py-2 rounded text-lg font-semibold shadow z-10 ${
            bet1.cashedOut ? 'bg-green-800' : bet1.isNextRound ? 'bg-blue-900' : 'bg-blue-800'
          }`}>
            {bet1.cashedOut ? `✅ Bet 1: x${bet1.cashoutMultiplier.toFixed(2)}` : 
             bet1.isNextRound ? `⏭️ Bet 1: $${bet1.amount}` : `🎯 Bet 1: $${bet1.amount}`}
          </div>
        )}

        {bet2 !== null && (
          <div className={`absolute top-16 right-4 px-4 py-2 rounded text-lg font-semibold shadow z-10 ${
            bet2.cashedOut ? 'bg-green-800' : bet2.isNextRound ? 'bg-purple-900' : 'bg-purple-800'
          }`}>
            {bet2.cashedOut ? `✅ Bet 2: x${bet2.cashoutMultiplier.toFixed(2)}` : 
             bet2.isNextRound ? `⏭️ Bet 2: $${bet2.amount}` : `🎯 Bet 2: $${bet2.amount}`}
          </div>
        )}

        {nextRoundBet1 !== null && bet1 === null && (
          <div className="absolute top-28 left-4 px-4 py-2 rounded text-sm font-semibold shadow z-10 bg-blue-900">
            Next Round Bet 1: ${nextRoundBet1}
          </div>
        )}

        {nextRoundBet2 !== null && bet2 === null && (
          <div className="absolute top-28 right-4 px-4 py-2 rounded text-sm font-semibold shadow z-10 bg-purple-900">
            Next Round Bet 2: ${nextRoundBet2}
          </div>
        )}

        <div className="w-full max-w-4xl aspect-[3/2] bg-gray-800 border-8 border-yellow-500 rounded-xl relative overflow-hidden game-screen shadow-2xl">
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: `linear-gradient(to bottom, ${skyGradientTop}, ${skyGradientMiddle}, ${skyGradientBottom})`
            }}
          >
            <div 
              className="absolute top-1/4 left-1/4 w-16 h-8 bg-white/30 rounded-full transition-all duration-1000"
              style={{
                opacity: gameState === 'waiting' || gameState === 'countdown' ? 1 : 1 - progress,
                transform: gameState === 'waiting' || gameState === 'countdown' ? 'none' : `translate(${progress * 20}px, ${-progress * 40}px)`
              }}
            ></div>
            <div 
              className="absolute top-1/3 right-1/4 w-20 h-10 bg-white/40 rounded-full transition-all duration-1000"
              style={{
                opacity: gameState === 'waiting' || gameState === 'countdown' ? 1 : 1 - progress,
                transform: gameState === 'waiting' || gameState === 'countdown' ? 'none' : `translate(${-progress * 30}px, ${-progress * 50}px)`
              }}
            ></div>
            <div 
              className="absolute top-1/5 left-1/5 w-24 h-12 bg-white/20 rounded-full transition-all duration-1000"
              style={{
                opacity: gameState === 'waiting' || gameState === 'countdown' ? 1 : 1 - progress,
                transform: gameState === 'waiting' || gameState === 'countdown' ? 'none' : `translate(${progress * 40}px, ${-progress * 60}px)`
              }}
            ></div>
            
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white transition-all duration-1000"
                style={{
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  top: `${10 + Math.random() * 80}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: gameState === 'waiting' || gameState === 'countdown' ? 0 : progress * (Math.random() * 0.7 + 0.3),
                  animation: gameState === 'waiting' || gameState === 'countdown' ? 'none' : `twinkle-${i % 3} ${3 + Math.random() * 4}s infinite`
                }}
              />
            ))}
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
            style={{
              height: gameState === 'waiting' || gameState === 'countdown' ? '16%' : `${16 * groundVisibility}%`,
              opacity: gameState === 'waiting' || gameState === 'countdown' ? 1 : groundVisibility,
              background: `linear-gradient(to bottom, 
                rgba(34, 139, 34, ${gameState === 'waiting' || gameState === 'countdown' ? 0.7 : 0.7 * groundVisibility}), 
                rgba(0, 100, 0, ${gameState === 'waiting' || gameState === 'countdown' ? 0.9 : 0.9 * groundVisibility}))`
            }}
          ></div>

          {rocketVisible && !showExplosion && (
            <div
              className={`absolute transition-all duration-100 ${
                showTurbulence ? 'turbulence' : ''
              }`}
              style={{
                left: gameState === 'waiting' || gameState === 'countdown' ? '15%' : `${smoothedRocketX}%`,
                top: gameState === 'waiting' || gameState === 'countdown' ? '85%' : `${smoothedRocketY}%`,
                transform: gameState === 'waiting' || gameState === 'countdown' 
                  ? 'translate(-50%, -50%) rotate(0deg)' 
                  : `translate(-50%, -50%) rotate(${smoothedRotation}deg)`,
                pointerEvents: 'none',
                transition: 'left 0.1s linear, top 0.1s linear, transform 0.1s linear, font-size 0.1s ease-in-out',
                animation: showTurbulence ? `shake-${Math.floor(turbulenceIntensity * 3)} 0.5s infinite` : 'none',
                ['--rotation' as any]: `${smoothedRotation}deg`,
                fontSize: gameState === 'waiting' || gameState === 'countdown' 
                  ? `${Math.max(40, Math.min(120, Math.round(windowSize.width / 20)))}px` 
                  : `${smoothedRocketSize}px`,
                filter: showTurbulence ? `blur(${turbulenceIntensity * 0.8}px)` : 'none',
                zIndex: hasReachedX3Ref.current ? 20 : 10
              }}
            >
              🚀
            </div>
          )}

          {showExplosion && (
            <div
              className="absolute explode-animation"
              style={{
                left: `${smoothedRocketX}%`,
                top: `${smoothedRocketY}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                fontSize: `${smoothedRocketSize * 1.5}px`,
                zIndex: 30
              }}
            >
              💥
            </div>
          )}

          <div className="absolute top-4 left-4 text-4xl font-bold text-green-400 drop-shadow-lg">
            {isRunning || result ? `x${multiplier.toFixed(2)}` : '—'}
          </div>

          {result && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded text-lg font-medium">
              {result}
            </div>
          )}

          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-bold bg-black/50 rounded-full w-24 h-24 flex items-center justify-center">
                {countdown}
              </div>
            </div>
          )}

          <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded text-sm">
            {gameState === 'waiting' && 'Waiting...'}
            {gameState === 'countdown' && 'Starting...'}
            {gameState === 'running' && 'Flying!'}
            {gameState === 'crashed' && 'Crashed!'}
          </div>
        </div>

        <div className="mt-8 flex flex-col space-y-4 z-10 w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Bet 1</h3>
              <div className="flex items-center space-x-2 mb-3">
                <button 
                  onClick={() => setPresetAmount(1, 100)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $100
                </button>
                <button 
                  onClick={() => setPresetAmount(1, 500)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $500
                </button>
                <button 
                  onClick={() => setPresetAmount(1, 1000)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $1,000
                </button>
                <button 
                  onClick={() => setPresetAmount(1, 5000)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $5,000
                </button>
                <button 
                  onClick={() => setPresetAmount(1, 10000)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $10,000
                </button>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={betAmount1}
                  onChange={(e) => handleBetAmountChange(1, e.target.value)}
                  className="w-24 px-2 py-1 bg-gray-700 rounded text-center"
                />
                
                {bet1 === null ? (
                  <button
                    onClick={() => placeBet(1)}
                    disabled={!canPlaceBets}
                    className="px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Place Bet 1
                  </button>
                ) : (
                  <button
                    onClick={() => cashOut(1)}
                    disabled={!isRunning || bet1.cashedOut || bet1.isNextRound}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      bet1.cashedOut ? 'bg-green-600' : 
                      bet1.isNextRound ? 'bg-blue-900 cursor-not-allowed' : 
                      'bg-yellow-500 hover:bg-yellow-600'
                    } disabled:opacity-50 transition-colors`}
                  >
                    {bet1.cashedOut ? 'Cashed Out' : 
                     bet1.isNextRound ? 'Next Round Bet' : 
                     'Cash Out Bet 1'}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {nextRoundBet1 === null ? (
                  <button
                    onClick={() => setBetForNextRound(1)}
                    disabled={!canPlaceBets}
                    className="px-3 py-1 text-sm rounded-lg font-semibold bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    Set for Next Round
                  </button>
                ) : (
                  <button
                    onClick={() => removeNextRoundBet(1)}
                    className="px-3 py-1 text-sm rounded-lg font-semibold bg-red-800 hover:bg-red-900 transition-colors"
                  >
                    Remove Next Round Bet
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Bet 2</h3>
              <div className="flex items-center space-x-2 mb-3">
                <button 
                  onClick={() => setPresetAmount(2, 100)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $100
                </button>
                <button 
                  onClick={() => setPresetAmount(2, 500)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $500
                </button>
                <button 
                  onClick={() => setPresetAmount(2, 1000)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $1,000
                </button>
                <button 
                  onClick={() => setPresetAmount(2, 5000)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $5,000
                </button>
                <button 
                  onClick={() => setPresetAmount(2, 10000)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50"
                >
                  $10,000
                </button>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={betAmount2}
                  onChange={(e) => handleBetAmountChange(2, e.target.value)}
                  className="w-24 px-2 py-1 bg-gray-700 rounded text-center"
                />
                
                {bet2 === null ? (
                  <button
                    onClick={() => placeBet(2)}
                    disabled={!canPlaceBets}
                    className="px-4 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    Place Bet 2
                  </button>
                ) : (
                  <button
                    onClick={() => cashOut(2)}
                    disabled={!isRunning || bet2.cashedOut || bet2.isNextRound}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      bet2.cashedOut ? 'bg-green-600' : 
                      bet2.isNextRound ? 'bg-purple-900 cursor-not-allowed' : 
                      'bg-yellow-500 hover:bg-yellow-600'
                    } disabled:opacity-50 transition-colors`}
                  >
                    {bet2.cashedOut ? 'Cashed Out' : 
                     bet2.isNextRound ? 'Next Round Bet' : 
                     'Cash Out Bet 2'}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {nextRoundBet2 === null ? (
                  <button
                    onClick={() => setBetForNextRound(2)}
                    disabled={!canPlaceBets}
                    className="px-3 py-1 text-sm rounded-lg font-semibold bg-purple-800 hover:bg-purple-900 transition-colors disabled:opacity-50"
                  >
                    Set for Next Round
                  </button>
                ) : (
                  <button
                    onClick={() => removeNextRoundBet(2)}
                    className="px-3 py-1 text-sm rounded-lg font-semibold bg-red-800 hover:bg-red-900 transition-colors"
                  >
                    Remove Next Round Bet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes shake-0 {
          0% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
          50% { transform: translate(-50.5%, -49.5%) rotate(var(--rotation, 0deg)); }
          100% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
        }
        
        @keyframes shake-1 {
          0% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
          25% { transform: translate(-50.5%, -49.5%) rotate(calc(var(--rotation, 0deg) - 1deg)); }
          50% { transform: translate(-49.5%, -50.5%) rotate(calc(var(--rotation, 0deg) + 1deg)); }
          75% { transform: translate(-50.5%, -50.5%) rotate(calc(var(--rotation, 0deg) - 1deg)); }
          100% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
        }
        
        @keyframes shake-2 {
          0% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
          25% { transform: translate(-51%, -49%) rotate(calc(var(--rotation, 0deg) - 2deg)); }
          50% { transform: translate(-49%, -51%) rotate(calc(var(--rotation, 0deg) + 2deg)); }
          75% { transform: translate(-51%, -51%) rotate(calc(var(--rotation, 0deg) - 2deg)); }
          100% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
        }
        
        @keyframes shake-3 {
          0% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
          25% { transform: translate(-52%, -48%) rotate(calc(var(--rotation, 0deg) - 3deg)); }
          50% { transform: translate(-48%, -52%) rotate(calc(var(--rotation, 0deg) + 3deg)); }
          75% { transform: translate(-52%, -52%) rotate(calc(var(--rotation, 0deg) - 3deg)); }
          100% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)); }
        }

        @keyframes twinkle-0 {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        
        @keyframes twinkle-1 {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
        
        @keyframes twinkle-2 {
          0% { opacity: 0.2; }
          50% { opacity: 0.7; 
          }
          100% { opacity: 0.2; }
        }

        .turbulence {
          animation-duration: 0.5s;
          animation-iteration-count: infinite;
        }

        @keyframes explode {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.5);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }

        .explode-animation {
          animation: explode 0.6s ease-out forwards;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .game-screen {
            max-width: 95vw;
          }
          
          .game-screen .text-4xl {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .game-screen {
            border-width: 4px;
          }
          
          .game-screen .text-4xl {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}