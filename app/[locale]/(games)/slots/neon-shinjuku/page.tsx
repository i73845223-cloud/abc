"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { GoTriangleRight } from "react-icons/go";
import { ChevronLeftCircle, Volume2, VolumeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { formatter } from "@/lib/utils";

import spinIcon from "@/public/spin.webp";
import slotBg from "@/public/neon-shinjuku/bg.webp";
import frameOverlay from "@/public/neon-shinjuku/frame.webp";

import { 
  ANIMATION_DURATION,
  MIN_BET,
  MAX_BET,
  PRESET_BETS,
  AUTO_SPIN_OPTIONS,
  SOUND_PATHS,
  SYMBOLS,
  getRandomSymbol
} from "./slot-machine.data";
import { PayoutsSheet } from "./payout-sheet.server";
import { useBalance } from "../../../../../actions/use-balance";

type Position = {
  col: number;
  row: number;
};

const SlotMachine = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    balance,
    displayBalance,
    balanceLoading,
    getBalance,
    updateUserBalance,
    processSpin 
  } = useBalance();
  
  const [bet, setBet] = useState<number>(100);
  const [reels, setReels] = useState(() => 
    Array.from({ length: 5 }, () => Array(3).fill(null).map(() => getRandomSymbol()))
  );
  const [spinning, setSpinning] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [winningLines, setWinningLines] = useState<Position[][]>([]);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [remainingAutoSpins, setRemainingAutoSpins] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(false);
  const [pendingSpin, setPendingSpin] = useState<boolean>(false);

  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef<boolean>(false);
  const spinQueue = useRef<number>(0);

  const adjustedAnimationDuration = ANIMATION_DURATION / speedMultiplier;
  const adjustedSpinDuration = adjustedAnimationDuration * 1.1;
  const isWinning = winAmount > 0 && !spinning;

  useEffect(() => {
    if (session) {
      getBalance();
    }
  }, [session, getBalance]);

  useEffect(() => {
    const initAudio = () => {
      const bgAudio = new Audio(SOUND_PATHS.background);
      bgAudio.loop = true;
      bgAudio.volume = (isMuted ? 0 : volume) * 0.5;
      backgroundAudioRef.current = bgAudio;

      Object.entries(SOUND_PATHS).forEach(([key, path]) => {
        if (key === 'background') return;
        
        if (typeof path === 'object') {
          Object.entries(path).forEach(([symbolKey, symbolPath]) => {
            const audio = new Audio(symbolPath);
            audio.preload = 'auto';
            audio.volume = isMuted ? 0 : volume;
            audioRefs.current[`symbol_${symbolKey}`] = audio;
          });
        } else {
          const audio = new Audio(path);
          audio.preload = 'auto';
          audio.volume = isMuted ? 0 : volume;
          audioRefs.current[key] = audio;
        }
      });
    };

    if (Object.keys(audioRefs.current).length === 0) {
      initAudio();
    }

    const handleFirstInteraction = () => {
      hasInteracted.current = true;
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
      
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      });
      audioRefs.current = {};
    };
  }, [isMuted]);

  useEffect(() => {
    const updateAudioVolumes = () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.volume = (isMuted ? 0 : volume) * 0.5;
        
        if (!isMuted && hasInteracted.current && backgroundAudioRef.current.paused) {
          backgroundAudioRef.current.play().catch(e => console.log("Play failed:", e));
        } else if (isMuted) {
          backgroundAudioRef.current.pause();
        }
      }
      
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.volume = isMuted ? 0 : volume;
        }
      });
    };

    updateAudioVolumes();
  }, [isMuted, volume]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('slotMachineVolume');
      if (savedVolume) {
        setVolume(parseFloat(savedVolume));
      }

      const savedMuted = localStorage.getItem("slotMachineMuted");
      setIsMuted(savedMuted === 'true');
      
      const savedSpeed = localStorage.getItem('slotMachineSpeed');
      if (savedSpeed) {
        setSpeedMultiplier(Number(savedSpeed));
      }
    }
  }, []);

  const playSound = (soundKey: string, playbackRate: number = 1) => {
    if (isMuted || !hasInteracted.current) return;
    
    const audio = audioRefs.current[soundKey];
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.playbackRate = playbackRate;
        audio.volume = volume;
        audio.play().catch(e => console.log("Audio play error:", e));
      } catch (error) {
        console.error("Sound error:", error);
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("slotMachineMuted", newMutedState.toString());
    
    if (!newMutedState && volume === 0) {
      const previousVolume = localStorage.getItem('previousVolume');
      const newVolume = previousVolume ? parseFloat(previousVolume) : 0.5;
      setVolume(newVolume);
    } else if (newMutedState && volume > 0) {
      localStorage.setItem('previousVolume', volume.toString());
    }
  };

  const handleSpeedButtonClick = () => {
    const newMultiplier = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 3 : 1;
    setSpeedMultiplier(newMultiplier);
    playSound('buttonClick');
    playSound('spin', newMultiplier);
    localStorage.setItem('slotMachineSpeed', newMultiplier.toString());
  };

  const checkWin = useCallback((
    reels: typeof SYMBOLS[0]['symbol'][][],
    bet: number,
    isMuted: boolean
  ): { 
    payout: number; 
    winningLines: Position[][] 
  } => {
    let payout = 0;
    const winningLines: Position[][] = [];
    const playedSymbols = new Set<string>();

    SYMBOLS.forEach(({ symbol, basePayout, sound }) => {
      const value = (basePayout / 5) * bet;

      for (let row = 0; row < 3; row++) {
        let col = 0;

        while (col < 5) {
          if (reels[col][row] === symbol) {
            const positions: Position[] = [{ col, row }];
            let matchLength = 1;

            for (let offset = 1; col + offset < 5; offset++) {
              if (reels[col + offset][row] === symbol) {
                matchLength++;
                positions.push({ col: col + offset, row });
              } else {
                break;
              }
            }

            if (matchLength >= 3) {
              if (!isMuted && !playedSymbols.has(sound)) {
                playSound(`symbol_${sound}`);
                playedSymbols.add(sound);
              }

              let linePayout = 0;
              if (matchLength === 3) linePayout = value;
              else if (matchLength === 4) linePayout = value * 1.5;
              else if (matchLength >= 5) linePayout = value * 2;

              payout += linePayout;
              winningLines.push(positions.slice(0, matchLength));

              col += matchLength;
            } else {
              col++;
            }
          } else {
            col++;
          }
        }
      }
    });

    return { payout, winningLines };
  }, []);

  const processSpinTransaction = async (betAmount: number, payoutAmount: number) => {
    try {
      const response = await fetch('/api/slots/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betAmount,
          winAmount: payoutAmount
        }),
      });

      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };

const spinReels = useCallback(async () => {
  if (balance < bet || spinning || pendingSpin || bet < MIN_BET || bet > MAX_BET) {
    if (autoSpin) {
      setAutoSpin(false);
      setRemainingAutoSpins(0);
    }
    return;
  }

  setSpinning(true);
  setPendingSpin(true);
  setWinAmount(0);
  setWinningLines([]);

  try {
    playSound('buttonClick');
    playSound('spin', speedMultiplier);

    const finalReels = Array(5).fill(null).map(() => Array(3).fill(null));

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        let newSymbol;
    
        if (
          col >= 2 &&
          finalReels[col - 1][row] === finalReels[col - 2][row] &&
          Math.random() > 0.75
        ) {
          const bannedSymbol = finalReels[col - 1][row];
          const filteredSymbols = SYMBOLS.filter(s => s.symbol !== bannedSymbol);
          newSymbol = filteredSymbols[Math.floor(Math.random() * filteredSymbols.length)].symbol;
        } else {
          newSymbol = getRandomSymbol();
        }
    
        finalReels[col][row] = newSymbol;
      }
    }
    
    setReels(finalReels);
    animateReels();

    setTimeout(async () => {
      const { payout, winningLines } = checkWin(finalReels, bet, isMuted);
      setWinAmount(payout);
      setWinningLines(winningLines);

      try {
        await processSpin(bet, payout);
        
        if (payout > 0) {
          playSound('win');
        }

        setSpinning(false);
        setPendingSpin(false);

        if (autoSpin && remainingAutoSpins > 0) {
          setRemainingAutoSpins(prev => prev - 1);
          if (remainingAutoSpins <= 1) setAutoSpin(false);
        }
      } catch (error) {
        console.error("Transaction failed:", error);
        setSpinning(false);
        setPendingSpin(false);
        await getBalance();
        if (autoSpin) {
          setAutoSpin(false);
          setRemainingAutoSpins(0);
        }
      }
    }, adjustedAnimationDuration);
  } catch (error) {
    console.error("Spin error:", error);
    setSpinning(false);
    setPendingSpin(false);
    if (autoSpin) {
      setAutoSpin(false);
      setRemainingAutoSpins(0);
    }
  }
}, [balance, bet, spinning, pendingSpin, speedMultiplier, autoSpin, remainingAutoSpins, adjustedAnimationDuration, checkWin, processSpin, getBalance]); 

  useEffect(() => {
    if (autoSpin && remainingAutoSpins > 0 && !spinning && !pendingSpin) {
      const interval = setInterval(() => {
        if (!spinning && !pendingSpin && remainingAutoSpins > 0 && balance >= bet) {
          spinReels();
        } else {
          setAutoSpin(false);
          setRemainingAutoSpins(0);
        }
      }, adjustedSpinDuration);
      
      return () => clearInterval(interval);
    }
  }, [autoSpin, spinning, pendingSpin, remainingAutoSpins, adjustedSpinDuration, balance, bet, spinReels]);

  const animateReels = () => {
    const isMobile = window.innerWidth < 1280;
    const isXS = window.innerWidth < 640;
    const symbolHeight = isXS ? 52 : isMobile ? 70 : 142;
    const totalSpinDistance = isXS ? (symbolHeight * 15) + 15 : 
                            isMobile ? (symbolHeight * 15) + 15 : 
                            (symbolHeight * 15) + 17;

    reelRefs.current.forEach((reel, i) => {
      if (!reel) return;

      reel.style.transition = 'none';
      reel.style.transform = 'translateY(0)';
      void reel.offsetHeight;

      reel.style.transition = `transform ${adjustedAnimationDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      reel.style.transform = `translateY(${-totalSpinDistance}px)`;
    });
  };

  const isWinningPosition = (colIndex: number, rowIndex: number): boolean => {
    return winningLines.some(line =>
      line.some(pos => pos.col === colIndex && pos.row === rowIndex)
    );
  };

  const renderSymbol = (symbol: typeof SYMBOLS[0]['symbol'], colIndex: number, rowIndex: number) => {
    const isWinning = isWinningPosition(colIndex, rowIndex);
    
    return (
      <div 
        className={`flex justify-center items-center w-full sm:h-[70px] xl:h-[142px] h-[52px] transition-all duration-300 ${
          isWinning ? "bg-red-800 bg-opacity-30 border-2 xl:border-4 border-red-800 rounded-lg" : ""
        }`}
      >
        <Image 
          src={symbol} 
          alt="symbol" 
          width={110} 
          height={110}
          className="w-auto h-[80%] object-contain"
        />
      </div>
    );
  };

  const renderReel = (col: typeof SYMBOLS[0]['symbol'][], colIndex: number) => (
    <div 
      key={colIndex} 
      className="flex flex-col items-center h-full w-full xl:w-[155px] overflow-hidden relative mx-[4px] z-10"
    >
      <div 
        ref={el => { reelRefs.current[colIndex] = el; }}
        className="flex flex-col absolute xl:top-0 gap-[1px] w-full"
      >
        {[...Array(15)].map((_, i) => {
          const rowIndex = i % 3;
          const symbol = col[rowIndex];
          return renderSymbol(symbol, colIndex, rowIndex);
        })}
        
        {col.map((symbol, rowIndex) => renderSymbol(symbol, colIndex, rowIndex))}
      </div>
    </div>
  );

  const renderAutoSpinButton = () => (
    <Dialog>
      <DialogTrigger>
        <div className="relative flex border-2 border-white rounded-full py-2 px-6 hover:bg-gray-700 transition duration-300 hover:scale-105 text-4xl">
          Auto
        </div>
      </DialogTrigger>
      <DialogContent className="text-white max-w-[350px] flex flex-col items-center py-10 bg-black">
        <DialogTitle className="text-4xl text-white">
          How many spins?
        </DialogTitle>
        <DialogFooter className="mt-2 flex justify-center gap-4">
          <div className="grid grid-cols-2 gap-y-3 gap-x-5">
            {AUTO_SPIN_OPTIONS.map(count => (
              <Button
                key={count}
                onClick={() => {
                  playSound('buttonClick');
                  setRemainingAutoSpins(count);
                  setAutoSpin(true);
                }}
                className="flex border-2 border-white rounded-full py-1 px-4 h-full hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
              >
                {count}
              </Button>
            ))}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderStopAutoSpinButton = () => (
    <button
      onClick={() => {
        playSound('buttonClick');
        setAutoSpin(false);
      }}
      className="relative w-[110px] py-2.5 px-5 text-2xl bg-red-600 text-white border-none rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-red-700 hover:shadow-md"
    >
      Stop
      <span className="absolute -top-2 -right-2 bg-green-400 text-black text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
        {remainingAutoSpins}
      </span>
    </button>
  );

  return (
    <div className="bg-black overflow-hidden min-h-screen min-w-screen relative">
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src={slotBg} 
          alt="Slot Background" 
          fill
          className="object-cover"
          quality={100}
          priority
        />
      </div>

      <div className="fixed top-4 left-2 xl:ml-8 xl:pt-3 z-10">
        <button 
          onClick={() => router.back()}
          className="text-white hover:text-purple-300 transition-colors"
        >
          <ChevronLeftCircle size={36} />
        </button>
      </div>

      <PayoutsSheet />

      <div className="flex flex-col items-center gap-2 fixed top-4 md:top-28 md:left-2 left-28 -ml-2 md:ml-0 xl:ml-8 xl:pt-3 z-10">
        <button 
          onClick={toggleMute}
          className="text-white hover:text-purple-300 transition-colors"
        >
          {isMuted ? <VolumeOff size={36} /> : <Volume2 size={36} />}
        </button>
      </div>

      <p className="fixed text-white z-3 top-4 right-2 z-50 xl:pr-8 xl:pt-3 pt-1 text-xl">
        {isWinning && (
          <span className="text-lime-500 ml-2">
            (+{formatter.format(winAmount)})
          </span>
        )}
        <span> </span>
        <span className="text-purple-200">
          {formatter.format(balance)}
        </span>
      </p>
      
      <div className="flex flex-col items-center xl:justify-center gap-8 text-center min-h-[calc(100vh-100px)] relative z-2">
        <div className="absolute xl:mt-[0px] sm:mt-[0px] mt-[120px] xl:left-[100px] md:left-[50px] z-3">
          <div className="relative flex justify-center items-center w-[95vw] h-[174px] sm:h-[230px] xl:w-[1000px] max-w-[370px] sm:max-w-[500px] xl:max-w-[1000px] xl:h-[442px] overflow-hidden p-2 rounded-xl xl:px-20 sm:px-12 px-9">
            {reels.map((col, colIndex) => renderReel(col, colIndex))}
          </div>
          
          <div className="absolute inset-0 w-full h-full z-1 xl:top-[110px] sm:top-[63px] top-[52px] -translate-y-1/2 sm:max-w-[500px] xl:max-w-[1000px]">
            <Image 
              width={1000}
              src={frameOverlay} 
              alt="Frame Overlay" 
              className="object-cover"
            /> 
          </div>
        </div>

        <button
          onClick={spinReels}
          disabled={spinning || autoSpin || pendingSpin} 
          className={`absolute bottom-0 mb-[40px] xl:mb-0 md:inset-y-auto flex items-center justify-center xl:w-[220px] w-[150px] xl:h-56 border-2 border-white rounded-full transition-all duration-300 xl:right-[150px] md:right-[50px] xl:mt-0 md:mt-[150px] cursor-pointer z-20 ${
            spinning ? "animate-pulse" : ""
          }`}
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.7)",
            transform: spinning ? `rotate(360deg)` : "rotate(0deg)",
            transition: spinning ? `transform ${adjustedAnimationDuration}ms ease-out` : "transform 0.3s ease"
          }}
        >
          <Image src={spinIcon} alt="Spin" width={200} height={128} />
        </button>

        <div className="md:hidden fixed bottom-[90px] left-3 z-20">
          <button
            onClick={() => {
              playSound('buttonClick');
              setShowMobileControls(!showMobileControls);
            }}
            className={`bg-black bg-opacity-30 border-2 border-white rounded-full p-2 transition-all duration-300 rotate-0 ${
              showMobileControls ? 'mb-20 rotate-180' : ''
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col fixed w-full bottom-0 left-0 border-t-2 border-white md:py-4 px-8 bg-black bg-opacity-30 backdrop-blur-sm z-20 pb-4 xl:pb-4">
          <div className="flex flex-col xl:flex-row justify-between relative items-center xl:gap-8 gap-3">
            <div className={`md:hidden w-full flex flex-col gap-4 overflow-hidden transition-all duration-500 ${
              showMobileControls ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="flex justify-center gap-4 pt-4">
                <button
                  className="flex border-2 border-white rounded-full py-1 px-2 hover:bg-gray-700 transition duration-300 hover:scale-105"
                  onClick={handleSpeedButtonClick}
                >
                  <GoTriangleRight size={50} color={speedMultiplier >= 1 ? "white" : "gray"} />
                  <GoTriangleRight 
                    className="ml-[-25px] mr-[-25px]" 
                    size={50} 
                    color={speedMultiplier >= 2 ? "white" : "gray"} 
                  />
                  <GoTriangleRight size={50} color={speedMultiplier >= 3 ? "white" : "gray"} />
                </button>
                
                <div className="flex">
                  {autoSpin && remainingAutoSpins > 0 ? renderStopAutoSpinButton() : renderAutoSpinButton()}
                </div>
              </div>
            </div>

            <div className="xl:flex gap-3 hidden">
              {PRESET_BETS.map((amount) => (
                <Button 
                  key={amount} 
                  onClick={() => {
                    playSound('buttonClick');
                    setBet(amount);
                  }} 
                  disabled={spinning || autoSpin || pendingSpin} 
                  className="text-3xl py-2.5 px-6 hover:scale-105 transition-transform h-full"
                >
                  {amount}
                </Button>
              ))}
            </div>

            <div className="w-full">
              <Input
                className="bg-white text-black text-3xl px-4 py-2 text-center hover:scale-105 transition-transform h-full"
                type="number"
                value={bet}
                min={MIN_BET}
                max={MAX_BET}
                onChange={(e) => setBet(Math.min(MAX_BET, Math.max(MIN_BET, Number(e.target.value))))}
                disabled={spinning || autoSpin || pendingSpin}
              />
            </div>

            <div className="md:flex gap-4 hidden">
              <button
                className="flex border-2 border-white rounded-full py-1 px-2 hover:bg-gray-700 transition duration-300 hover:scale-105"
                onClick={handleSpeedButtonClick}
              >
                <GoTriangleRight size={50} color={speedMultiplier >= 1 ? "white" : "gray"} />
                <GoTriangleRight 
                  className="ml-[-25px] mr-[-25px]" 
                  size={50} 
                  color={speedMultiplier >= 2 ? "white" : "gray"} 
                />
                <GoTriangleRight size={50} color={speedMultiplier >= 3 ? "white" : "gray"} />
              </button>
              <div className="flex">
                {autoSpin && remainingAutoSpins > 0 ? renderStopAutoSpinButton() : renderAutoSpinButton()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;