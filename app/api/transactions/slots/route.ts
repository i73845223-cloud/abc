import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { createTransactionWithCommissions } from '@/lib/commission-processor';
import { updateBonusWagering } from '@/lib/bonus-wagering';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        OR: [
          { description: { contains: 'slot' } },
          { description: { contains: 'spin' } },
          { description: { contains: 'win' } },
          { category: 'slots' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.log('[SLOT_TRANSACTIONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { amount, type, description, category = 'slots' } = await req.json();

    if (!amount || typeof amount !== 'number') {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    const transaction = await createTransactionWithCommissions(
      user.id,
      amount,
      type,
      description || `Slot machine ${type}`,
      category
    );

    if (category === 'slots' || description?.includes('spin')) {
      await updateBonusWagering(amount, user.id);
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[SLOT_TRANSACTIONS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}