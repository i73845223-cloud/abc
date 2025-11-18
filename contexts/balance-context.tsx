"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useBalance } from '@/hooks/use-balance';

interface BalanceContextType {
  refreshBalance: () => void;
  formattedBalance: string;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  const balance = useBalance();

  return (
    <BalanceContext.Provider value={balance}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalanceContext = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalanceContext must be used within a BalanceProvider');
  }
  return context;
};