import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const { transactionId } = await req.json();
    if (!transactionId) return new NextResponse('Missing transactionId', { status: 400 });

    const transaction = await db.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction || transaction.userId !== user.id || transaction.status !== 'pending') {
      return new NextResponse('Invalid transaction', { status: 400 });
    }

    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'fail' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BET_CANCEL_ERROR]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}