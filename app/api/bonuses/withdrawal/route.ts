import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { bonusId, amount } = await req.json();

    if (!bonusId || !amount) {
      return NextResponse.json(
        { error: "Bonus ID and amount are required" },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const bonus = await tx.bonus.findFirst({
        where: {
          id: bonusId,
          userId: user.id,
          status: 'PENDING_WAGERING',
        }
      });

      if (!bonus) {
        throw new Error("Bonus not found or not eligible for withdrawal");
      }

      const withdrawAmount = parseFloat(amount);
      const remainingAmount = parseFloat(bonus.remainingAmount.toString());

      if (withdrawAmount > remainingAmount) {
        throw new Error("Withdrawal amount exceeds available bonus funds");
      }

      if (withdrawAmount <= 0) {
        throw new Error("Withdrawal amount must be positive");
      }

      const newRemainingAmount = remainingAmount - withdrawAmount;
      const newWithdrawnAmount = parseFloat(bonus.withdrawnAmount.toString()) + withdrawAmount;

      const updatedBonus = await tx.bonus.update({
        where: { id: bonusId },
        data: {
          remainingAmount: newRemainingAmount,
          withdrawnAmount: newWithdrawnAmount,
          status: newRemainingAmount <= 0 ? 'COMPLETED' : 'PENDING_WAGERING',
        }
      });

      const withdrawalTransaction = await tx.transaction.create({
        data: {
          type: 'withdrawal',
          amount: withdrawAmount,
          status: 'success',
          description: `Bonus withdrawal from ${bonus.promoCodeId ? 'promo code' : 'bonus'}`,
          category: 'bonus_withdrawal',
          userId: user.id,
          history: {
            create: {
              status: 'success',
              note: `Withdrawn from bonus ${bonusId}`
            }
          }
        }
      });

      return { bonus: updatedBonus, transaction: withdrawalTransaction };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully withdrawn ${amount} from bonus`,
      bonus: result.bonus,
      transaction: result.transaction
    });

  } catch (error: any) {
    console.log('[BONUS_WITHDRAWAL]', error);
    return NextResponse.json(
      { error: error.message || "Withdrawal failed" },
      { status: 400 }
    );
  }
}