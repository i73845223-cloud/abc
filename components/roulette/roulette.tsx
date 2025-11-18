'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

const useSound = () => {
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null);
  const chipSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      backgroundMusicRef.current = new Audio();
      backgroundMusicRef.current.src = '/bgr2.mp3';
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = 0.3;

      spinSoundRef.current = new Audio();
      spinSoundRef.current.src = '/spinw1.mp3';
      spinSoundRef.current.volume = 0.6;

      buttonSoundRef.current = new Audio();
      buttonSoundRef.current.src = '/bs2.mp3';
      buttonSoundRef.current.volume = 0.8;

      chipSoundRef.current = new Audio();
      chipSoundRef.current.src = '/fishkisound.mp3';
      chipSoundRef.current.volume = 0.5;
    }
  }, []);

  const setButtonSoundVolume = useCallback((volume: number) => {
    if (buttonSoundRef.current) {
      buttonSoundRef.current.volume = volume;
    }
  }, []);

  const setChipSoundVolume = useCallback((volume: number) => {
    if (chipSoundRef.current) {
      chipSoundRef.current.volume = volume;
    }
  }, []);

  const setSpinSoundVolume = useCallback((volume: number) => {
    if (spinSoundRef.current) {
      spinSoundRef.current.volume = volume;
    }
  }, []);

  const setBackgroundMusicVolume = useCallback((volume: number) => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = volume;
    }
  }, []);

  const playBackgroundMusic = useCallback(async () => {
    if (backgroundMusicRef.current) {
      try {
        backgroundMusicRef.current.currentTime = 0;
        await backgroundMusicRef.current.play();
      } catch (error) {
        console.log('Autoplay prevented');
      }
    }
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  }, []);

  const playSpinSound = useCallback(async () => {
    if (spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0;
      await spinSoundRef.current.play();
    }
  }, []);

  const stopSpinSound = useCallback(() => {
    if (spinSoundRef.current) {
      spinSoundRef.current.pause();
      spinSoundRef.current.currentTime = 0;
    }
  }, []);

  const playButtonSound = useCallback(async () => {
    if (buttonSoundRef.current) {
      buttonSoundRef.current.currentTime = 0;
      await buttonSoundRef.current.play();
    }
  }, []);

  const playChipSound = useCallback(async () => {
    if (chipSoundRef.current) {
      chipSoundRef.current.currentTime = 0;
      await chipSoundRef.current.play();
    }
  }, []);

  return {
    playBackgroundMusic,
    stopBackgroundMusic,
    playSpinSound,
    stopSpinSound,
    playButtonSound,
    playChipSound,
    setButtonSoundVolume,
    setChipSoundVolume,
    setSpinSoundVolume,
    setBackgroundMusicVolume,
  };
};

interface Chip {
  id: string;
  value: number;
  position: { x: number; y: number };
  betType: string;
  betValue: string | number;
}

interface GameState {
  balance: number;
  currentBet: number;
  chips: Chip[];
  isSpinning: boolean;
  winningNumber: number | null;
  gameHistory: number[];
  totalBet: number;
  showWheel: boolean;
  wheelAnimation: 'entering' | 'visible' | 'exiting' | 'hidden';
  soundEnabled: boolean;
  showVolumeSlider: boolean;
  winAmount: number | null;
  showWinMessage: boolean;
  masterVolume: number;
}

const CompactRouletteTable = () => {
  const {
    playBackgroundMusic,
    stopBackgroundMusic,
    playSpinSound,
    stopSpinSound,
    playButtonSound,
    playChipSound,
    setButtonSoundVolume,
    setChipSoundVolume,
    setSpinSoundVolume,
    setBackgroundMusicVolume,
  } = useSound();

  const [gameState, setGameState] = useState<GameState>({
    balance: 50000,
    currentBet: 500,
    chips: [],
    isSpinning: false,
    winningNumber: null,
    gameHistory: [32, 15, 0, 19, 4, 21, 2, 25, 17, 34],
    totalBet: 0,
    showWheel: false,
    wheelAnimation: 'hidden',
    soundEnabled: true,
    showVolumeSlider: false,
    winAmount: null,
    showWinMessage: false,
    masterVolume: 0.8,
  });

  const tableRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const hasInteracted = useRef(false);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const winMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chipValues = [100, 500, 1000, 2500, 5000];

  const numbersLayout = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
    [13, 14, 15],
    [16, 17, 18],
    [19, 20, 21],
    [22, 23, 24],
    [25, 26, 27],
    [28, 29, 30],
    [31, 32, 33],
    [34, 35, 36]
  ];

  // Правильное расположение чисел на европейской рулетке
  const rouletteNumbers = useMemo(() => [
    { number: 0, color: 'green' },
    { number: 32, color: 'red' }, { number: 15, color: 'black' }, { number: 19, color: 'red' },
    { number: 4, color: 'black' }, { number: 21, color: 'red' }, { number: 2, color: 'black' },
    { number: 25, color: 'red' }, { number: 17, color: 'black' }, { number: 34, color: 'red' },
    { number: 6, color: 'black' }, { number: 27, color: 'red' }, { number: 13, color: 'black' },
    { number: 36, color: 'red' }, { number: 11, color: 'black' }, { number: 30, color: 'red' },
    { number: 8, color: 'black' }, { number: 23, color: 'red' }, { number: 10, color: 'black' },
    { number: 5, color: 'red' }, { number: 24, color: 'black' }, { number: 16, color: 'red' },
    { number: 33, color: 'black' }, { number: 1, color: 'red' }, { number: 20, color: 'black' },
    { number: 14, color: 'red' }, { number: 31, color: 'black' }, { number: 9, color: 'red' },
    { number: 22, color: 'black' }, { number: 18, color: 'red' }, { number: 29, color: 'black' },
    { number: 7, color: 'red' }, { number: 28, color: 'black' }, { number: 12, color: 'red' },
    { number: 35, color: 'black' }, { number: 3, color: 'red' }, { number: 26, color: 'black' }
  ], []);

  useEffect(() => {
    const volume = gameState.masterVolume;
    setButtonSoundVolume(volume);
    setChipSoundVolume(volume * 0.625);
    setSpinSoundVolume(volume * 0.75);
    setBackgroundMusicVolume(volume * 0.375);
  }, [gameState.masterVolume, setButtonSoundVolume, setChipSoundVolume, setSpinSoundVolume, setBackgroundMusicVolume]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target as Node)) {
        setGameState(prev => ({ ...prev, showVolumeSlider: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (winMessageTimeoutRef.current) {
        clearTimeout(winMessageTimeoutRef.current);
      }
      if (volumeHoverTimeoutRef.current) {
        clearTimeout(volumeHoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted.current && gameState.soundEnabled) {
        hasInteracted.current = true;
        playBackgroundMusic();
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, [gameState.soundEnabled, playBackgroundMusic]);

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'bg-emerald-600 hover:bg-emerald-500';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) 
      ? 'bg-rose-600 hover:bg-rose-500' 
      : 'bg-gray-900 hover:bg-gray-800';
  };

  const placeChip = useCallback((betType: string, betValue: string | number, clientX: number, clientY: number, useButtonSound: boolean = false) => {
    if (gameState.currentBet > gameState.balance || gameState.isSpinning) return;
    if (!tableRef.current) return;

    const tableRect = tableRef.current.getBoundingClientRect();
    const x = ((clientX - tableRect.left) / tableRect.width) * 100;
    const y = ((clientY - tableRect.top) / tableRect.height) * 100;

    const newChip: Chip = {
      id: Math.random().toString(36).substr(2, 9),
      value: gameState.currentBet,
      position: { x, y },
      betType,
      betValue
    };

    if (gameState.soundEnabled) {
      if (useButtonSound) {
        playButtonSound();
      } else {
        playChipSound();
      }
    }

    setGameState(prev => ({
      ...prev,
      balance: prev.balance - prev.currentBet,
      chips: [...prev.chips, newChip],
      totalBet: prev.totalBet + prev.currentBet
    }));
  }, [gameState.currentBet, gameState.balance, gameState.isSpinning, gameState.soundEnabled, playChipSound, playButtonSound]);

  const clearBets = useCallback(() => {
    const totalBetAmount = gameState.chips.reduce((sum, chip) => sum + chip.value, 0);
    
    if (gameState.soundEnabled && totalBetAmount > 0) {
      playButtonSound();
    }

    setGameState(prev => ({
      ...prev,
      balance: prev.balance + totalBetAmount,
      chips: [],
      totalBet: 0
    }));
  }, [gameState.chips, gameState.soundEnabled, playButtonSound]);

  const showWheel = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      showWheel: true, 
      wheelAnimation: 'entering' 
    }));

    setTimeout(() => {
      setGameState(prev => ({ 
        ...prev, 
        wheelAnimation: 'visible' 
      }));
    }, 300);
  }, []);

  const hideWheel = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      wheelAnimation: 'exiting' 
    }));

    setTimeout(() => {
      setGameState(prev => ({ 
        ...prev, 
        showWheel: false,
        wheelAnimation: 'hidden'
      }));
    }, 300);
  }, []);

  const spinWheel = useCallback(async () => {
    if (gameState.chips.length === 0 || gameState.isSpinning) return;

    if (gameState.soundEnabled) {
      playButtonSound();
    }

    setGameState(prev => ({ ...prev, isSpinning: true, winAmount: null, showWinMessage: false }));
    showWheel();

    await new Promise(resolve => setTimeout(resolve, 400));

    if (gameState.soundEnabled) {
      playSpinSound();
    }

    if (wheelRef.current) {
      const randomSpins = 5 + Math.random() * 3;
      const winningNum = Math.floor(Math.random() * 37);
      const winningIndex = rouletteNumbers.findIndex(n => n.number === winningNum);
      const segmentAngle = 360 / rouletteNumbers.length;
      const targetRotation = 360 * randomSpins + (winningIndex * segmentAngle);
      
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0.3, 0.2, 0.9)';
      wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
    }

    setTimeout(() => {
      const winningNum = Math.floor(Math.random() * 37);
      
      let winAmount = 0;
      gameState.chips.forEach(chip => {
        if (chip.betType === 'straight' && chip.betValue === winningNum) {
          winAmount += chip.value * 36;
        }
      });

      if (gameState.soundEnabled) {
        stopSpinSound();
      }

      setGameState(prev => ({
        ...prev,
        winningNumber: winningNum,
        balance: prev.balance + winAmount,
        isSpinning: false,
        chips: [],
        totalBet: 0,
        gameHistory: [winningNum, ...prev.gameHistory.slice(0, 10)],
        winAmount: winAmount > 0 ? winAmount : null
      }));

      if (winAmount > 0) {
        setGameState(prev => ({ ...prev, showWinMessage: true }));
        
        winMessageTimeoutRef.current = setTimeout(() => {
          setGameState(prev => ({ ...prev, showWinMessage: false }));
        }, 5000);
      }

      setTimeout(() => {
        hideWheel();
      }, 1500);

    }, 4000);

  }, [gameState.chips, gameState.isSpinning, gameState.soundEnabled, rouletteNumbers, showWheel, hideWheel, playSpinSound, stopSpinSound, playButtonSound]);

  const toggleSound = useCallback(() => {
    const newSoundState = !gameState.soundEnabled;
    
    if (gameState.soundEnabled) {
      playButtonSound();
    }

    if (newSoundState) {
      playBackgroundMusic();
    } else {
      stopBackgroundMusic();
      stopSpinSound();
    }

    setGameState(prev => ({
      ...prev,
      soundEnabled: newSoundState
    }));
  }, [gameState.soundEnabled, playBackgroundMusic, stopBackgroundMusic, stopSpinSound, playButtonSound]);

  const handleVolumeHover = useCallback(() => {
    if (volumeHoverTimeoutRef.current) {
      clearTimeout(volumeHoverTimeoutRef.current);
    }
    setGameState(prev => ({ ...prev, showVolumeSlider: true }));
  }, []);

  const handleVolumeLeave = useCallback(() => {
    volumeHoverTimeoutRef.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, showVolumeSlider: false }));
    }, 300);
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    setGameState(prev => ({ ...prev, masterVolume: volume }));
  }, []);

  const handleChipSelect = useCallback((value: number) => {
    if (gameState.soundEnabled) {
      playChipSound();
    }
    
    setGameState(prev => ({ ...prev, currentBet: value }));
  }, [gameState.soundEnabled, playChipSound]);

  const getChipColor = (value: number): string => {
    switch (value) {
      case 100: return 'bg-white border-white text-gray-900 shadow-lg';
      case 500: return 'bg-rose-500 border-rose-600 text-white shadow-lg';
      case 1000: return 'bg-blue-500 border-blue-600 text-white shadow-lg';
      case 2500: return 'bg-emerald-500 border-emerald-600 text-white shadow-lg';
      case 5000: return 'bg-amber-400 border-amber-500 text-gray-900 shadow-lg';
      default: return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getChipLabel = (value: number): string => {
    if (value >= 1000) return `₹${value/1000}K`;
    return `₹${value}`;
  };

  const getWheelAnimationClass = () => {
    switch (gameState.wheelAnimation) {
      case 'entering': return 'opacity-0 scale-50';
      case 'visible': return 'opacity-100 scale-100';
      case 'exiting': return 'opacity-0 scale-50';
      case 'hidden': return 'opacity-0 scale-50';
      default: return 'opacity-0 scale-50';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-3 overflow-hidden relative">
      
      {gameState.showWinMessage && gameState.winAmount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="relative z-10 bg-gradient-to-br from-amber-400 to-amber-600 p-8 rounded-2xl shadow-2xl animate-pulse">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
              <p className="text-2xl font-bold text-gray-900">
                You won ₹{gameState.winAmount.toLocaleString()}!
              </p>
              <button
                onClick={() => setGameState(prev => ({ ...prev, showWinMessage: false }))}
                className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState.showWheel && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80"></div>
          
          <div className={`relative z-10 transition-all duration-300 ease-out ${getWheelAnimationClass()}`}>
            <div 
              ref={wheelRef}
              className="w-[80vh] h-[80vh] max-w-[90vw] max-h-[90vw] rounded-full border-8 border-amber-500 bg-emerald-800 relative overflow-visible transition-transform duration-4000 shadow-2xl"
              style={{ 
                transform: 'rotate(0deg)',
                transitionTimingFunction: 'cubic-bezier(0.1, 0.3, 0.2, 0.9)'
              }}
            >
              {/* Основные сектора */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {rouletteNumbers.map((item, index) => {
                  const angle = (360 / rouletteNumbers.length) * index;
                  const color = item.color === 'green' ? 'bg-emerald-600' : 
                               item.color === 'red' ? 'bg-rose-600' : 'bg-gray-900';
                  
                  return (
                    <div
                      key={index}
                      className={`absolute top-0 left-0 w-full h-full origin-center ${color}`}
                      style={{
                        transform: `rotate(${angle}deg)`,
                        clipPath: `polygon(50% 50%, 
                          ${50 + 50 * Math.cos((angle - 4.86) * Math.PI / 180)}% 
                          ${50 + 50 * Math.sin((angle - 4.86) * Math.PI / 180)}%, 
                          ${50 + 50 * Math.cos((angle + 4.86) * Math.PI / 180)}% 
                          ${50 + 50 * Math.sin((angle + 4.86) * Math.PI / 180)}%)`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Тонкие разделительные линии */}
              <div className="absolute inset-0">
                {rouletteNumbers.map((_, index) => {
                  const angle = (360 / rouletteNumbers.length) * index;
                  return (
                    <div
                      key={index}
                      className="absolute top-0 left-1/2 w-0.5 h-1/2 origin-bottom bg-white/80"
                      style={{
                        transform: `translateX(-50%) rotate(${angle}deg)`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Цифры - правильное расположение */}
              <div className="absolute inset-0">
                {rouletteNumbers.map((item, index) => {
                  const angle = (360 / rouletteNumbers.length) * index;
                  const radius = 35; // Радиус для расположения цифр
                  const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180);
                  const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180);
                  
                  return (
                    <div
                      key={index}
                      className="absolute text-white font-bold text-sm flex items-center justify-center w-8 h-8 z-10"
                      style={{
                        left: `${x - 4}%`,
                        top: `${y - 4}%`,
                        transform: `rotate(${angle + 90}deg)`,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {item.number}
                    </div>
                  );
                })}
              </div>
              
              {/* Центральный круг с градиентом */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border-4 border-amber-300 z-20 shadow-inner"></div>

              {/* Внешние декоративные кольца */}
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 pointer-events-none"></div>
              <div className="absolute inset-2 rounded-full border-2 border-white/30 pointer-events-none"></div>
              <div className="absolute inset-4 rounded-full border-1 border-white/20 pointer-events-none"></div>
              
              {/* Металлический обод */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-600 opacity-20 pointer-events-none"></div>
            </div>
            
            {/* Стильный указатель */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-6 h-16 bg-gradient-to-b from-red-600 to-red-800 clip-triangle z-30 shadow-2xl border-b-2 border-red-900"></div>

            {gameState.winningNumber !== null && gameState.wheelAnimation === 'exiting' && (
              <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-6 py-3 rounded-lg text-xl font-bold animate-pulse border-2 border-amber-500">
                Winning Number: <span className="text-amber-400">{gameState.winningNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Остальной код остается без изменений */}
      <div className="flex justify-between items-center mb-3 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-bold text-gray-900 text-lg">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">European Roulette</h1>
            <p className="text-amber-400 text-xs">Table #7</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 relative">
          <div 
            ref={volumeSliderRef}
            className="relative flex items-center"
            onMouseEnter={handleVolumeHover}
            onMouseLeave={handleVolumeLeave}
          >
            <div className="flex items-center space-x-2">
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                gameState.showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'
              }`}>
                <div className="bg-slate-700 rounded-lg p-2">
                  <div className="text-white text-xs text-center mb-1">Volume</div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={gameState.masterVolume}
                    className="w-full accent-amber-500"
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  />
                  <div className="text-amber-400 text-xs text-center mt-1">
                    {Math.round(gameState.masterVolume * 100)}%
                  </div>
                </div>
              </div>
              
              <button
                onClick={toggleSound}
                className={`p-2 rounded-lg transition-all ${
                  gameState.soundEnabled 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={gameState.soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {gameState.soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 px-6 py-2 rounded-xl font-bold text-lg">
            ₹{gameState.balance.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 h-[calc(100vh-80px)] relative z-0">
        
        <div className="col-span-3">
          <div 
            ref={tableRef}
            className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-3 border-2 border-amber-500/20 h-full relative"
          >
            
            {gameState.chips.map(chip => (
              <div
                key={chip.id}
                className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-lg ${getChipColor(chip.value)}`}
                style={{
                  left: `${chip.position.x}%`,
                  top: `${chip.position.y}%`,
                }}
              >
                {getChipLabel(chip.value)}
              </div>
            ))}

            <div className="grid grid-cols-13 grid-rows-6 gap-1 h-full">
              
              <div className="col-span-1 row-span-2">
                <div 
                  className="h-full bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-emerald-500 transition-all border border-emerald-500"
                  onClick={(e) => placeChip('straight', 0, e.clientX, e.clientY, false)}
                >
                  0
                </div>
              </div>

              <div className="col-span-9 row-span-4 grid grid-rows-12 gap-0.5">
                {numbersLayout.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-3 gap-0.5">
                    {row.map(num => (
                      <div
                        key={num}
                        className={`h-full rounded flex items-center justify-center text-white font-bold text-sm cursor-pointer transition-all border border-white/10 min-h-[30px] ${getNumberColor(num)}`}
                        onClick={(e) => placeChip('straight', num, e.clientX, e.clientY, false)}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="col-span-3 row-span-4 grid grid-rows-3 gap-1">
                {['1st', '2nd', '3rd'].map((column, index) => (
                  <div 
                    key={column}
                    className="bg-slate-800/90 rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-slate-700 transition-all border border-slate-600"
                    onClick={(e) => placeChip('column', column, e.clientX, e.clientY, true)}
                  >
                    {column} COL
                  </div>
                ))}
              </div>

              <div className="col-span-13 row-span-2 grid grid-cols-9 gap-1">
                {[
                  { label: '1-12', type: 'dozen', value: '1st', useButtonSound: false },
                  { label: '13-24', type: 'dozen', value: '2nd', useButtonSound: false },
                  { label: '25-36', type: 'dozen', value: '3rd', useButtonSound: false },
                  { label: 'RED', type: 'red-black', value: 'red', className: 'bg-rose-600 hover:bg-rose-500 border-rose-500', useButtonSound: true },
                  { label: 'BLACK', type: 'red-black', value: 'black', className: 'bg-gray-900 hover:bg-gray-800 border-gray-700', useButtonSound: true },
                  { label: 'EVEN', type: 'even-odd', value: 'even', useButtonSound: true },
                  { label: 'ODD', type: 'even-odd', value: 'odd', useButtonSound: true },
                  { label: '1-18', type: 'high-low', value: '1-18', useButtonSound: false },
                  { label: '19-36', type: 'high-low', value: '19-36', useButtonSound: false }
                ].map((bet) => (
                  <div 
                    key={bet.label}
                    className={`rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-slate-700 transition-all border ${
                      bet.className || 'bg-slate-800/90 border-slate-600'
                    }`}
                    onClick={(e) => placeChip(bet.type, bet.value, e.clientX, e.clientY, bet.useButtonSound)}
                  >
                    {bet.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute top-2 right-2 bg-black/70 rounded-lg p-2">
              <div className="flex space-x-1">
                {gameState.gameHistory.slice(0, 8).map((num, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      num === 0 ? 'bg-emerald-500' : 
                      getNumberColor(num).includes('rose') ? 'bg-rose-500' : 'bg-gray-800'
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-2 left-2 bg-black/70 rounded-lg px-3 py-1">
              <div className="text-green-400 text-sm font-bold">
                Bet: <span className="text-amber-400">₹{gameState.totalBet}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-2">
          
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[40%]">
            <h3 className="text-white font-bold mb-3 text-center text-sm">Chips</h3>
            <div className="space-y-2 h-[calc(100%-2rem)] flex flex-col justify-between">
              {chipValues.map(value => (
                <button
                  key={value}
                  className={`w-full py-3 rounded-lg flex items-center justify-center font-bold transition-all flex-1 ${getChipColor(value)} ${
                    gameState.currentBet === value ? 'ring-2 ring-amber-300 scale-105' : ''
                  }`}
                  onClick={() => handleChipSelect(value)}
                >
                  {getChipLabel(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[30%]">
            <div className="space-y-2 h-full flex flex-col justify-between">
              <div className="text-center">
                <div className="text-slate-300 text-sm">Current Bet</div>
                <div className="text-amber-400 font-bold text-xl">₹{gameState.currentBet}</div>
              </div>
              
              <button
                onClick={clearBets}
                disabled={gameState.chips.length === 0 || gameState.isSpinning}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex-1"
              >
                CLEAR
              </button>
              
              <button
                onClick={spinWheel}
                disabled={gameState.chips.length === 0 || gameState.isSpinning}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-600 disabled:to-slate-700 text-gray-900 font-bold py-2 rounded-lg transition-all disabled:opacity-50 flex-1"
              >
                {gameState.isSpinning ? 'SPINNING...' : 'SPIN'}
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[15%]">
            <h3 className="text-white font-bold mb-1 text-center text-sm">Stats</h3>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center">
                <div className="text-slate-300">Hot</div>
                <div className="text-rose-400 font-bold">15</div>
              </div>
              <div className="text-center">
                <div className="text-slate-300">Cold</div>
                <div className="text-blue-400 font-bold">27</div>
              </div>
              <div className="text-center">
                <div className="text-slate-300">Last</div>
                <div className="text-amber-400 font-bold">2nd</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 h-[15%]">
            <div className="text-center h-full flex flex-col justify-center">
              <div className="text-slate-300 text-sm">Chips on table</div>
              <div className="text-green-400 font-bold text-lg">{gameState.chips.length}</div>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  );
};

export default CompactRouletteTable;