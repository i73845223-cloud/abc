import imageUrls from './image-urls.json';

export function getImageUrl(filename: string): string {
  return imageUrls[filename as keyof typeof imageUrls] || `/${filename}`;
}

export const BANNER_IMAGES = {
  '1en': getImageUrl('banners/1en.webp'),
  '2en': getImageUrl('banners/2en.webp'),
  '3en': getImageUrl('banners/3en.webp'),
  '4en': getImageUrl('banners/4en.webp'),
  '1hi': getImageUrl('banners/1hi.webp'),
  '2hi': getImageUrl('banners/2hi.webp'),
  '3hi': getImageUrl('banners/3hi.webp'),
  '4hi': getImageUrl('banners/4hi.webp'),
} as const;

export const SLOT_GAME_IMAGES = {
  neonShinjuku: getImageUrl('neon-shinjuku/preview.webp'),
  maestro: getImageUrl('maestro/preview.webp'),
  villagersDream: getImageUrl('villagers-dream/preview.webp'),
  rupeeRush: getImageUrl('rupee-rush/preview.webp'),
  forestRomp: getImageUrl('forest-romp/preview.webp'),
} as const;