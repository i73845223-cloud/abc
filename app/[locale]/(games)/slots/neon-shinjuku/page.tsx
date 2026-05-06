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

/* ─────────────────────────────────────────────
   Inject keyframe animations once into <head>
───────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @keyframes sm-reel-blur-in {
    0%   { filter: blur(8px) brightness(1.8); opacity:0.6; }
    60%  { filter: blur(3px) brightness(1.3); opacity:0.85; }
    100% { filter: blur(0px) brightness(1);   opacity:1; }
  }
  @keyframes sm-symbol-land {
    0%   { transform: scaleY(1.25) scaleX(0.85); }
    55%  { transform: scaleY(0.88) scaleX(1.06); }
    75%  { transform: scaleY(1.05) scaleX(0.98); }
    100% { transform: scaleY(1)    scaleX(1); }
  }
  @keyframes sm-win-pulse {
    0%,100% { transform: scale(1);    box-shadow: 0 0 0px 0 rgba(255,215,0,0); }
    50%      { transform: scale(1.06); box-shadow: 0 0 28px 6px rgba(255,215,0,0.55); }
  }
  @keyframes sm-win-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes sm-win-icon-bounce {
    0%,100% { transform: scale(1) rotate(-3deg); }
    30%      { transform: scale(1.18) rotate(4deg); }
    60%      { transform: scale(0.94) rotate(-2deg); }
  }
  @keyframes sm-coin-fly {
    0%   { transform: translateY(0)   translateX(0)    scale(1)    rotate(0deg);   opacity:1; }
    80%  { opacity: 1; }
    100% { transform: translateY(-220px) translateX(var(--coin-x)) scale(0.4) rotate(720deg); opacity:0; }
  }
  @keyframes sm-confetti-fall {
    0%   { transform: translateY(-20px) rotate(0deg) scale(1); opacity:1; }
    100% { transform: translateY(180px) rotate(var(--rot)) scale(0.6); opacity:0; }
  }
  @keyframes sm-flash-bg {
    0%,100% { background: transparent; }
    30%      { background: rgba(255,215,0,0.08); }
    60%      { background: rgba(255,255,255,0.04); }
  }
  @keyframes sm-spin-btn-glow {
    0%,100% { box-shadow: 0 0 18px rgba(255,255,255,0.6); }
    50%      { box-shadow: 0 0 42px rgba(180,120,255,0.85), 0 0 80px rgba(255,215,0,0.25); }
  }
  @keyframes sm-spin-btn-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes sm-win-banner-in {
    0%   { transform: scaleX(0) translateY(-50%); opacity:0; }
    60%  { transform: scaleX(1.06) translateY(-50%); opacity:1; }
    100% { transform: scaleX(1) translateY(-50%); opacity:1; }
  }
  @keyframes sm-win-banner-text {
    0%   { letter-spacing: -0.05em; opacity:0; }
    60%  { letter-spacing: 0.18em; opacity:1; }
    100% { letter-spacing: 0.12em; opacity:1; }
  }
  @keyframes sm-win-amount-pop {
    0%   { transform: scale(0.4) rotate(-8deg); opacity:0; }
    65%  { transform: scale(1.15) rotate(2deg); opacity:1; }
    100% { transform: scale(1) rotate(0deg); opacity:1; }
  }
  @keyframes sm-bg-ripple {
    0%   { transform: scale(0.8); opacity:0.7; }
    100% { transform: scale(2.4); opacity:0; }
  }
  @keyframes sm-reel-border-spin {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes sm-balance-bump {
    0%,100% { transform: scale(1); }
    40%      { transform: scale(1.18); }
    70%      { transform: scale(0.94); }
  }
  @keyframes sm-neon-flicker {
    0%,19%,21%,23%,25%,54%,56%,100% { opacity:1; text-shadow: 0 0 8px #fff, 0 0 20px #ffe066, 0 0 40px #ffd700; }
    20%,22%,24%,55% { opacity:0.4; text-shadow: none; }
  }
  .sm-winning-cell {
    animation: sm-win-pulse 0.7s ease-in-out infinite, sm-reel-blur-in 0.3s ease forwards;
  }
  .sm-winning-icon {
    animation: sm-win-icon-bounce 0.55s ease-in-out infinite;
  }
  .sm-cell-land {
    animation: sm-symbol-land 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  .sm-balance-bump {
    animation: sm-balance-bump 0.5s ease-out;
  }
  .sm-neon {
    animation: sm-neon-flicker 4s infinite;
  }
`;

type Position = { col: number; row: number };

/* ── Coin particle ── */
const CoinParticle = ({ x, onDone }: { x: number; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      style={{
        position: "absolute",
        bottom: "50%",
        left: "50%",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #ffe066, #c8960c)",
        boxShadow: "0 0 8px rgba(255,215,0,0.7)",
        pointerEvents: "none",
        zIndex: 100,
        "--coin-x": `${x}px`,
        animation: "sm-coin-fly 0.9s cubic-bezier(0.2,0.8,0.4,1) forwards",
      } as React.CSSProperties}
    />
  );
};

/* ── Confetti piece ── */
const ConfettiPiece = ({ x, color, rot, onDone }: { x: number; color: string; rot: string; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      style={{
        position: "absolute",
        top: "10%",
        left: `${x}%`,
        width: 10,
        height: 10,
        borderRadius: 2,
        background: color,
        pointerEvents: "none",
        zIndex: 100,
        "--rot": rot,
        animation: "sm-confetti-fall 1.1s ease-in forwards",
      } as React.CSSProperties}
    />
  );
};

/* ── Ripple burst on win ── */
const RippleBurst = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
      pointerEvents: "none", zIndex: 5,
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: "60%", height: "60%",
          borderRadius: "50%",
          border: "2px solid rgba(255,215,0,0.6)",
          animation: `sm-bg-ripple 0.9s ${i * 0.18}s ease-out forwards`,
        }} />
      ))}
    </div>
  );
};

/* ── Win Amount Banner overlay ── */
const WinBanner = ({ amount, onDone }: { amount: number; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: 0, right: 0,
      transform: "translateY(-50%)",
      pointerEvents: "none",
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
    }}>
      <div style={{
        background: "linear-gradient(90deg, transparent, rgba(10,5,0,0.88), transparent)",
        padding: "12px 32px",
        borderTop: "2px solid rgba(255,215,0,0.6)",
        borderBottom: "2px solid rgba(255,215,0,0.6)",
        width: "100%",
        animation: "sm-win-banner-in 0.5s cubic-bezier(0.34,1.3,0.64,1) forwards",
        transformOrigin: "center",
      }}>
        <div style={{
          color: "#ffe066",
          fontFamily: "'Bebas Neue', 'Anton', 'Impact', sans-serif",
          fontSize: "clamp(1.4rem, 5vw, 2.8rem)",
          letterSpacing: "0.12em",
          textShadow: "0 0 12px #ffd700, 0 0 30px rgba(255,180,0,0.5)",
          animation: "sm-win-banner-text 0.6s 0.1s ease-out both",
          textAlign: "center",
        }}>
          ✦ WIN ✦
        </div>
      </div>
      <div style={{
        color: "#fff",
        fontFamily: "'Bebas Neue', 'Anton', 'Impact', sans-serif",
        fontSize: "clamp(2rem, 8vw, 4.5rem)",
        textShadow: "0 0 16px rgba(255,215,0,0.9), 0 2px 0 rgba(0,0,0,0.8)",
        animation: "sm-win-amount-pop 0.55s 0.2s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        +{formatter.format(amount)}
      </div>
    </div>
  );
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

  /* ── New animation state ── */
  const [landingCols, setLandingCols] = useState<Set<number>>(new Set());
  const [showWinBanner, setShowWinBanner] = useState(false);
  const [coins, setCoins] = useState<{ id: number; x: number }[]>([]);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; rot: string }[]>([]);
  const [showRipple, setShowRipple] = useState(false);
  const [balanceBump, setBalanceBump] = useState(false);
  const coinIdRef = useRef(0);

  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef<boolean>(false);
  const spinQueue = useRef<number>(0);

  const adjustedAnimationDuration = ANIMATION_DURATION / speedMultiplier;
  const adjustedSpinDuration = adjustedAnimationDuration * 1.1;
  const isWinning = winAmount > 0 && !spinning;

  /* Inject global styles */
  useEffect(() => {
    const id = "sm-global-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = GLOBAL_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (session) getBalance();
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
    if (Object.keys(audioRefs.current).length === 0) initAudio();
    const h = () => {
      hasInteracted.current = true;
      document.removeEventListener('click', h);
      document.removeEventListener('keydown', h);
      document.removeEventListener('touchstart', h);
    };
    document.addEventListener('click', h);
    document.addEventListener('keydown', h);
    document.addEventListener('touchstart', h);
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
      Object.values(audioRefs.current).forEach(a => { a.pause(); a.removeAttribute('src'); a.load(); });
      audioRefs.current = {};
    };
  }, [isMuted]);

  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = (isMuted ? 0 : volume) * 0.5;
      if (!isMuted && hasInteracted.current && backgroundAudioRef.current.paused) {
        backgroundAudioRef.current.play().catch(() => {});
      } else if (isMuted) {
        backgroundAudioRef.current.pause();
      }
    }
    Object.values(audioRefs.current).forEach(a => { if (a) a.volume = isMuted ? 0 : volume; });
  }, [isMuted, volume]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sv = localStorage.getItem('slotMachineVolume');
      if (sv) setVolume(parseFloat(sv));
      const sm = localStorage.getItem("slotMachineMuted");
      setIsMuted(sm === 'true');
      const ss = localStorage.getItem('slotMachineSpeed');
      if (ss) setSpeedMultiplier(Number(ss));
    }
  }, []);

  const playSound = (soundKey: string, playbackRate = 1) => {
    if (isMuted || !hasInteracted.current) return;
    const audio = audioRefs.current[soundKey];
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.playbackRate = playbackRate;
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch {}
    }
  };

  const toggleMute = () => {
    const n = !isMuted;
    setIsMuted(n);
    localStorage.setItem("slotMachineMuted", n.toString());
    if (!n && volume === 0) {
      const pv = localStorage.getItem('previousVolume');
      setVolume(pv ? parseFloat(pv) : 0.5);
    } else if (n && volume > 0) {
      localStorage.setItem('previousVolume', volume.toString());
    }
  };

  const handleSpeedButtonClick = () => {
    const n = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 3 : 1;
    setSpeedMultiplier(n);
    playSound('buttonClick');
    playSound('spin', n);
    localStorage.setItem('slotMachineSpeed', n.toString());
  };

  /* ── Trigger win celebration ── */
  const triggerWinCelebration = useCallback((payout: number) => {
    setShowWinBanner(true);
    setShowRipple(true);

    const isBig = payout > 1000;
    const count = isBig ? 16 : 8;
    const colors = ["#ffd700","#ff4f9a","#00e5ff","#aaff00","#ff6b00","#ffffff"];

    setCoins(Array.from({ length: count }, (_, i) => ({
      id: coinIdRef.current++,
      x: (Math.random() - 0.5) * 200,
    })));

    if (isBig) {
      setConfetti(Array.from({ length: 30 }, (_, i) => ({
        id: coinIdRef.current++,
        x: Math.random() * 100,
        color: colors[i % colors.length],
        rot: `${(Math.random() - 0.5) * 720}deg`,
      })));
    }

    /* Balance bump after brief delay */
    setTimeout(() => {
      setBalanceBump(true);
      setTimeout(() => setBalanceBump(false), 600);
    }, 500);
  }, []);

  const checkWin = useCallback((
    reels: typeof SYMBOLS[0]['symbol'][][],
    bet: number,
    isMuted: boolean
  ): { payout: number; winningLines: Position[][] } => {
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
              } else break;
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
            } else col++;
          } else col++;
        }
      }
    });
    return { payout, winningLines };
  }, []);

  /* ── Animate reels with staggered landing ── */
  const animateReels = (onColLand?: (col: number) => void) => {
    const isMobile = window.innerWidth < 1280;
    const isXS = window.innerWidth < 640;
    const symbolHeight = isXS ? 52 : isMobile ? 70 : 142;
    const totalSpinDistance = isXS ? (symbolHeight * 15) + 15
      : isMobile ? (symbolHeight * 15) + 15
      : (symbolHeight * 15) + 17;

    reelRefs.current.forEach((reel, i) => {
      if (!reel) return;

      /* Slight stagger: each reel starts a bit later */
      const staggerDelay = i * (adjustedAnimationDuration * 0.06);
      const duration = adjustedAnimationDuration + staggerDelay;

      reel.style.transition = 'none';
      reel.style.transform = 'translateY(0)';
      reel.style.filter = 'blur(0px)';
      void reel.offsetHeight;

      /* Speed-blur while spinning */
      reel.style.filter = `blur(${3 / speedMultiplier}px) brightness(1.15)`;
      reel.style.transition = `transform ${duration}ms cubic-bezier(0.22, 0.1, 0.28, 1), filter ${duration * 0.6}ms ease`;
      reel.style.transform = `translateY(${-totalSpinDistance}px)`;

      /* Clear blur on land, trigger land animation */
      setTimeout(() => {
        if (!reel) return;
        reel.style.filter = 'blur(0px) brightness(1)';
        onColLand?.(i);
      }, duration - 80);
    });
  };

  const spinReels = useCallback(async () => {
    if (balance < bet || spinning || pendingSpin || bet < MIN_BET || bet > MAX_BET) {
      if (autoSpin) { setAutoSpin(false); setRemainingAutoSpins(0); }
      return;
    }

    setSpinning(true);
    setPendingSpin(true);
    setWinAmount(0);
    setWinningLines([]);
    setShowWinBanner(false);
    setCoins([]);
    setConfetti([]);
    setShowRipple(false);
    setLandingCols(new Set());

    try {
      playSound('buttonClick');
      playSound('spin', speedMultiplier);

      const finalReels = Array(5).fill(null).map(() => Array(3).fill(null));
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          let newSymbol;
          if (col >= 2 && finalReels[col-1][row] === finalReels[col-2][row] && Math.random() > 0.75) {
            const banned = finalReels[col-1][row];
            const filtered = SYMBOLS.filter(s => s.symbol !== banned);
            newSymbol = filtered[Math.floor(Math.random() * filtered.length)].symbol;
          } else {
            newSymbol = getRandomSymbol();
          }
          finalReels[col][row] = newSymbol;
        }
      }

      setReels(finalReels);

      animateReels((col) => {
        /* Each column triggers its own land flash */
        setLandingCols(prev => new Set([...prev, col]));
        setTimeout(() => {
          setLandingCols(prev => {
            const next = new Set(prev);
            next.delete(col);
            return next;
          });
        }, 350);
      });

      setTimeout(async () => {
        const { payout, winningLines } = checkWin(finalReels, bet, isMuted);
        setWinAmount(payout);
        setWinningLines(winningLines);

        try {
          await processSpin(bet, payout);
          if (payout > 0) {
            playSound('win');
            triggerWinCelebration(payout);
          }
          setSpinning(false);
          setPendingSpin(false);
          if (autoSpin && remainingAutoSpins > 0) {
            setRemainingAutoSpins(prev => prev - 1);
            if (remainingAutoSpins <= 1) setAutoSpin(false);
          }
        } catch {
          setSpinning(false);
          setPendingSpin(false);
          await getBalance();
          if (autoSpin) { setAutoSpin(false); setRemainingAutoSpins(0); }
        }
      }, adjustedAnimationDuration + /* max stagger */ (5 * adjustedAnimationDuration * 0.06) + 60);
    } catch {
      setSpinning(false);
      setPendingSpin(false);
      if (autoSpin) { setAutoSpin(false); setRemainingAutoSpins(0); }
    }
  }, [balance, bet, spinning, pendingSpin, speedMultiplier, autoSpin, remainingAutoSpins,
      adjustedAnimationDuration, checkWin, processSpin, getBalance, triggerWinCelebration]);

  useEffect(() => {
    if (autoSpin && remainingAutoSpins > 0 && !spinning && !pendingSpin) {
      const interval = setInterval(() => {
        if (!spinning && !pendingSpin && remainingAutoSpins > 0 && balance >= bet) spinReels();
        else { setAutoSpin(false); setRemainingAutoSpins(0); }
      }, adjustedSpinDuration);
      return () => clearInterval(interval);
    }
  }, [autoSpin, spinning, pendingSpin, remainingAutoSpins, adjustedSpinDuration, balance, bet, spinReels]);

  const isWinningPosition = (col: number, row: number) =>
    winningLines.some(line => line.some(p => p.col === col && p.row === row));

  const renderSymbol = (symbol: typeof SYMBOLS[0]['symbol'], colIndex: number, rowIndex: number) => {
    const winning = isWinningPosition(colIndex, rowIndex);
    const landing = landingCols.has(colIndex);

    return (
      <div
        key={rowIndex}
        className={`flex justify-center items-center w-full sm:h-[70px] xl:h-[142px] h-[52px] relative transition-all duration-200 ${
          landing ? "sm-cell-land" : ""
        }`}
        style={{
          borderRadius: winning ? 10 : 6,
          background: winning
            ? "radial-gradient(ellipse at center, rgba(255,215,0,0.18) 0%, rgba(255,100,0,0.08) 60%, transparent 100%)"
            : landing
            ? "radial-gradient(ellipse at center, rgba(180,120,255,0.15) 0%, transparent 70%)"
            : "transparent",
          outline: winning ? "2px solid rgba(255,215,0,0.7)" : landing ? "1px solid rgba(180,120,255,0.4)" : "none",
          boxShadow: winning
            ? "0 0 18px 4px rgba(255,200,0,0.35), inset 0 0 12px rgba(255,200,0,0.12)"
            : "none",
        }}
      >
        {/* Shimmer strip on winning cell */}
        {winning && (
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10,
            background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
            backgroundSize: "200% auto",
            animation: "sm-win-shimmer 1.4s linear infinite",
            pointerEvents: "none",
          }} />
        )}
        <Image
          src={symbol}
          alt="symbol"
          width={110}
          height={110}
          className={`w-auto h-[80%] object-contain ${winning ? "sm-winning-icon" : ""}`}
          style={{
            filter: winning
              ? "drop-shadow(0 0 10px rgba(255,215,0,0.8)) drop-shadow(0 0 22px rgba(255,150,0,0.5))"
              : "none",
            transition: "filter 0.3s ease",
          }}
        />
      </div>
    );
  };

  const renderReel = (col: typeof SYMBOLS[0]['symbol'][], colIndex: number) => {
    const hasWin = winningLines.some(line => line.some(p => p.col === colIndex));
    return (
      <div
        key={colIndex}
        className="flex flex-col items-center h-full w-full xl:w-[155px] overflow-hidden relative mx-[4px] z-10"
        style={{
          borderRadius: 8,
          boxShadow: hasWin
            ? "0 0 0 2px rgba(255,215,0,0.5), 0 0 24px 4px rgba(255,180,0,0.25)"
            : "none",
          transition: "box-shadow 0.4s ease",
        }}
      >
        {/* Top and bottom fade masks */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "18%",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
          zIndex: 3, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
          background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
          zIndex: 3, pointerEvents: "none",
        }} />

        <div
          ref={el => { reelRefs.current[colIndex] = el; }}
          className="flex flex-col absolute xl:top-0 gap-[1px] w-full"
          style={{ willChange: "transform" }}
        >
          {[...Array(15)].map((_, i) => {
            const rowIndex = i % 3;
            return renderSymbol(col[rowIndex], colIndex, rowIndex);
          })}
          {col.map((symbol, rowIndex) => renderSymbol(symbol, colIndex, rowIndex))}
        </div>
      </div>
    );
  };

  /* ── Spin button with animated glow and rotation ── */
  const renderSpinButton = () => (
    <button
      onClick={spinReels}
      disabled={spinning || autoSpin || pendingSpin}
      className={`absolute bottom-0 mb-[40px] xl:mb-0 md:inset-y-auto flex items-center justify-center xl:w-[220px] w-[150px] xl:h-56 border-2 border-white rounded-full cursor-pointer z-20`}
      style={{
        right: undefined,
        boxShadow: spinning
          ? "0 0 42px rgba(180,120,255,0.85), 0 0 80px rgba(255,215,0,0.25)"
          : "0 0 20px rgba(255,255,255,0.6)",
        animation: spinning
          ? `sm-spin-btn-glow 0.8s ease-in-out infinite`
          : isWinning
          ? "sm-spin-btn-glow 2s ease-in-out infinite"
          : "none",
        transition: "box-shadow 0.4s ease",
        /* Subtle breathe when idle */
        transform: spinning ? "scale(0.96)" : "scale(1)",
      }}
      /* Class added for the right positioning (keep original layout) */
      /* We use inline style to avoid Tailwind conflicts */
    >
      <Image
        src={spinIcon}
        alt="Spin"
        width={200}
        height={128}
        style={{
          animation: spinning
            ? `sm-spin-btn-spin ${adjustedAnimationDuration}ms linear`
            : "none",
        }}
      />
    </button>
  );

  const renderAutoSpinButton = () => (
    <Dialog>
      <DialogTrigger>
        <div className="relative flex border-2 border-white rounded-full py-2 px-6 hover:bg-gray-700 transition duration-300 hover:scale-105 text-4xl">
          Auto
        </div>
      </DialogTrigger>
      <DialogContent className="text-white max-w-[350px] flex flex-col items-center py-10 bg-black">
        <DialogTitle className="text-4xl text-white">How many spins?</DialogTitle>
        <DialogFooter className="mt-2 flex justify-center gap-4">
          <div className="grid grid-cols-2 gap-y-3 gap-x-5">
            {AUTO_SPIN_OPTIONS.map(count => (
              <Button
                key={count}
                onClick={() => { playSound('buttonClick'); setRemainingAutoSpins(count); setAutoSpin(true); }}
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
      onClick={() => { playSound('buttonClick'); setAutoSpin(false); }}
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
      {/* Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image src={slotBg} alt="Slot Background" fill className="object-cover" quality={100} priority />
      </div>

      {/* Win flash overlay on the whole screen */}
      {isWinning && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
          animation: "sm-flash-bg 1.2s ease-out forwards",
        }} />
      )}

      {/* Back button */}
      <div className="fixed top-4 left-2 xl:ml-8 xl:pt-3 z-10">
        <button onClick={() => router.back()} className="text-white hover:text-purple-300 transition-colors">
          <ChevronLeftCircle size={36} />
        </button>
      </div>

      <PayoutsSheet />

      {/* Volume */}
      <div className="flex flex-col items-center gap-2 fixed top-4 md:top-28 md:left-2 left-28 -ml-2 md:ml-0 xl:ml-8 xl:pt-3 z-10">
        <button onClick={toggleMute} className="text-white hover:text-purple-300 transition-colors">
          {isMuted ? <VolumeOff size={36} /> : <Volume2 size={36} />}
        </button>
      </div>

      {/* Balance */}
      <p className="fixed text-white z-50 top-4 right-2 xl:pr-8 xl:pt-3 pt-1 text-xl">
        {isWinning && (
          <span className="text-lime-500 ml-2" style={{
            textShadow: "0 0 12px rgba(100,255,100,0.7)",
            animation: "sm-win-amount-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            (+{formatter.format(winAmount)})
          </span>
        )}
        <span> </span>
        <span
          className="text-purple-200"
          style={{
            textShadow: "0 0 8px rgba(200,180,255,0.5)",
            display: "inline-block",
            animation: balanceBump ? "sm-balance-bump 0.5s ease-out" : "none",
          }}
        >
          {formatter.format(balance)}
        </span>
      </p>

      {/* Main content */}
      <div className="flex flex-col items-center xl:justify-center gap-8 text-center min-h-[calc(100vh-100px)] relative z-2">

        {/* Reel container */}
        <div className="absolute xl:mt-[0px] sm:mt-[0px] mt-[120px] xl:left-[100px] md:left-[50px] z-3">
          <div
            className="relative flex justify-center items-center w-[95vw] h-[174px] sm:h-[230px] xl:w-[1000px] max-w-[370px] sm:max-w-[500px] xl:max-w-[1000px] xl:h-[442px] overflow-hidden p-2 rounded-xl xl:px-20 sm:px-12 px-9"
            style={{
              /* Subtle animated border when winning */
              outline: isWinning ? "2px solid rgba(255,215,0,0.4)" : "none",
              boxShadow: isWinning
                ? "0 0 40px 8px rgba(255,200,0,0.12), inset 0 0 60px rgba(255,200,0,0.05)"
                : "none",
              transition: "outline 0.3s, box-shadow 0.5s",
            }}
          >
            {/* Coin particles */}
            {coins.map(c => (
              <CoinParticle key={c.id} x={c.x} onDone={() =>
                setCoins(prev => prev.filter(p => p.id !== c.id))
              } />
            ))}

            {/* Confetti */}
            {confetti.map(c => (
              <ConfettiPiece key={c.id} x={c.x} color={c.color} rot={c.rot} onDone={() =>
                setConfetti(prev => prev.filter(p => p.id !== c.id))
              } />
            ))}

            {/* Ripple */}
            {showRipple && <RippleBurst onDone={() => setShowRipple(false)} />}

            {/* Win banner */}
            {showWinBanner && (
              <WinBanner amount={winAmount} onDone={() => setShowWinBanner(false)} />
            )}

            {reels.map((col, colIndex) => renderReel(col, colIndex))}
          </div>

          {/* Frame overlay */}
          <div className="absolute inset-0 w-full h-full z-1 xl:top-[110px] sm:top-[63px] top-[52px] -translate-y-1/2 sm:max-w-[500px] xl:max-w-[1000px]">
            <Image width={1000} src={frameOverlay} alt="Frame Overlay" className="object-cover" />
          </div>
        </div>

        {/* Spin button — keep original positioning classes */}
        <button
          onClick={spinReels}
          disabled={spinning || autoSpin || pendingSpin}
          className={`absolute bottom-0 mb-[40px] xl:mb-0 md:inset-y-auto flex items-center justify-center xl:w-[220px] w-[150px] xl:h-56 border-2 border-white rounded-full transition-all duration-300 xl:right-[150px] md:right-[50px] xl:mt-0 md:mt-[150px] cursor-pointer z-20`}
          style={{
            boxShadow: spinning
              ? "0 0 42px rgba(180,120,255,0.85), 0 0 80px rgba(255,215,0,0.25)"
              : isWinning
              ? "0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,180,0,0.3)"
              : "0 0 20px rgba(255,255,255,0.7)",
            animation: spinning ? "sm-spin-btn-glow 0.8s ease-in-out infinite" : "none",
            transform: spinning ? "scale(0.96)" : "scale(1)",
            transition: "box-shadow 0.4s ease, transform 0.15s ease",
          }}
        >
          <Image
            src={spinIcon}
            alt="Spin"
            width={200}
            height={128}
            style={{
              animation: spinning
                ? `sm-spin-btn-spin ${adjustedAnimationDuration}ms linear`
                : "none",
              transition: "filter 0.3s",
              filter: isWinning ? "drop-shadow(0 0 12px rgba(255,215,0,0.6))" : "none",
            }}
          />
        </button>

        {/* Mobile controls toggle */}
        <div className="md:hidden fixed bottom-[90px] left-3 z-20">
          <button
            onClick={() => { playSound('buttonClick'); setShowMobileControls(!showMobileControls); }}
            className={`bg-black bg-opacity-30 border-2 border-white rounded-full p-2 transition-all duration-300 rotate-0 ${showMobileControls ? 'mb-20 rotate-180' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col fixed w-full bottom-0 left-0 border-t-2 border-white md:py-4 px-8 bg-black bg-opacity-30 backdrop-blur-sm z-20 pb-4 xl:pb-4"
          style={{ borderTopColor: isWinning ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.5)", transition: "border-color 0.5s" }}
        >
          <div className="flex flex-col xl:flex-row justify-between relative items-center xl:gap-8 gap-3">

            {/* Mobile expandable controls */}
            <div className={`md:hidden w-full flex flex-col gap-4 overflow-hidden transition-all duration-500 ${showMobileControls ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex justify-center gap-4 pt-4">
                <button
                  className="flex border-2 border-white rounded-full py-1 px-2 hover:bg-gray-700 transition duration-300 hover:scale-105"
                  onClick={handleSpeedButtonClick}
                >
                  <GoTriangleRight size={50} color={speedMultiplier >= 1 ? "white" : "gray"} />
                  <GoTriangleRight className="ml-[-25px] mr-[-25px]" size={50} color={speedMultiplier >= 2 ? "white" : "gray"} />
                  <GoTriangleRight size={50} color={speedMultiplier >= 3 ? "white" : "gray"} />
                </button>
                <div className="flex">
                  {autoSpin && remainingAutoSpins > 0 ? renderStopAutoSpinButton() : renderAutoSpinButton()}
                </div>
              </div>
            </div>

            {/* Desktop preset bets */}
            <div className="xl:flex gap-3 hidden">
              {PRESET_BETS.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => { playSound('buttonClick'); setBet(amount); }}
                  disabled={spinning || autoSpin || pendingSpin}
                  className="text-3xl py-2.5 px-6 hover:scale-105 transition-transform h-full"
                  style={{ transition: "transform 0.15s, box-shadow 0.15s" }}
                >
                  {amount}
                </Button>
              ))}
            </div>

            {/* Bet input */}
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

            {/* Desktop speed + auto */}
            <div className="md:flex gap-4 hidden">
              <button
                className="flex border-2 border-white rounded-full py-1 px-2 hover:bg-gray-700 transition duration-300 hover:scale-105"
                onClick={handleSpeedButtonClick}
              >
                <GoTriangleRight size={50} color={speedMultiplier >= 1 ? "white" : "gray"} />
                <GoTriangleRight className="ml-[-25px] mr-[-25px]" size={50} color={speedMultiplier >= 2 ? "white" : "gray"} />
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