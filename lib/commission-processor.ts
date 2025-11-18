import { db } from '@/lib/db';

export async function createTransactionWithCommissions(
  userId: string, 
  amount: number, 
  type: 'deposit' | 'withdrawal', 
  description: string, 
  category: string
) {
  return await db.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId,
        amount: amount,
        type,
        description,
        category,
        status: 'success'
      }
    });

    if (type === 'withdrawal' && category !== 'transaction') {
      
      const userPromoCodes = await tx.userPromoCode.findMany({
        where: { userId },
        include: {
          promoCode: {
            include: {
              assignedUser: true
            }
          }
        }
      });


      let commissionCount = 0;
      for (const userPromoCode of userPromoCodes) {
        const promoCode = userPromoCode.promoCode;
        
        if (promoCode.assignedUserId && promoCode.assignedUser && promoCode.commissionPercentage) {
          const commissionAmount = amount * (promoCode.commissionPercentage / 100);
          
          await tx.influencerEarning.create({
            data: {
              amount: commissionAmount,
              description: `${promoCode.commissionPercentage}% commission from ${category} withdrawal via ${promoCode.code}`,
              type: 'WITHDRAWAL_COMMISSION',
              influencerId: promoCode.assignedUserId,
              sourceUserId: userId,
              withdrawalId: transaction.id,
              promoCodeId: promoCode.id
            }
          });

          await tx.transaction.create({
            data: {
              userId: promoCode.assignedUserId,
              amount: commissionAmount,
              type: 'deposit',
              status: 'success',
              description: `Commission from ${category} withdrawal via ${promoCode.code}`,
              category: 'commission'
            }
          });

          commissionCount++;
        }
      }
    }

    return transaction;
  });
}