import { db } from '@/lib/db';
import { Prisma, PromoCodeType, BonusStatus } from '@prisma/client';

interface CreateBonusParams {
  userId: string;
  promoCodeId: string;
  type: PromoCodeType;
  wageringRequirement?: number | null;
  bonusPercentage?: number | null;
  maxBonusAmount?: Prisma.Decimal | null;
  minDepositAmount?: Prisma.Decimal | null;
  freeSpinsCount?: number | null;
  freeSpinsGame?: string | null;
  cashbackPercentage?: number | null;
  expiresAt?: Date;
}

export async function createBonusFromPromoCode(params: CreateBonusParams) {
  const {
    userId,
    promoCodeId,
    type,
    wageringRequirement = 0,
    bonusPercentage,
    maxBonusAmount,
    minDepositAmount,
    freeSpinsCount,
    freeSpinsGame,
    cashbackPercentage,
  } = params;

  const expiresAt = params.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (type === 'DEPOSIT_BONUS' || type === 'COMBINED') {
    return db.bonus.create({
      data: {
        userId,
        promoCodeId,
        amount: 0,
        bonusAmount: 0,
        remainingAmount: 0,
        wageringRequirement: wageringRequirement || 0,
        totalWagered: 0,
        withdrawnAmount: 0,
        type,
        status: BonusStatus.PENDING_ACTIVATION,
        expiresAt,
      },
    });
  }

  const baseData = {
    userId,
    promoCodeId,
    amount: 0,
    bonusAmount: 0,
    remainingAmount: 0,
    wageringRequirement: wageringRequirement || 0,
    totalWagered: 0,
    withdrawnAmount: 0,
    type,
    status: BonusStatus.PENDING_WAGERING,
    expiresAt,
  };

  switch (type) {
    case 'FREE_SPINS':
      return db.bonus.create({
        data: {
          ...baseData,
          freeSpinsCount,
          freeSpinsGame,
          freeSpinsUsed: 0,
          freeSpinsWinnings: 0,
        },
      });
    case 'CASHBACK':
      return db.bonus.create({
        data: {
          ...baseData,
          cashbackPercentage,
        },
      });
    case 'FREE_BET':
      return db.bonus.create({
        data: {
          ...baseData,
          bonusAmount: maxBonusAmount || 0,
          remainingAmount: maxBonusAmount || 0,
        },
      });
    default:
      return db.bonus.create({
        data: baseData,
      });
  }
}