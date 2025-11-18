import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params

    const bet = await db.bet.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        book: true,
        outcome: true,
        event: true
      }
    })

    if (!bet) {
      return new NextResponse("Bet not found", { status: 404 })
    }

    if (bet.status !== 'PENDING' && bet.status !== 'CANCELLED') {
      return new NextResponse(`Cannot delete bet that is already ${bet.status}`, { status: 400 })
    }

    const now = new Date()
    const bookDate = new Date(bet.book.date)
    if (now >= bookDate && bet.status === 'PENDING') {
      return new NextResponse("Cannot cancel bet after book has started", { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      let deletedTransactions = 0
      let refundAmount = 0

      const withdrawalTransaction = await tx.transaction.findFirst({
        where: {
          userId: user.id,
          type: 'withdrawal',
          amount: bet.amount,
          description: `Bet placed on ${bet.event.name} - ${bet.outcome.name}`,
          status: 'success'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const pendingDepositTransaction = await tx.transaction.findFirst({
        where: {
          id: bet.transactionId || undefined,
          userId: user.id,
          type: 'deposit',
          status: 'pending'
        }
      })

      if (withdrawalTransaction) {
        await tx.transaction.delete({
          where: { id: withdrawalTransaction.id }
        })
        deletedTransactions++
        refundAmount = bet.amount
      }

      if (pendingDepositTransaction) {
        await tx.transaction.delete({
          where: { id: pendingDepositTransaction.id }
        })
        deletedTransactions++
      }

      if (bet.status === 'PENDING') {
        await tx.outcome.update({
          where: { id: bet.outcomeId },
          data: {
            stake: {
              decrement: bet.amount
            }
          }
        })
      }

      const deletedBet = await tx.bet.delete({
        where: { id }
      })

      return {
        deletedBet,
        deletedTransactions,
        refundAmount
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Bet and related transactions deleted successfully',
      data: {
        betId: id,
        deletedTransactions: result.deletedTransactions,
        refundAmount: result.refundAmount
      }
    })

  } catch (error: any) {
    
    if (error.message?.includes('cannot be deleted')) {
      return new NextResponse(error.message, { status: 400 })
    }
    
    if (error.code === 'P2003') {
      return new NextResponse("Cannot delete bet due to database constraints", { status: 400 })
    }
    
    return new NextResponse("Internal server error", { status: 500 })
  }
}