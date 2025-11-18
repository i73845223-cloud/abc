"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatter } from '@/lib/utils';

export const useBalance = () => {
  const [balance, setBalance] = useState<{
    available: number;
    netPending: number;
    effective: number;
  } | null>(null);
  
  const [formattedBalance, setFormattedBalance] = useState<string>('Loading...');
  const { data: session, status } = useSession();

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch balance');
      
      const data = await response.json();
      setBalance(data.balance);
      
      let displayText = formatter.format(data.balance.available);
      
      setFormattedBalance(displayText);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance({
        available: 0,
        netPending: 0,
        effective: 0
      });
      setFormattedBalance(formatter.format(0));
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBalance();
      
      const interval = setInterval(fetchBalance, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'balance-update' && e.newValue) {
        fetchBalance();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { 
    balance, 
    formattedBalance, 
    availableBalance: balance?.available ?? 0,
    pendingAmount: balance?.netPending ?? 0,
    isLoading: balance === null,
    refreshBalance: fetchBalance 
  };
};