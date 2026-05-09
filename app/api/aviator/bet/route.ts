// app/api/aviator/bet/route.ts
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BalanceCache } from '@/lib/cached-balance';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const { amount } = await req.json();
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new NextResponse('Invalid amount', { status: 400 });
    }

    const balanceCache = BalanceCache.getInstance();
    const availableBalance = await balanceCache.getBalance(user.id);
    // Optional: also subtract any existing pending bets from the same user
    // For simplicity we just check raw balance – later we'll add a local reserve
    if (availableBalance < amount) {
      return new NextResponse('Insufficient funds', { status: 400 });
    }

    // Create a pending withdrawal transaction
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        amount,
        type: 'withdrawal',
        status: 'pending',
        description: 'Aviator bet placement',
        category: 'aviator',
      },
    });

    return NextResponse.json({ transactionId: transaction.id, balance: availableBalance });
  } catch (error) {
    console.error('[BET_PLACE_ERROR]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}