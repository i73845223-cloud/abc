import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PromoPageClient } from './promo-page-client';

async function getUserPromoCode(userId: string) {
  return await db.userPromoCode.findFirst({
    where: { userId },
    include: {
      promoCode: true,
      user: {
        select: {
          bonuses: {
            where: {
              status: 'PENDING_WAGERING'
            },
            include: {
              promoCode: {
                select: { code: true, description: true }
              }
            }
          }
        }
      }
    }
  });
}

export default async function PromoCodePage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return <div>Please log in to access this page.</div>;
  }

  const userPromoCode = await getUserPromoCode(user.id);

  return (
    <PromoPageClient
      hasUsedPromoCode={!!userPromoCode}
      currentPromoCode={userPromoCode?.promoCode.code}
    />
  );
}