import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { createTransactionWithCommissions } from '@/lib/commission-processor';
import { BalanceCache } from '@/lib/cached-balance';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where: { 
          userId: user.id,
          OR: [
            { description: { contains: 'deposit' } },
            { description: { contains: 'withdrawal' } },
            { category: 'transaction' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      db.transaction.count({
        where: { 
          userId: user.id,
          OR: [
            { description: { contains: 'deposit' } },
            { description: { contains: 'withdrawal' } },
            { category: 'transaction' }
          ]
        }
      })
    ]);

    const balanceCache = BalanceCache.getInstance();
    const availableBalance = await balanceCache.getBalance(user.id);
    
    const pendingTransactions = await db.transaction.findMany({
      where: { 
        userId: user.id,
        status: 'pending'
      }
    });

    let netPending = 0;
    pendingTransactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      netPending += transaction.type === 'deposit' ? amount : -amount;
    });

    return NextResponse.json({ 
      transactions,
      balance: {
        available: availableBalance,
        netPending, 
        effective: availableBalance + netPending
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.log('[TRANSACTIONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { amount, type, description, category } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    if (type === 'withdrawal') {
      const balanceCache = BalanceCache.getInstance();
      const currentBalance = await balanceCache.getBalance(user.id);
      
      if (currentBalance < amount) {
        return new NextResponse("Insufficient funds", { status: 400 });
      }
    }

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await createTransactionWithCommissions(
        user.id,
        amount,
        type,
        description || `${type} transaction`,
        category || (type === 'withdrawal' ? 'withdrawal' : 'deposit')
      );

      if (type === 'deposit' && category === 'transaction') {
        const pendingDepositBonuses = await tx.bonus.findMany({
          where: {
            userId: user.id,
            type: { in: ['DEPOSIT_BONUS', 'COMBINED'] },
            status: 'PENDING_ACTIVATION'
          },
          include: {
            promoCode: true
          }
        });

        for (const bonus of pendingDepositBonuses) {
          const depositAmount = amount;
          const minDepositAmount = bonus.promoCode?.minDepositAmount?.toNumber() || 0;
          
          if (depositAmount >= minDepositAmount) {
            const bonusPercentage = bonus.promoCode?.bonusPercentage || 0;
            const maxBonusAmount = bonus.promoCode?.maxBonusAmount?.toNumber() || 0;
            
            let bonusAmount = depositAmount * (bonusPercentage / 100);
            
            if (maxBonusAmount > 0 && bonusAmount > maxBonusAmount) {
              bonusAmount = maxBonusAmount;
            }

            await tx.bonus.update({
              where: { id: bonus.id },
              data: {
                amount: depositAmount,
                bonusAmount: bonusAmount,
                remainingAmount: bonusAmount,
                status: 'PENDING_WAGERING',
                activatedAt: new Date()
              }
            });

            await tx.transaction.create({
              data: {
                userId: user.id,
                type: 'deposit',
                amount: bonusAmount,
                status: 'success',
                description: `Bonus credit from ${bonus.promoCode?.code || 'promo code'}`,
                category: 'bonus'
              }
            });
          }
        }
      }

      return newTransaction;
    });

    const balanceCache = BalanceCache.getInstance();
    balanceCache.invalidateCache(user.id);

    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[TRANSACTIONS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}