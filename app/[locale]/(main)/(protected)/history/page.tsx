import { currentUser } from '@/lib/auth';
import { HistoryPageClient } from './components/history-page-client';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { formatter } from '@/lib/utils';
import { SlotTransactionColumn } from './components/columns';

const SlotTransactionsPage = async () => {
  const user = await currentUser();
  const userImage = user?.image;
  const userId = user?.id;
  const isBlocked = user?.isBlocked ?? false;

  let slotTransactions: SlotTransactionColumn[] = [];
  
  if (userId) {
    const transactions = await db.transaction.findMany({
      where: {
        userId: userId,
        NOT: [
          { 
            OR: [
              { category: "transaction" },
              { 
                description: {
                  contains: "Commission",
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const timeZone = 'Asia/Kolkata';
    slotTransactions = transactions.map((item) => {
      const zonedTime = toZonedTime(item.createdAt, timeZone);
      return {
        id: item.id,
        amount: `${item.type === 'deposit' ? '+' : '-'} ${formatter.format(Number(item.amount))}`,
        status: item.status,
        type: item.type,
        createdAt: format(zonedTime, 'dd MMM yyyy HH:mm'),
        description: item.description || '',
        rawAmount: Number(item.amount),
      };
    });
  }
  
  if (!user) {
    return <HistoryPageClient showAuthRequired isBlocked={false} />;
  }
  
  // if (user?.isImageApproved === "success") {
  //   return (
  //     <HistoryPageClient 
  //       showHistory 
  //       isBlocked={isBlocked} 
  //       slotTransactions={slotTransactions}
  //     />
  //   );
  // }

  // if (user?.isImageApproved === "pending") {
  //   return <HistoryPageClient showVerificationPending isBlocked={isBlocked} />;
  // }

  return (
    <HistoryPageClient 
      showHistory 
      userImage={userImage}
      userId={userId}
      isBlocked={isBlocked}
      slotTransactions={slotTransactions}
    />
  );
};

export default SlotTransactionsPage;