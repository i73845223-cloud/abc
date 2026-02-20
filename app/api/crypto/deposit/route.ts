import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { createPayment } from '@/lib/nowpayments';
import { inrToUsd } from '@/lib/currency-converter';
import { BalanceCache } from '@/lib/cached-balance';
import { TransactionStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { amountInr, currency } = await req.json();

    if (!amountInr || amountInr <= 0 || !currency) {
      return new NextResponse('Invalid amount or currency', { status: 400 });
    }

    const usdAmount = await inrToUsd(amountInr);
    const orderId = `deposit_${user.id}_${Date.now()}`;

    const payment = await createPayment({
      priceAmount: usdAmount,
      priceCurrency: 'usd',
      payCurrency: currency,
      orderId,
      orderDescription: `Deposit for user ${user.id}`,
    });

    const result = await db.$transaction(async (tx) => {
      const cryptoPayment = await tx.cryptoPayment.create({
        data: {
          userId: user.id,
          paymentId: payment.payment_id,
          orderId,
          payAddress: payment.pay_address,
          payCurrency: payment.pay_currency,
          payAmount: payment.pay_amount,
          priceAmount: payment.price_amount,
          priceCurrency: payment.price_currency,
          baseAmount: amountInr,
          baseCurrency: 'INR',
          expiresAt: payment.expiration_estimate_date
            ? new Date(payment.expiration_estimate_date)
            : null,
          status: 'PENDING',
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'deposit',
          amount: amountInr,
          status: TransactionStatus.pending,
          description: `Pending crypto deposit via ${payment.pay_currency.toUpperCase()}`,
          category: 'transaction',
        },
      });

      await tx.cryptoPayment.update({
        where: { id: cryptoPayment.id },
        data: { transactionId: transaction.id },
      });

      return { cryptoPayment, transaction };
    });

    BalanceCache.getInstance().invalidateCache(user.id);

    return NextResponse.json({
      paymentId: result.cryptoPayment.paymentId,
      address: result.cryptoPayment.payAddress,
      qrCode: payment.qr_code,
      amount: result.cryptoPayment.payAmount,
      currency: result.cryptoPayment.payCurrency,
      amountInr: result.cryptoPayment.baseAmount,
      expiresAt: result.cryptoPayment.expiresAt,
    });
  } catch (error) {
    console.error('[CRYPTO_DEPOSIT_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}