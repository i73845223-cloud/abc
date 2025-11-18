import lemon from "@/public/rupee-rush/1symb.webp";
import cherries from "@/public/rupee-rush/2symb.webp";
import orange from "@/public/rupee-rush/3symb.webp";
import bell from "@/public/rupee-rush/4symb.webp";
import diamond from "@/public/rupee-rush/5symb.gif";
import { StaticImageData } from "next/image";

export const ANIMATION_DURATION = 1500;
export const MIN_BET = 10;
export const MAX_BET = 10000;
export const PRESET_BETS = [100, 500, 1000, 5000];
export const AUTO_SPIN_OPTIONS = [5, 10, 20, 50, 100, 1000];

export const SOUND_PATHS = {
  background: "../rupee-rush/sounds/bg.mp3",
  spin: '../rupee-rush/sounds/spin.mp3',
  symbols: {
    lemon: '../rupee-rush/sounds/1win.mp3',
    cherries: '../rupee-rush/sounds/2win.mp3',
    orange: '../rupee-rush/sounds/3win.mp3',
    bell: '../rupee-rush/sounds/4win.mp3',
    diamond: '../rupee-rush/sounds/5win.mp3',
  }
};

export const SYMBOLS = [
  { symbol: lemon, rarity: 0.4, basePayout: 10, sound: 'lemon' },
  { symbol: cherries, rarity: 0.375, basePayout: 15, sound: 'cherries' },
  { symbol: orange, rarity: 0.185, basePayout: 25, sound: 'orange' },
  { symbol: bell, rarity: 0.03, basePayout: 500, sound: 'bell' },
  { symbol: diamond, rarity: 0.01, basePayout: 5000, sound: 'diamond' },
];

export const PAYOUTS = [
  {
    symbol: diamond,
    combinations: [
      { count: 3, multiplier: 1000 }
    ]
  },
  {
    symbol: bell,
    combinations: [
      { count: 3, multiplier: 100 }
    ]
  },
  {
    symbol: orange,
    combinations: [
      { count: 3, multiplier: 5 }
    ]
  },
  {
    symbol: cherries,
    combinations: [
      { count: 3, multiplier: 3 }
    ]
  },
  {
    symbol: lemon,
    combinations: [
      { count: 3, multiplier: 2 }
    ]
  }
].sort((a, b) => b.combinations[0].multiplier - a.combinations[0].multiplier);

export const getRandomSymbol = (): StaticImageData => {
  const rand = Math.random();
  let sum = 0;
  
  for (const { symbol, rarity } of SYMBOLS) {
    sum += rarity;
    if (rand < sum) return symbol;
  }
  
  return SYMBOLS[SYMBOLS.length - 1].symbol;
};