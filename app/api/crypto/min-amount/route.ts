import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const BASE_URL = 'https://api.nowpayments.io/v1';
const INR_PER_USD = parseFloat(process.env.INR_PER_USD || '100');

const cache = new Map();

async function fetchWithRetry(url: string, retries = 2, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    console.log(`[FETCH] Attempt ${i+1}: ${url}`);
    const res = await fetch(url, { headers: { 'x-api-key': NOWPAYMENTS_API_KEY! } });
    console.log(`[FETCH] Response status: ${res.status}`);
    if (res.status !== 429) return res;
    console.log(`[FETCH] Rate limited, retrying in ${delay}ms`);
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay * (i + 1)));
  }
  return new Response(null, { status: 429 });
}

export async function GET(req: Request) {
  try {
    console.log('[MIN-AMOUNT] Request received');
    console.log('[MIN-AMOUNT] API key present?', !!NOWPAYMENTS_API_KEY);
    console.log('[MIN-AMOUNT] API key prefix:', NOWPAYMENTS_API_KEY?.substring(0, 5));

    const { searchParams } = new URL(req.url);
    const currency = searchParams.get('currency');
    console.log('[MIN-AMOUNT] Currency:', currency);
    if (!currency) return NextResponse.json({ minAmountInr: 500 });

    const normalized = currency.toLowerCase();
    const cacheKey = normalized;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log('[MIN-AMOUNT] Cache hit for', normalized);
      return NextResponse.json({ minAmountInr: cached.value });
    }

    const minCryptoUrl = `${BASE_URL}/min-amount?currency_from=${normalized}&currency_to=usdterc20`;
    console.log('[MIN-AMOUNT] Fetching min amount:', minCryptoUrl);
    const minRes = await fetchWithRetry(minCryptoUrl);

    if (minRes.status === 404) {
      console.warn(`[MIN-AMOUNT] Currency ${normalized} not supported, using fallback 1000`);
      cache.set(cacheKey, { value: 1000, expires: Date.now() + 60 * 60 * 1000 });
      return NextResponse.json({ minAmountInr: 1000 });
    }

    if (!minRes.ok) {
      const errorText = await minRes.text();
      console.error(`[MIN-AMOUNT] min-amount failed: ${minRes.status}, body: ${errorText}`);
      throw new Error(`min-amount failed: ${minRes.status}`);
    }
    const minData = await minRes.json();
    const minCryptoAmount = minData.min_amount;
    console.log('[MIN-AMOUNT] minCryptoAmount:', minCryptoAmount);
    if (!minCryptoAmount) throw new Error('Invalid min_amount');

    const estUrl = `${BASE_URL}/estimate?amount=${minCryptoAmount}&currency_from=${normalized}&currency_to=usd`;
    console.log('[MIN-AMOUNT] Fetching estimate:', estUrl);
    const estRes = await fetchWithRetry(estUrl);
    if (!estRes.ok) {
      const errorText = await estRes.text();
      console.error(`[MIN-AMOUNT] estimate failed: ${estRes.status}, body: ${errorText}`);
      throw new Error(`estimate failed: ${estRes.status}`);
    }
    const estData = await estRes.json();
    const minUsd = parseFloat(estData.estimated_amount);
    console.log('[MIN-AMOUNT] minUsd:', minUsd);
    if (isNaN(minUsd)) throw new Error('Invalid estimated_amount');

    const minInr = Math.ceil(minUsd * INR_PER_USD);
    console.log('[MIN-AMOUNT] minInr:', minInr);
    cache.set(cacheKey, { value: minInr, expires: Date.now() + 10 * 60 * 1000 });
    return NextResponse.json({ minAmountInr: minInr });
  } catch (error) {
    console.error('[MIN-AMOUNT] Error:', error);
    return NextResponse.json({ minAmountInr: 500 });
  }
}