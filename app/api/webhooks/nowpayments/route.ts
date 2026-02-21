import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { BalanceCache } from '@/lib/cached-balance';
import { CryptoPaymentStatus, TransactionStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-nowpayments-sig');

    const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET!);
    const digest = hmac.update(body).digest('hex');
    if (signature !== digest) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const data = JSON.parse(body);
    const { payment_id, payment_status } = data;

    const paymentIdStr = payment_id.toString();

    const cryptoPayment = await db.cryptoPayment.findUnique({
      where: { paymentId: paymentIdStr },
      include: { transaction: true },
    });

    if (!cryptoPayment) {
      return new NextResponse('Payment not found', { status: 404 });
    }

    await db.cryptoPayment.update({
      where: { id: cryptoPayment.id },
      data: { status: mapNowPaymentsStatus(payment_status) },
    });

    if (cryptoPayment.transactionId) {
      if (payment_status === 'finished' && cryptoPayment.transaction?.status !== TransactionStatus.success) {
        await db.transaction.update({
          where: { id: cryptoPayment.transactionId },
          data: { status: TransactionStatus.success },
        });

        await activateDepositBonuses(db, cryptoPayment.userId, Number(cryptoPayment.baseAmount));
        BalanceCache.getInstance().invalidateCache(cryptoPayment.userId);
        console.log(`Deposit succeeded for user ${cryptoPayment.userId}`);
      }

      if ((payment_status === 'failed' || payment_status === 'expired') && cryptoPayment.transaction?.status !== TransactionStatus.fail) {
        await db.transaction.update({
          where: { id: cryptoPayment.transactionId },
          data: { status: TransactionStatus.fail },
        });

        BalanceCache.getInstance().invalidateCache(cryptoPayment.userId);
        console.log(`Deposit failed for user ${cryptoPayment.userId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK_NOWPAYMENTS]', error);
    return new NextResponse('Webhook error', { status: 500 });
  }
}

function mapNowPaymentsStatus(npStatus: string): CryptoPaymentStatus {
  switch (npStatus) {
    case 'waiting': return CryptoPaymentStatus.PENDING;
    case 'confirming': return CryptoPaymentStatus.CONFIRMING;
    case 'confirmed': return CryptoPaymentStatus.CONFIRMED;
    case 'finished': return CryptoPaymentStatus.FINISHED;
    case 'failed': return CryptoPaymentStatus.FAILED;
    case 'expired': return CryptoPaymentStatus.EXPIRED;
    default: return CryptoPaymentStatus.PENDING;
  }
}

async function activateDepositBonuses(tx: any, userId: string, depositAmount: number) {
  const pendingDepositBonuses = await tx.bonus.findMany({
    where: {
      userId,
      type: { in: ['DEPOSIT_BONUS', 'COMBINED'] },
      status: 'PENDING_ACTIVATION',
    },
    include: { promoCode: true },
  });

  for (const bonus of pendingDepositBonuses) {
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
          bonusAmount,
          remainingAmount: bonusAmount,
          status: 'PENDING_WAGERING',
          activatedAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'deposit',
          amount: bonusAmount,
          status: 'success',
          description: `Bonus credit from ${bonus.promoCode?.code || 'promo code'}`,
          category: 'bonus',
        },
      });
    }
  }
}