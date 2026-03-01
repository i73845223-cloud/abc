import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BalanceCache } from '@/lib/cached-balance';

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bonusId, amount } = await request.json();

    if (!bonusId || amount !== 'full') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const bonus = await db.bonus.findUnique({
      where: { id: bonusId },
      include: { 
        user: true,
        promoCode: true
      }
    });

    if (!bonus) {
      return NextResponse.json({ error: 'Bonus not found' }, { status: 404 });
    }

    if (bonus.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const completedWagering = bonus.completedWagering?.toNumber() || 0;
    const bonusAmount = bonus.bonusAmount?.toNumber() || 0;
    const wageringReq = bonus.wageringRequirement || 0;
    const requiredWagering = bonusAmount * wageringReq;

    const isWageringComplete = completedWagering >= requiredWagering;
    const canWithdraw = bonus.status === 'COMPLETED' || (bonus.status === 'PENDING_WAGERING' && isWageringComplete);

    if (!canWithdraw) {
      return NextResponse.json({ error: 'Bonus cannot be withdrawn yet' }, { status: 400 });
    }

    const remainingAmount = bonus.remainingAmount?.toNumber() || 0;
    const freeSpinsWinnings = bonus.freeSpinsWinnings?.toNumber() || 0;
    const totalWithdrawable = remainingAmount + freeSpinsWinnings;

    if (totalWithdrawable <= 0) {
      return NextResponse.json({ error: 'No funds to withdraw' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'deposit',
          amount: totalWithdrawable,
          status: 'success',
          description: `Bonus withdrawal from ${bonus.promoCode?.code || 'bonus'}`,
          category: 'bonus_withdrawal',
          bonusId: bonus.id
        }
      });

      await tx.bonus.update({
        where: { id: bonus.id },
        data: {
          remainingAmount: 0,
          freeSpinsWinnings: 0,
        }
      });

      return transaction;
    });

    BalanceCache.getInstance().invalidateCache(user.id);

    return NextResponse.json({ 
      success: true, 
      transactionId: result.id,
      amount: totalWithdrawable
    });

  } catch (error) {
    console.error('[BONUS_WITHDRAWAL_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}