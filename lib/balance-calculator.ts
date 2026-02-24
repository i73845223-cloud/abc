import { db } from '@/lib/db'

export async function calculateUserBalance(userId: string) {
  const [depositSum, withdrawalSum, pendingWithdrawals] = await Promise.all([
    db.transaction.aggregate({
      where: { userId, type: 'deposit', status: 'success' },
      _sum: { amount: true }
    }),
    db.transaction.aggregate({
      where: { userId, type: 'withdrawal', status: 'success' },
      _sum: { amount: true }
    }),
    db.transaction.aggregate({
      where: { userId, type: 'withdrawal', status: 'pending' },
      _sum: { amount: true }
    })
  ]);

  const totalDeposits = Number(depositSum._sum.amount) || 0;
  const totalWithdrawals = Number(withdrawalSum._sum.amount) || 0;
  const pending = Number(pendingWithdrawals._sum.amount) || 0;

  return totalDeposits - totalWithdrawals - pending;
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