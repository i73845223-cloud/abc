import imageUrls from './image-urls.json';

export function getCryptoImageUrl(filename: string): string {
  return imageUrls[filename as keyof typeof imageUrls] || `/${filename}`;
}

export const CRYPTO_IMAGES = {
  'tether-usdt': getCryptoImageUrl('crypto/tether-usdt-logo.png'),
  'usd-coin-usdc': getCryptoImageUrl('crypto/usd-coin-usdc-logo.png'),
  'ethereum-eth': getCryptoImageUrl('crypto/ethereum-eth-logo.png'),
  'bitcoin-btc': getCryptoImageUrl('crypto/bitcoin-btc-logo.png'),
  'solana-sol': getCryptoImageUrl('crypto/solana-sol-logo.png'),
  'tron-trx': getCryptoImageUrl('crypto/tron-trx-logo.png'),
  'tron-network': getCryptoImageUrl('crypto/tron-trx-logo.png'),
  'ethereum-network': getCryptoImageUrl('crypto/ethereum-eth-logo.png'),
  'solana-network': getCryptoImageUrl('crypto/solana-sol-logo.png'),
  'placeholder': getCryptoImageUrl('crypto/placeholder-logo.png'),
} as const;