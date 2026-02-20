import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { createMassPayout } from '@/lib/nowpayments';
import { inrToUsd, usdToCrypto } from '@/lib/currency-converter';
import { BalanceCache } from '@/lib/cached-balance';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { amountInr, currency, address } = await req.json();

    if (!amountInr || amountInr <= 0 || !currency || !address) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const balanceCache = BalanceCache.getInstance();
    const currentBalance = await balanceCache.getBalance(user.id);
    if (currentBalance < amountInr) {
      return new NextResponse('Insufficient funds', { status: 400 });
    }

    const usdAmount = await inrToUsd(amountInr);
    const cryptoAmount = await usdToCrypto(usdAmount, currency);

    const withdrawalRequest = await db.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount: amountInr,       
        currency,
        address,
        baseAmount: amountInr,
        baseCurrency: 'INR',
        status: 'pending',
      },
    });

    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: 'withdrawal',
        amount: amountInr,
        status: 'pending',
        description: `Withdrawal request to ${currency} address ${address.substring(0, 10)}...`,
        category: 'transaction',
      },
    });

    await db.withdrawalRequest.update({
      where: { id: withdrawalRequest.id },
      data: { transactionId: transaction.id },
    });

    try {
      const payout = await createMassPayout([
        { address, currency, amount: cryptoAmount },
      ]);

      await db.withdrawalRequest.update({
        where: { id: withdrawalRequest.id },
        data: { payoutId: payout.id, status: 'processing' },
      });

      balanceCache.invalidateCache(user.id);

      return NextResponse.json({
        success: true,
        withdrawalId: withdrawalRequest.id,
        payoutId: payout.id,
        amountInr: withdrawalRequest.amount,
        cryptoAmount,
      });
    } catch (payoutError) {
      console.error('[PAYOUT_ERROR]', payoutError);
      await db.$transaction([
        db.withdrawalRequest.update({
          where: { id: withdrawalRequest.id },
          data: { status: 'failed' },
        }),
        db.transaction.update({
          where: { id: transaction.id },
          data: { status: 'fail' },
        }),
      ]);
      balanceCache.invalidateCache(user.id);
      return new NextResponse('Payout failed', { status: 500 });
    }
  } catch (error) {
    console.error('[WITHDRAWAL_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}