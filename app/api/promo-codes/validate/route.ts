import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    const existingUserPromoCode = await db.userPromoCode.findFirst({
      where: { userId: user.id },
      include: { promoCode: true }
    });

    if (existingUserPromoCode) {
      return NextResponse.json(
        { error: `You have already used promo code: ${existingUserPromoCode.promoCode.code}. Only one promo code per account is allowed.` },
        { status: 400 }
      );
    }

    const promoCode = await db.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: "Invalid or expired promo code" },
        { status: 400 }
      );
    }

    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return NextResponse.json(
        { error: "Promo code has reached maximum uses" },
        { status: 400 }
      );
    }

    const userPromoCodeCheck = await db.userPromoCode.findFirst({
      where: { 
        userId: user.id,
        promoCodeId: promoCode.id 
      }
    });

    if (userPromoCodeCheck) {
      return NextResponse.json(
        { error: "You have already used this promo code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: {
        code: promoCode.code,
        type: promoCode.type,
        description: promoCode.description,
        bonusPercentage: promoCode.bonusPercentage,
        maxBonusAmount: promoCode.maxBonusAmount,
        minDepositAmount: promoCode.minDepositAmount,
        freeSpinsCount: promoCode.freeSpinsCount,
        freeSpinsGame: promoCode.freeSpinsGame,
        cashbackPercentage: promoCode.cashbackPercentage,
        wageringRequirement: promoCode.wageringRequirement
      },
      message: "Promo code is valid"
    });

  } catch (error: any) {
    console.log('[PROMO_CODE_VALIDATE]', error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 400 }
    );
  }
}