import { calculateUserBalance } from './balance-calculator'

export class BalanceCache {
  private static instance: BalanceCache
  private cache: Map<string, { balance: number; lastUpdated: number }> = new Map()
  private readonly CACHE_TTL = 3000

  private constructor() {}

  static getInstance(): BalanceCache {
    if (!BalanceCache.instance) {
      BalanceCache.instance = new BalanceCache()
    }
    return BalanceCache.instance
  }

  async getBalance(userId: string): Promise<number> {
    const cached = this.cache.get(userId)
    
    if (cached && Date.now() - cached.lastUpdated < this.CACHE_TTL) {
      return cached.balance
    }

    const balance = await calculateUserBalance(userId)
    this.cache.set(userId, { balance, lastUpdated: Date.now() })
    return balance
  }

  async updateBalance(userId: string, amount: number, type: 'deposit' | 'withdrawal'): Promise<number> {
    const currentBalance = await this.getBalance(userId)
    let newBalance = currentBalance

    if (type === 'deposit') {
      newBalance = currentBalance + amount
    } else if (type === 'withdrawal') {
      newBalance = currentBalance - amount
    }

    this.cache.set(userId, { balance: newBalance, lastUpdated: Date.now() })
    return newBalance
  }

  invalidateCache(userId: string): void {
    this.cache.delete(userId)
  }
}