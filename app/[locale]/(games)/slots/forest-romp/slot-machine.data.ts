import { GAME_ASSETS } from '@/lib/game-assets';

export const ANIMATION_DURATION = 1500;
export const MIN_BET = 10;
export const MAX_BET = 10000;
export const PRESET_BETS = [100, 500, 1000, 5000];
export const AUTO_SPIN_OPTIONS = [5, 10, 20, 50, 100, 1000];

const gameAssets = GAME_ASSETS.forestRomp;

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

export const getRandomSymbol = (): string => {
  const rand = Math.random();
  let sum = 0;
  
  for (const { symbol, rarity } of SYMBOLS) {
    sum += rarity;
    if (rand < sum) return symbol;
  }
  
  return SYMBOLS[SYMBOLS.length - 1].symbol;
};