import { db } from '@/lib/db';

export async function processWithdrawalCommissions(userId: string, withdrawalId: string, amount: number, category: string) {
  if (category === 'transaction') {
    return;
  }

  try {
    const userPromoCodes = await db.userPromoCode.findMany({
      where: { userId },
      include: {
        promoCode: {
          include: {
            assignedUser: true
          }
        }
      }
    });

    for (const userPromoCode of userPromoCodes) {
      const promoCode = userPromoCode.promoCode;
      if (promoCode.assignedUserId && promoCode.assignedUser && promoCode.commissionPercentage) {
        
        const commissionAmount = amount * (promoCode.commissionPercentage / 100);

        await db.influencerEarning.create({
          data: {
            amount: commissionAmount,
            description: `${promoCode.commissionPercentage}% commission from withdrawal via promo code ${promoCode.code}`,
            type: 'WITHDRAWAL_COMMISSION',
            influencerId: promoCode.assignedUserId,
            sourceUserId: userId,
            withdrawalId: withdrawalId,
            promoCodeId: promoCode.id
          }
        });

        await db.transaction.create({
          data: {
            userId: promoCode.assignedUserId,
            amount: commissionAmount,
            type: 'deposit',
            status: 'success',
            description: `Commission from withdrawal via ${promoCode.code}`,
            category: 'commission'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error processing withdrawal commissions:', error);
    throw error;
  }
}