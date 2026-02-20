export function calculateBalance(transactions: any[]): number {
  return transactions.reduce((sum, transaction) => {
    if (transaction.status !== 'success') return sum;

    const amount = transaction.amount.toNumber ? transaction.amount.toNumber() : Number(transaction.amount);

    if (transaction.type === 'deposit') {
      return sum + amount;
    } else if (transaction.type === 'withdrawal') {
      return sum - amount;
    }
    return sum;
  }, 0);
}

export function calculateTotalBalance(transactions: any[]): {
  available: number;
  pending: number;
  total: number;
} {
  let successfulNet = 0;
  let pendingDeposits = 0;
  let pendingWithdrawals = 0;

  transactions.forEach((transaction) => {
    const amount = transaction.amount.toNumber ? transaction.amount.toNumber() : Number(transaction.amount);

    if (transaction.status === 'success') {
      if (transaction.type === 'deposit') {
        successfulNet += amount;
      } else if (transaction.type === 'withdrawal') {
        successfulNet -= amount;
      }
    } else if (transaction.status === 'pending') {
      if (transaction.type === 'deposit') {
        pendingDeposits += amount;
      } else if (transaction.type === 'withdrawal') {
        pendingWithdrawals += amount;
      }
    }
  });

  const available = successfulNet - pendingWithdrawals;
  const total = successfulNet + pendingDeposits;

  return {
    available,
    pending: pendingDeposits - pendingWithdrawals,
    total,
  };
}