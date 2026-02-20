import axios from 'axios';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const BASE_URL = 'https://api.nowpayments.io/v1';

/**
 * Convert an amount from one currency to another using NOWPayments estimate.
 * @param amount - amount in source currency
 * @param from - source currency code (e.g., 'inr', 'usd')
 * @param to - target currency code (e.g., 'usd', 'btc')
 * @returns estimated amount in target currency
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
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
    return response.data.estimated_amount;
  } catch (error) {
    console.error('[CURRENCY_CONVERSION_ERROR]', error);
    throw new Error(`Currency conversion from ${from} to ${to} failed`);
  }
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