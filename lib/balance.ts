export function calculateBalance(transactions: any[]): number {
  return transactions.reduce((sum, transaction) => {
    if (transaction.status !== 'success') {
      return sum
    }

    const amount = transaction.amount.toNumber ? transaction.amount.toNumber() : Number(transaction.amount)
    
    if (transaction.type === 'deposit') {
      return sum + amount
    } else if (transaction.type === 'withdrawal') {
      return sum - amount
    }
    return sum
  }, 0)
}

export function calculateTotalBalance(transactions: any[]): {
  available: number
  pending: number
  total: number
} {
  let available = 0
  let pending = 0

  transactions.forEach(transaction => {
    const amount = transaction.amount.toNumber ? transaction.amount.toNumber() : Number(transaction.amount)
    
    if (transaction.status === 'success') {
      if (transaction.type === 'deposit') {
        available += amount
      } else if (transaction.type === 'withdrawal') {
        available -= amount
      }
    } else if (transaction.status === 'pending') {
      if (transaction.type === 'deposit') {
        pending += amount
      }
    }
  })

  return {
    available,
    pending,
    total: available + pending
  }
}