'use client';

import { useTranslations } from 'next-intl';
import { SlotTransactionColumn } from './columns';
import { Transactions } from './transactions';

interface SlotsListClientProps {
  isBlocked: boolean;
  slotTransactions: SlotTransactionColumn[];
}

export function SlotsListClient({ isBlocked, slotTransactions }: SlotsListClientProps) {
  const t = useTranslations('SlotTransactions');

  return (
    <div className="sm:container px-1 m:py-6 space-y-6 pb-[60px] lg:pb-0">
      <Transactions 
        data={slotTransactions} 
        isBlocked={isBlocked}
      />
    </div>
  );
}