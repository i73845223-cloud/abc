import imageUrls from './image-urls.json';

export function getAssetUrl(filepath: string): string {
  return imageUrls[filepath as keyof typeof imageUrls] || `/${filepath}`;
}

export function getGameImage(gameName: string, filename: string): string {
  return getAssetUrl(`${gameName}/${filename}`);
}

export function getGameSound(gameName: string, filename: string): string {
  return getAssetUrl(`${gameName}/sounds/${filename}`);
}

export function getRootAsset(filename: string): string {
  return getAssetUrl(filename);
}

export const GAME_ASSETS = {
  spinIcon: getRootAsset('spin.webp'),
  
  neonShinjuku: {
    bg: getGameImage('neon-shinjuku', 'bg.webp'),
    frame: getGameImage('neon-shinjuku', 'frame.webp'),
    symbols: {
      '1symb': getGameImage('neon-shinjuku', '1symb.webp'),
      '2symb': getGameImage('neon-shinjuku', '2symb.webp'),
      '3symb': getGameImage('neon-shinjuku', '3symb.webp'),
      '4symb': getGameImage('neon-shinjuku', '4symb.webp'),
      '5symb': getGameImage('neon-shinjuku', '5symb.webp'),
    },
    sounds: {
      '1symb': getGameSound('neon-shinjuku', '1symb.mp3'),
      '2symb': getGameSound('neon-shinjuku', '2symb.mp3'),
      '3symb': getGameSound('neon-shinjuku', '3symb.mp3'),
      '4symb': getGameSound('neon-shinjuku', '4symb.mp3'),
      '5symb': getGameSound('neon-shinjuku', '5symb.mp3'),
      background: getGameSound('neon-shinjuku', 'bg.mp3'),
      spin: getGameSound('neon-shinjuku', 'spin.mp3'),
      win: getGameSound('neon-shinjuku', 'win.mp3'),
      buttonClick: getGameSound('neon-shinjuku', 'button-click.mp3'),
    }
  },
  
  maestro: {
    bg: getGameImage('maestro', 'bg.webp'),
    frame: getGameImage('maestro', 'frame.webp'),
    symbols: {
      '1symb': getGameImage('maestro', '1symb.webp'),
      '2symb': getGameImage('maestro', '2symb.webp'),
      '3symb': getGameImage('maestro', '3symb.webp'),
      '4symb': getGameImage('maestro', '4symb.webp'),
      '5symb': getGameImage('maestro', '5symb.webp'),
    },
    sounds: {
      '1symb': getGameSound('maestro', '1symb.mp3'),
      '2symb': getGameSound('maestro', '2symb.mp3'),
      '3symb': getGameSound('maestro', '3symb.mp3'),
      '4symb': getGameSound('maestro', '4symb.mp3'),
      '5symb': getGameSound('maestro', '5symb.mp3'),
      background: getGameSound('maestro', 'bg.mp3'),
      spin: getGameSound('maestro', 'spin.mp3'),
      win: getGameSound('maestro', 'win.mp3'),
      buttonClick: getGameSound('maestro', 'button-click.mp3'),
    }
  },
  
  forestRomp: {
    bg: getGameImage('forest-romp', 'bg.webp'),
    frame: getGameImage('forest-romp', 'frame.webp'),
    symbols: {
      '1symb': getGameImage('forest-romp', '1symb.webp'),
      '2symb': getGameImage('forest-romp', '2symb.webp'),
      '3symb': getGameImage('forest-romp', '3symb.webp'),
      '4symb': getGameImage('forest-romp', '4symb.webp'),
      '5symb': getGameImage('forest-romp', '5symb.webp'),
    },
    sounds: {
      '1symb': getGameSound('forest-romp', '1symb.mp3'),
      '2symb': getGameSound('forest-romp', '2symb.mp3'),
      '3symb': getGameSound('forest-romp', '3symb.mp3'),
      '4symb': getGameSound('forest-romp', '4symb.mp3'),
      '5symb': getGameSound('forest-romp', '5symb.mp3'),
      background: getGameSound('forest-romp', 'bg.mp3'),
      spin: getGameSound('forest-romp', 'spin.mp3'),
      win: getGameSound('forest-romp', 'win.mp3'),
      buttonClick: getGameSound('forest-romp', 'button-click.mp3'),
    }
  },
  
  rupeeRush: {
    bg: getGameImage('rupee-rush', 'bg.webp'),
    frame: getGameImage('rupee-rush', 'frame.webp'),
    symbols: {
      '1symb': getGameImage('rupee-rush', '1symb.webp'),
      '2symb': getGameImage('rupee-rush', '2symb.webp'),
      '3symb': getGameImage('rupee-rush', '3symb.webp'),
      '4symb': getGameImage('rupee-rush', '4symb.webp'),
      '5symb': getGameImage('rupee-rush', '5symb.webp'),
    },
    sounds: {
      '1symb': getGameSound('rupee-rush', '1symb.mp3'),
      '2symb': getGameSound('rupee-rush', '2symb.mp3'),
      '3symb': getGameSound('rupee-rush', '3symb.mp3'),
      '4symb': getGameSound('rupee-rush', '4symb.mp3'),
      '5symb': getGameSound('rupee-rush', '5symb.mp3'),
      background: getGameSound('rupee-rush', 'bg.mp3'),
      spin: getGameSound('rupee-rush', 'spin.mp3'),
      win: getGameSound('rupee-rush', 'win.mp3'),
      buttonClick: getGameSound('rupee-rush', 'button-click.mp3'),
    }
  },
  
  villagersDream: {
    bg: getGameImage('villagers-dream', 'bg.webp'),
    frame: getGameImage('villagers-dream', 'frame.webp'),
    symbols: {
      '1symb': getGameImage('villagers-dream', '1symb.webp'),
      '2symb': getGameImage('villagers-dream', '2symb.webp'),
      '3symb': getGameImage('villagers-dream', '3symb.webp'),
      '4symb': getGameImage('villagers-dream', '4symb.webp'),
      '5symb': getGameImage('villagers-dream', '5symb.webp'),
    },
    sounds: {
      '1symb': getGameSound('villagers-dream', '1symb.mp3'),
      '2symb': getGameSound('villagers-dream', '2symb.mp3'),
      '3symb': getGameSound('villagers-dream', '3symb.mp3'),
      '4symb': getGameSound('villagers-dream', '4symb.mp3'),
      '5symb': getGameSound('villagers-dream', '5symb.mp3'),
      background: getGameSound('villagers-dream', 'bg.mp3'),
      spin: getGameSound('villagers-dream', 'spin.mp3'),
      win: getGameSound('villagers-dream', 'win.mp3'),
      buttonClick: getGameSound('villagers-dream', 'button-click.mp3'),
    }
  },
} as const;