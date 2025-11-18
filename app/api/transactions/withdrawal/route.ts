import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { processWithdrawalCommissions } from '@/lib/withdrawal-commission';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { amount, description, category = 'withdrawal' } = await req.json();

    if (!amount || amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const withdrawal = await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -amount,
          type: 'withdrawal',
          status: 'success',
          description: description || 'Withdrawal',
          category: category
        }
      });

      await processWithdrawalCommissions(user.id, withdrawal.id, amount, category);

      return { withdrawal };
    });

    return NextResponse.json({
      success: true,
      transaction: result.withdrawal,
      message: "Withdrawal processed successfully"
    });

  } catch (error) {
    console.log('[WITHDRAWAL_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}