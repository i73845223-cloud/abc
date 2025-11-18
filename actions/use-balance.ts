'use client';

import { useState, useCallback, useEffect } from 'react';

export const useBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const response = await fetch('/api/balance');
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      const balanceValue = Number(data.balance) || 0;
      setBalance(balanceValue);
      return balanceValue;
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
      return 0;
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const updateBalance = useCallback(async (amount: number, type: 'deposit' | 'withdrawal', description?: string, category?: string) => {
    try {
      const response = await fetch('/api/transactions/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          type, 
          description: description || `Slot machine ${type}`,
          category: category || 'slots'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${type} ${amount}`);
      }
      
      const transaction = await response.json();
      
      await fetchBalance();
      
      return transaction;
    } catch (error) {
      console.error(`Error during ${type}:`, error);
      throw error;
    }
  }, [fetchBalance]);

  const processSpin = useCallback(async (betAmount: number, winAmount: number) => {
    try {
      const response = await fetch('/api/slots/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, winAmount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process spin');
      }
      
      const result = await response.json();
      
      setBalance(result.newBalance);
      
      return result;
    } catch (error) {
      console.error('Error processing spin:', error);
      await fetchBalance();
      throw error;
    }
  }, [fetchBalance]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayBalance(balance);
    }, 100);

    return () => clearTimeout(timeout);
  }, [balance]);

  return {
    balance,
    displayBalance,
    balanceLoading,
    getBalance: fetchBalance,
    updateUserBalance: updateBalance,
    processSpin
  };
};