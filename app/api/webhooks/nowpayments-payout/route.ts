import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { BalanceCache } from '@/lib/cached-balance';
import { TransactionStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-nowpayments-sig');

    const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET!);
    const digest = hmac.update(body).digest('hex');
    if (signature !== digest) {
      console.error('[PAYOUT_WEBHOOK] Invalid signature');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const data = JSON.parse(body);
    console.log('[PAYOUT_WEBHOOK] Received:', data);

    const { id, batch_withdrawal_id, status } = data;

    const withdrawal = await db.withdrawalRequest.findFirst({
      where: {
        OR: [
          { payoutId: id },
          { payoutId: batch_withdrawal_id },
        ],
      },
      include: { transaction: true },
    });

    if (!withdrawal) {
      console.log('[PAYOUT_WEBHOOK] Withdrawal not found for payout ID:', id || batch_withdrawal_id);
      return new NextResponse('Withdrawal not found', { status: 404 });
    }

    if (!withdrawal.transaction) {
      console.error(`[PAYOUT_WEBHOOK] No transaction linked to withdrawal ${withdrawal.id}`);
      return new NextResponse('Transaction not found', { status: 404 });
    }

    let newWithdrawalStatus = withdrawal.status;
    let newTransactionStatus = withdrawal.transaction.status;

    switch (status) {
      case 'finished':
        newWithdrawalStatus = 'completed';
        newTransactionStatus = TransactionStatus.success;
        break;
      case 'failed':
      case 'rejected':
        newWithdrawalStatus = 'failed';
        newTransactionStatus = TransactionStatus.fail;
        break;
      case 'processing':
      case 'sending':
        newWithdrawalStatus = 'processing';
        break;
      default:
        console.log(`[PAYOUT_WEBHOOK] Unhandled status: ${status}, leaving unchanged`);
        break;
    }

    if (newWithdrawalStatus !== withdrawal.status || newTransactionStatus !== withdrawal.transaction.status) {
      await db.$transaction([
        db.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: { status: newWithdrawalStatus },
        }),
        db.transaction.update({
          where: { id: withdrawal.transaction.id },
          data: { status: newTransactionStatus },
        }),
      ]);

      if (newWithdrawalStatus === 'completed' || newWithdrawalStatus === 'failed') {
        BalanceCache.getInstance().invalidateCache(withdrawal.userId);
      }

      console.log(`[PAYOUT_WEBHOOK] Updated withdrawal ${withdrawal.id} to ${newWithdrawalStatus} and transaction to ${newTransactionStatus}`);
    } else {
      console.log('[PAYOUT_WEBHOOK] No status change needed');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[PAYOUT_WEBHOOK_ERROR]', error);
    return new NextResponse('Webhook error', { status: 500 });
  }
}