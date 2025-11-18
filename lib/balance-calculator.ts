import { db } from '@/lib/db'

export async function calculateUserBalance(userId: string) {
  const transactions = await db.transaction.findMany({
    where: { 
      userId,
      status: 'success'
    }
  });

  const totalDeposits = transactions
    .filter((item) => item.type === 'deposit')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalWithdrawals = transactions
    .filter((item) => item.type === 'withdrawal')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return totalDeposits - totalWithdrawals;
}

export async function calculateDetailedBalance(userId: string) {
  const balanceAggregates = await db.transaction.groupBy({
    by: ['status', 'type'],
    where: { userId },
    _sum: { amount: true }
  });

  let availableBalance = 0;
  let netPending = 0;

  balanceAggregates.forEach(agg => {
    const amount = agg._sum.amount?.toNumber() || 0;
    
    if (agg.status === 'success') {
      availableBalance += agg.type === 'deposit' ? amount : -amount;
    } else if (agg.status === 'pending') {
      netPending += agg.type === 'deposit' ? amount : -amount;
    }
  });

  return {
    available: availableBalance,
    netPending, 
    effective: availableBalance + netPending
  };
}