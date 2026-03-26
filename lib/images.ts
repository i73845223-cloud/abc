import imageUrls from './image-urls.json';

export function getImageUrl(filename: string): string {
  return imageUrls[filename as keyof typeof imageUrls] || `/${filename}`;
}

export const BANNER_IMAGES = {
  '1en': getImageUrl('banners/1en.png'),
  '2en': getImageUrl('banners/2en.png'),
  '3en': getImageUrl('banners/3en.png'),
  '1hi': getImageUrl('banners/1hi.png'),
  '2hi': getImageUrl('banners/2hi.png'),
  '3hi': getImageUrl('banners/3hi.png'),
} as const;

export const SLOT_GAME_IMAGES = {
  neonShinjuku: getImageUrl('neon-shinjuku/preview.webp'),
  maestro: getImageUrl('maestro/preview.webp'),
  villagersDream: getImageUrl('villagers-dream/preview.webp'),
  rupeeRush: getImageUrl('rupee-rush/preview.webp'),
  forestRomp: getImageUrl('forest-romp/preview.webp'),
} as const;

export const SPORT_ICONS = {
  football: getImageUrl('football.webp'),
  cricket: getImageUrl('cricket.webp'),
  basketball: getImageUrl('basketball.webp'),
} as const;