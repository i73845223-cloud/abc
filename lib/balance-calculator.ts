import { db } from '@/lib/db';

export async function calculateUserBalance(userId: string) {
  const successful = await db.transaction.findMany({
    where: { userId, status: 'success' },
    select: { type: true, amount: true }
  });

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  successful.forEach(tx => {
    const amount = Number(tx.amount);
    if (tx.type === 'deposit') totalDeposits += amount;
    else if (tx.type === 'withdrawal') totalWithdrawals += amount;
  });

  const pendingWithdrawalsAgg = await db.transaction.aggregate({
    where: { userId, type: 'withdrawal', status: 'pending' },
    _sum: { amount: true }
  });
  const pendingWithdrawals = Number(pendingWithdrawalsAgg._sum.amount) || 0;

  return totalDeposits - totalWithdrawals - pendingWithdrawals;
}

export async function calculateDetailedBalance(userId: string) {
  const [successful, pending] = await Promise.all([
    db.transaction.aggregate({
      where: { userId, status: 'success' },
      _sum: { amount: true }
    }),
    db.transaction.groupBy({
      by: ['type'],
      where: { userId, status: 'pending' },
      _sum: { amount: true }
    })
  ]);

  const available = Number(successful._sum.amount) || 0;
  const pendingDeposits = Number(pending.find(p => p.type === 'deposit')?._sum.amount) || 0;
  const pendingWithdrawals = Number(pending.find(p => p.type === 'withdrawal')?._sum.amount) || 0;

  return {
    available,                 
    pendingDeposits,
    pendingWithdrawals,
    effective: available - pendingWithdrawals,
    netPending: pendingDeposits - pendingWithdrawals
  };
}