import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BalanceCache } from '@/lib/cached-balance';
import { updateBonusWagering } from '@/lib/bonus-wagering';

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

    const userPromo = await db.userPromoCode.findFirst({
      where: { userId },
      include: {
        promoCode: {
          include: { assignedUser: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const promoCode = userPromo?.promoCode;
    const shouldAwardCommission =
      promoCode?.assignedUserId &&
      promoCode.assignedUser &&
      promoCode.commissionPercentage &&
      promoCode.commissionPercentage > 0;

    const result = await db.$transaction(async (tx) => {
      const betTransaction = await tx.transaction.create({
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

      if (shouldAwardCommission) {
        const commissionAmount = betAmount * (promoCode.commissionPercentage! / 100);

        await tx.influencerEarning.create({
          data: {
            amount: commissionAmount,
            description: `${promoCode.commissionPercentage}% commission from slots bet via ${promoCode.code}`,
            type: 'WITHDRAWAL_COMMISSION',
            influencerId: promoCode.assignedUserId!,
            sourceUserId: userId!,
            withdrawalId: betTransaction.id,
            promoCodeId: promoCode.id
          }
        });

        await tx.transaction.create({
          data: {
            userId: promoCode.assignedUserId!,
            amount: commissionAmount,
            type: 'deposit',
            status: 'success',
            description: `Commission from slots bet via ${promoCode.code}`,
            category: 'commission'
          }
        });

        const influencerBalanceCache = BalanceCache.getInstance();
        await influencerBalanceCache.invalidateCache(promoCode.assignedUserId!);
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

    try {
      await updateBonusWagering(betAmount, userId!);
    } catch (wageringError) {
      console.error('Error updating bonus wagering:', wageringError);
    }

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