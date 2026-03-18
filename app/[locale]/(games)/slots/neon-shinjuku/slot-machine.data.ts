import { GAME_ASSETS } from '@/lib/game-assets';

export const ANIMATION_DURATION = 1500;
export const MIN_BET = 10;
export const MAX_BET = 10000;
export const PRESET_BETS = [100, 500, 1000, 5000];
export const AUTO_SPIN_OPTIONS = [5, 10, 20, 50, 100, 1000];

const gameAssets = GAME_ASSETS.neonShinjuku;

export const lemon = gameAssets.symbols['1symb'];
export const cherries = gameAssets.symbols['2symb'];
export const orange = gameAssets.symbols['3symb'];
export const bell = gameAssets.symbols['4symb'];
export const diamond = gameAssets.symbols['5symb'];

export const SOUND_PATHS = {
  background: gameAssets.sounds.background,
  spin: gameAssets.sounds.spin,
  win: gameAssets.sounds.win,
  buttonClick: gameAssets.sounds.buttonClick,
  symbols: {
    lemon: gameAssets.sounds['1symb'],
    cherries: gameAssets.sounds['2symb'],
    orange: gameAssets.sounds['3symb'],
    bell: gameAssets.sounds['4symb'],
    diamond: gameAssets.sounds['5symb'],
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

export const getRandomSymbol = (): string => {
  const rand = Math.random();
  let sum = 0;
  
  for (const { symbol, rarity } of SYMBOLS) {
    sum += rarity;
    if (rand < sum) return symbol;
  }
  
  return SYMBOLS[SYMBOLS.length - 1].symbol;
};