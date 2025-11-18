import lemon from "@/public/villagers-dream/1symb.webp";
import cherries from "@/public/villagers-dream/2symb.webp";
import orange from "@/public/villagers-dream/3symb.webp";
import bell from "@/public/villagers-dream/4symb.webp";
import diamond from "@/public/villagers-dream/5symb.webp";
import { StaticImageData } from "next/image";

export const ANIMATION_DURATION = 1500;
export const MIN_BET = 10;
export const MAX_BET = 10000;
export const PRESET_BETS = [100, 500, 1000, 5000];
export const AUTO_SPIN_OPTIONS = [5, 10, 20, 50, 100, 1000];

export const SOUND_PATHS = {
  background: "../../villagers-dream/sounds/background.mp3",
  spin: '../../villagers-dream/sounds/spin.mp3',
  symbols: {
    lemon: '../../villagers-dream/sounds/1symb.mp3',
    cherries: '../../villagers-dream/sounds/2symb.mp3',
    orange: '../../villagers-dream/sounds/3symb.mp3',
    bell: '../../villagers-dream/sounds/4symb.mp3',
    diamond: '../../villagers-dream/sounds/5symb.mp3',
  }
};

export const SYMBOLS = [
  { symbol: lemon, rarity: 0.4, basePayout: 5, sound: 'lemon' },
  { symbol: cherries, rarity: 0.375, basePayout: 7.5, sound: 'cherries' },
  { symbol: orange, rarity: 0.185, basePayout: 10, sound: 'orange' },
  { symbol: bell, rarity: 0.03, basePayout: 20, sound: 'bell' },
  { symbol: diamond, rarity: 0.01, basePayout: 100, sound: 'diamond' },
];

export const PAYOUTS = [
  {
    symbol: diamond,
    combinations: [
      { count: 5, multiplier: 40 },
      { count: 4, multiplier: 30 },
      { count: 3, multiplier: 20 }
    ]
  },
  {
    symbol: bell,
    combinations: [
      { count: 5, multiplier: 8 },
      { count: 4, multiplier: 6 },
      { count: 3, multiplier: 4 }
    ]
  },
  {
    symbol: orange,
    combinations: [
      { count: 5, multiplier: 4 },
      { count: 4, multiplier: 3 },
      { count: 3, multiplier: 2 }
    ]
  },
  {
    symbol: cherries,
    combinations: [
      { count: 5, multiplier: 3 },
      { count: 4, multiplier: 2.3 },
      { count: 3, multiplier: 1.5 }
    ]
  },
  {
    symbol: lemon,
    combinations: [
      { count: 5, multiplier: 2 },
      { count: 4, multiplier: 1.5 },
      { count: 3, multiplier: 1 }
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