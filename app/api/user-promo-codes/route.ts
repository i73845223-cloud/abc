import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const userPromoCodes = await db.userPromoCode.findMany({
      where: { userId: user.id },
      include: {
        promoCode: {
          select: {
            id: true,
            code: true,
            type: true,
            description: true,
            bonusPercentage: true,
            maxBonusAmount: true,
            minDepositAmount: true,
            freeSpinsCount: true,
            freeSpinsGame: true,
            cashbackPercentage: true,
            wageringRequirement: true
          }
        }
      }
    });

    return NextResponse.json(userPromoCodes);
  } catch (error) {
    console.log('[USER_PROMO_CODES_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}