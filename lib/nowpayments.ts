import axios from 'axios';

const API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const BASE_URL = 'https://api.nowpayments.io/v1'; // https://api-sandbox.nowpayments.io/v1

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export async function createPayment({
  priceAmount,
  priceCurrency = 'usd',
  payCurrency,
  orderId,
  orderDescription,
}: {
  priceAmount: number;
  priceCurrency?: string;
  payCurrency: string;
  orderId: string;
  orderDescription?: string;
}) {
  const response = await api.post('/payment', {
    price_amount: priceAmount,
    price_currency: priceCurrency,
    pay_currency: payCurrency,
    order_id: orderId,
    order_description: orderDescription,
    ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
  });
  return response.data;
}

export async function getJWTToken() {
  const response = await axios.post(`${BASE_URL}/auth`, {
    email: process.env.NOWPAYMENTS_EMAIL,
    password: process.env.NOWPAYMENTS_PASSWORD,
  });
  return response.data.token;
}

export async function createMassPayout(withdrawals: Array<{
  address: string;
  currency: string;
  amount: number;
}>) {
  const token = await getJWTToken();
  const response = await axios.post(
    `${BASE_URL}/payout/create`,
    { withdrawals },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}