import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BalanceCache } from '@/lib/cached-balance';
import { updateBonusWagering } from '@/lib/bonus-wagering';

export async function POST(request: Request) {
  let userId: string | null = null;
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse('Unauthorized', { status: 401 });

    userId = user.id;
    const { totalWinnings, multiplier, transactionId } = await request.json();

    if (!totalWinnings || typeof totalWinnings !== 'number' || totalWinnings <= 0) {
      return new NextResponse('Invalid winnings', { status: 400 });
    }
    if (!transactionId) return new NextResponse('Missing transactionId', { status: 400 });

    const balanceCache = BalanceCache.getInstance();

    const result = await db.$transaction(async (tx) => {
      const betTransaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!betTransaction || betTransaction.userId !== userId || betTransaction.status !== 'pending') {
        throw new Error('Invalid bet transaction');
      }

      const betAmount = Number(betTransaction.amount);

      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'success' },
      });

      await balanceCache.updateBalance(userId, betAmount, 'withdrawal');

      const winTx = await tx.transaction.create({
        data: {
          userId,
          amount: totalWinnings,
          type: 'deposit',
          status: 'success',
          description: `Aviator cashout @ ${multiplier.toFixed(2)}x`,
          category: 'aviator',
        },
      });

      await balanceCache.updateBalance(userId, totalWinnings, 'deposit');

      const userPromo = await tx.userPromoCode.findFirst({
        where: { userId },
        include: { promoCode: { include: { assignedUser: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const promoCode = userPromo?.promoCode;
      if (promoCode?.assignedUserId && promoCode.assignedUser && promoCode.commissionPercentage && promoCode.commissionPercentage > 0) {
        const commissionAmount = totalWinnings * (promoCode.commissionPercentage / 100);
        await tx.influencerEarning.create({
          data: {
            amount: commissionAmount,
            description: `${promoCode.commissionPercentage}% commission from Aviator cashout`,
            type: 'DEPOSIT_COMMISSION',
            influencerId: promoCode.assignedUserId,
            sourceUserId: userId,
            withdrawalId: winTx.id,
            promoCodeId: promoCode.id,
          },
        });
        await tx.transaction.create({
          data: {
            userId: promoCode.assignedUserId,
            amount: commissionAmount,
            type: 'deposit',
            status: 'success',
            description: `Commission from Aviator cashout`,
            category: 'commission',
          },
        });
        const inflBalanceCache = BalanceCache.getInstance();
        await inflBalanceCache.invalidateCache(promoCode.assignedUserId);
      }

      const newBalance = await balanceCache.getBalance(userId);
      return { success: true, newBalance };
    });

    try {
      await updateBonusWagering(totalWinnings, userId);
    } catch (wageringError) {
      console.error('Bonus wagering error:', wageringError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CASHOUT_ERROR]', error);
    if (userId) {
      const balanceCache = BalanceCache.getInstance();
      balanceCache.invalidateCache(userId);
    }
    return new NextResponse('Internal error', { status: 500 });
  }
}