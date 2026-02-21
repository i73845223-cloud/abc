import axios from 'axios';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const BASE_URL = 'https://api.nowpayments.io/v1'; // production

// In‑memory cache with TTL
interface CachedRate {
  rate: number;
  expires: number;
}
const rateCache = new Map<string, CachedRate>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Convert an amount from one currency to another using NOWPayments estimate.
 * Implements caching and retry on 429.
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  const cacheKey = `${from.toLowerCase()}-${to.toLowerCase()}`;
  const cached = rateCache.get(cacheKey);

  // Use cached rate if still valid
  if (cached && cached.expires > Date.now()) {
    return amount * cached.rate;
  }

  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/estimate`, {
        params: {
          amount,
          currency_from: from.toLowerCase(),
          currency_to: to.toLowerCase(),
        },
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
      });

      const estimated = response.data.estimated_amount;
      const rate = estimated / amount;

      // Store in cache
      rateCache.set(cacheKey, {
        rate,
        expires: Date.now() + CACHE_TTL_MS,
      });

      return estimated;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Rate limited – exponential backoff
        const waitMs = 1000 * Math.pow(2, attempt);
        console.log(`[CURRENCY_CONVERT] 429 on attempt ${attempt}, waiting ${waitMs}ms`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        lastError = error;
      } else {
        // Other error – throw immediately
        throw error;
      }
    }
  }

  throw lastError || new Error('Currency conversion failed after retries');
}

/**
 * Convert INR to USD using NOWPayments.
 */
export async function inrToUsd(inrAmount: number): Promise<number> {
  return convertCurrency(inrAmount, 'inr', 'usd');
}

/**
 * Convert USD to a cryptocurrency amount.
 */
export async function usdToCrypto(usdAmount: number, cryptoCurrency: string): Promise<number> {
  return convertCurrency(usdAmount, 'usd', cryptoCurrency);
}