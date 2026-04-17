import { NextResponse } from 'next/server';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const BASE_URL = 'https://api.nowpayments.io/v1';
const INR_PER_USD = parseFloat(process.env.INR_PER_USD || '100');

const cache = new Map();

async function fetchWithRetry(url: string, retries = 2, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { 'x-api-key': NOWPAYMENTS_API_KEY! } });
    if (res.status !== 429) return res;
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay * (i + 1)));
  }
  return new Response(null, { status: 429 });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get('currency');
    if (!currency) return NextResponse.json({ minAmountInr: 500 });

    const normalized = currency.toLowerCase();
    const cacheKey = normalized;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ minAmountInr: cached.value });
    }

    const minCryptoUrl = `${BASE_URL}/min-amount?currency_from=${normalized}&currency_to=usdterc20`;
    const minRes = await fetchWithRetry(minCryptoUrl);

    if (minRes.status === 404) {
      console.warn(`[MIN_AMOUNT] Currency ${normalized} not supported, using fallback 1000`);
      cache.set(cacheKey, { value: 1000, expires: Date.now() + 60 * 60 * 1000 }); // cache 1 hour
      return NextResponse.json({ minAmountInr: 1000 });
    }

    if (!minRes.ok) throw new Error(`min-amount failed: ${minRes.status}`);
    const minData = await minRes.json();
    const minCryptoAmount = minData.min_amount;
    if (!minCryptoAmount) throw new Error('Invalid min_amount');

    const estUrl = `${BASE_URL}/estimate?amount=${minCryptoAmount}&currency_from=${normalized}&currency_to=usd`;
    const estRes = await fetchWithRetry(estUrl);
    if (!estRes.ok) throw new Error(`estimate failed: ${estRes.status}`);
    const estData = await estRes.json();
    const minUsd = parseFloat(estData.estimated_amount);
    if (isNaN(minUsd)) throw new Error('Invalid estimated_amount');

    const minInr = Math.ceil(minUsd * INR_PER_USD);
    cache.set(cacheKey, { value: minInr, expires: Date.now() + 10 * 60 * 1000 });
    return NextResponse.json({ minAmountInr: minInr });
  } catch (error) {
    console.error('[MIN_AMOUNT]', error);
    return NextResponse.json({ minAmountInr: 500 });
  }
}