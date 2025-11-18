import { db } from '@/lib/db';

export async function updateBonusWagering(betAmount: number, userId: string) {
  try {
    const activeBonuses = await db.bonus.findMany({
      where: {
        userId: userId,
        status: 'PENDING_WAGERING',
        OR: [
          { remainingAmount: { gt: 0 } },
          { freeSpinsWinnings: { gt: 0 } }
        ]
      }
    });

    for (const bonus of activeBonuses) {
      const wageringRequirement = bonus.wageringRequirement;
      const completedWagering = parseFloat(bonus.completedWagering.toString());
      const totalWagered = parseFloat(bonus.totalWagered.toString());
      const bonusAmount = parseFloat(bonus.bonusAmount.toString());
      
      const requiredWagering = bonusAmount * wageringRequirement;

      if (completedWagering < requiredWagering) {
        const newTotalWagered = totalWagered + betAmount;
        const newCompletedWagering = Math.min(completedWagering + betAmount, requiredWagering);
        
        const isWageringComplete = newCompletedWagering >= requiredWagering;

        await db.bonus.update({
          where: { id: bonus.id },
          data: {
            completedWagering: newCompletedWagering,
            totalWagered: newTotalWagered,
            status: isWageringComplete ? 'COMPLETED' : 'PENDING_WAGERING'
          }
        });

        if (isWageringComplete) {
          console.log(`Bonus ${bonus.id} wagering completed for user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error updating bonus wagering:', error);
  }
}