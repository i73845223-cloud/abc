import { auth } from '@/auth';
import { WithdrawalPage } from '../components/withdrawal-page';
import { db } from '@/lib/db';
import { calculateTotalBalance } from '@/lib/balance';

export default async function Page() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <WithdrawalPage showAuthRequired />;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        surname: true,
        birth: true,
        city: true,
        email: true,
        isBlocked: true,
        isImageApproved: true,
        image: {
          select: {
            id: true,
            url: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!user) {
      return <WithdrawalPage showAuthRequired />;
    }

    // Fetch user's transactions to calculate balance
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      select: {
        amount: true,
        type: true,
        status: true,
      },
    });

    const balanceInfo = calculateTotalBalance(transactions);
    const userBalance = balanceInfo.available;

    const userProfile = {
      name: user.name,
      surname: user.surname,
      birth: user.birth ? user.birth.toISOString().split('T')[0] : null,
      city: user.city,
      email: user.email,
    };

    const userImage = user.image ? {
      id: user.image.id,
      userId: user.id,
      url: user.image.url,
      createdAt: user.image.createdAt,
      updatedAt: user.image.updatedAt,
    } : null;

    return (
      <WithdrawalPage
        userProfile={userProfile}
        userImage={userImage}
        userImageStatus={user.isImageApproved}
        userId={user.id}
        isBlocked={user.isBlocked}
        userBalance={userBalance}
      />
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return <WithdrawalPage showAuthRequired />;
  }
}

export const dynamic = 'force-dynamic';