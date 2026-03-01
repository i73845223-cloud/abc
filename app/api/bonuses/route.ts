import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [bonuses, totalCount] = await Promise.all([
      db.bonus.findMany({
        where: { userId: user.id },
        include: {
          promoCode: {
            select: { 
              code: true, 
              description: true,
              type: true,
              bonusPercentage: true,
              maxBonusAmount: true,
              minDepositAmount: true,
              freeSpinsCount: true,
              freeSpinsGame: true,
              cashbackPercentage: true,
              wageringRequirement: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.bonus.count({
        where: { userId: user.id }
      })
    ]);

    const realActiveBonuses = await db.bonus.aggregate({
      where: { 
        userId: user.id,
        status: 'PENDING_WAGERING',
        OR: [
          { type: { not: 'DEPOSIT_BONUS' } },
          { 
            type: 'DEPOSIT_BONUS',
            bonusAmount: { gt: 1 } 
          }
        ]
      },
      _sum: { 
        remainingAmount: true,
        freeSpinsWinnings: true
      }
    });

    const totalRemaining = (realActiveBonuses._sum.remainingAmount?.toNumber() || 0) + 
                          (realActiveBonuses._sum.freeSpinsWinnings?.toNumber() || 0);

    const activeBonusesCount = await db.bonus.count({
      where: { 
        userId: user.id,
        status: { in: ['PENDING_WAGERING', 'PENDING_ACTIVATION'] }
      }
    });

    const pendingActivationCount = await db.bonus.count({
      where: { 
        userId: user.id,
        type: 'DEPOSIT_BONUS',
        status: 'PENDING_ACTIVATION'
      }
    });

    return NextResponse.json({ 
      bonuses,
      summary: {
        totalRemaining,
        activeCount: activeBonusesCount,
        pendingActivationCount
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.log('[BONUSES_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}