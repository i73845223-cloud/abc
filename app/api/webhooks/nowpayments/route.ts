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

    // Update crypto payment status (outside transaction, it's just logging)
    await db.cryptoPayment.update({
      where: { id: cryptoPayment.id },
      data: { status: mapNowPaymentsStatus(payment_status) },
    });

    // Handle finished status – update transaction and activate bonuses in a transaction
    if (payment_status === 'finished' && cryptoPayment.transactionId) {
      const transactionId = cryptoPayment.transactionId;

      // Use a transaction to ensure consistency
      await db.$transaction(async (tx) => {
        // Update the deposit transaction to success
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: TransactionStatus.success },
        });

        // Activate any pending deposit bonuses
        await activateDepositBonuses(tx, cryptoPayment.userId, Number(cryptoPayment.baseAmount));
      });

      // Invalidate cache after successful transaction
      BalanceCache.getInstance().invalidateCache(cryptoPayment.userId);
      console.log(`Deposit succeeded for user ${cryptoPayment.userId}`);
    }

    // Handle failed/expired – only update transaction, no bonuses
    if ((payment_status === 'failed' || payment_status === 'expired') && cryptoPayment.transactionId) {
      const transactionId = cryptoPayment.transactionId;
      await db.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.fail },
      });
      BalanceCache.getInstance().invalidateCache(cryptoPayment.userId);
      console.log(`Deposit failed for user ${cryptoPayment.userId}`);
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

/**
 * Activate deposit bonuses for a user after a successful deposit.
 * This function is meant to be called within a database transaction.
 */
async function activateDepositBonuses(tx: any, userId: string, depositAmount: number) {
  console.log(`[BONUS_ACTIVATION] Checking for user ${userId} with deposit ${depositAmount}`);

  // Find all pending activation bonuses that are deposit-based
  const pendingBonuses = await tx.bonus.findMany({
    where: {
      userId,
      type: { in: ['DEPOSIT_BONUS', 'COMBINED'] },
      status: 'PENDING_ACTIVATION',
    },
    include: { promoCode: true },
  });

  console.log(`[BONUS_ACTIVATION] Found ${pendingBonuses.length} pending bonuses`);

  for (const bonus of pendingBonuses) {
    console.log(`[BONUS_ACTIVATION] Processing bonus ${bonus.id} with promo code ${bonus.promoCode?.code}`);

    const minDepositAmount = bonus.promoCode?.minDepositAmount?.toNumber() || 0;
    const bonusPercentage = bonus.promoCode?.bonusPercentage || 0;
    const maxBonusAmount = bonus.promoCode?.maxBonusAmount?.toNumber() || 0;

    console.log(`[BONUS_ACTIVATION] minDeposit: ${minDepositAmount}, bonus%: ${bonusPercentage}, max: ${maxBonusAmount}`);

    if (depositAmount >= minDepositAmount) {
      let bonusAmount = depositAmount * (bonusPercentage / 100);
      if (maxBonusAmount > 0 && bonusAmount > maxBonusAmount) {
        bonusAmount = maxBonusAmount;
      }

      console.log(`[BONUS_ACTIVATION] Calculated bonus amount: ${bonusAmount}`);

      // Update the bonus record
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

      // Create a transaction for the bonus credit and link it to the bonus
      const created = await tx.transaction.create({
        data: {
          userId,
          type: 'deposit',
          amount: bonusAmount,
          status: 'success',
          description: `Bonus credit from ${bonus.promoCode?.code || 'promo code'}`,
          category: 'bonus',
          bonusId: bonus.id, // 👈 critical: establish relation
        },
      });

      console.log(`[BONUS_ACTIVATION] Created transaction ${created.id} with bonusId ${created.bonusId}`);
    } else {
      console.log(`[BONUS_ACTIVATION] Deposit amount ${depositAmount} is less than minimum ${minDepositAmount}, skipping`);
    }
  }
}