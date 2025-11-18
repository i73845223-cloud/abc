import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { db } from '@/lib/db';
import { formatter } from '@/lib/utils';
import { TransactionColumn } from './columns';
import { Transactions } from './transactions';
import { getTranslations } from 'next-intl/server';

interface TransactionsServerWrapperProps {
  userId: string | undefined;
  isBlocked: boolean;
}

export const TransactionsServerWrapper = async ({ userId, isBlocked }: TransactionsServerWrapperProps) => {
  const timeZone = 'Asia/Kolkata';
  const t = await getTranslations('Transactions');

  try {
    const [transactions] = await Promise.all([
      db.transaction.findMany({
        where: {
          userId: userId,
          OR: [
            { category: 'transaction' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          createdAt: true,
          description: true,
          category: true
        }
      }),
    ]);

    const formattedTransactions: TransactionColumn[] = transactions.map((item) => {
      const zonedTime = toZonedTime(item.createdAt, timeZone);
      const amount = item.amount.toNumber ? item.amount.toNumber() : Number(item.amount);
      
      return {
        id: item.id,
        amount: `${item.type === 'deposit' ? '+' : '-'} ${formatter.format(amount)}`,
        status: item.status,
        type: item.type,
        createdAt: format(zonedTime, 'dd MMM yyyy HH:mm'),
        rawAmount: amount,
      };
    });

    return (
      <div className="sm:container px-1 mx-auto space-y-6 pb-[60px] lg:pb-0">
        <Transactions 
          data={formattedTransactions} 
          isBlocked={isBlocked}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading transactions:', error);
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-red-600">
          {t('loadFailed')}
        </div>
      </div>
    );
  }
};