import { NextResponse } from 'next/server';

const NOWPAYMENTS_API_KEY = 'K4VRA2D-4B7MKKE-HDFMQYS-59QXM5M'; // hardcoded
const BASE_URL = 'https://api.nowpayments.io/v1';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get('currency');
    console.log('[DEBUG] Currency:', currency);
    if (!currency) return NextResponse.json({ minAmountInr: 500 });

    const normalized = currency.toLowerCase();
    const map: Record<string, string> = {
      usdttrc20: 'usdt',
      usdterc20: 'usdt',
      usdcerc20: 'usdc',
      usdcsol: 'usdc',
    };
    const fromToken = map[normalized] || normalized;
    const targetToken = 'usdttrc20';
    const minUrl = `${BASE_URL}/min-amount?currency_from=${fromToken}&currency_to=${targetToken}&fiat_equivalent=usd`;
    console.log('[DEBUG] Fetching URL:', minUrl);

    const minRes = await fetch(minUrl, {
      headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
    });
    console.log('[DEBUG] Response status:', minRes.status);
    const minText = await minRes.text();
    console.log('[DEBUG] Response text:', minText);

    if (!minRes.ok) throw new Error(`HTTP ${minRes.status}`);

    const minData = JSON.parse(minText);
    const minUsd = minData.fiat_equivalent;
    if (!minUsd) throw new Error('No fiat_equivalent');

    const inrPerUsd = 85;
    let minInr = Math.ceil(minUsd * inrPerUsd);
    minInr = Math.max(500, Math.ceil(minInr / 100) * 100);
    console.log('[DEBUG] Final min INR:', minInr);
    return NextResponse.json({ minAmountInr: minInr });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({ minAmountInr: 500 });
  }
}