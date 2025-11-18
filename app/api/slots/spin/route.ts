import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BalanceCache } from '@/lib/cached-balance';

export async function POST(request: Request) {
  let userId: string | null = null;

  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    userId = user.id;

    const { betAmount, winAmount } = await request.json();

    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
      return new NextResponse("Invalid bet amount", { status: 400 });
    }

    if (typeof winAmount !== 'number' || winAmount < 0) {
      return new NextResponse("Invalid win amount", { status: 400 });
    }

    const balanceCache = BalanceCache.getInstance();
    const currentBalance = await balanceCache.getBalance(userId);

    if (currentBalance < betAmount) {
      return new NextResponse("Insufficient funds", { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId: userId!,
          amount: betAmount,
          type: 'withdrawal',
          description: 'Slot machine spin',
          category: 'slots',
          status: 'success'
        }
      });

      if (winAmount > 0) {
        await tx.transaction.create({
          data: {
            userId: userId!,
            amount: winAmount,
            type: 'deposit',
            description: 'Slot machine win',
            category: 'slots',
            status: 'success'
          }
        });
      }

      await balanceCache.updateBalance(userId!, betAmount, 'withdrawal');
      if (winAmount > 0) {
        await balanceCache.updateBalance(userId!, winAmount, 'deposit');
      }

      const newBalance = await balanceCache.getBalance(userId!);

      return {
        success: true,
        newBalance,
        betAmount,
        winAmount
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing spin:', error);
    
    if (userId) {
      const balanceCache = BalanceCache.getInstance();
      balanceCache.invalidateCache(userId);
    }
    
    return new NextResponse("Internal error", { status: 500 });
  }
}